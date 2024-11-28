import React, { useEffect, useRef, useState } from 'react';
import './Messages.css';
import * as signalR from '@microsoft/signalr';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MessageConnectionProfile from './MessageConnectionProfile/MessageConnectionProfile';
import { FaEllipsisV, FaArrowLeft } from 'react-icons/fa';
import MessageInput from "./MessageInput";
import ViewGroupProfile from "../ViewGroupProfile/ViewGroupProfile";
import GroupInvitationMessage from "./GroupInvitationMessage";

interface Attachment {
    id: number;
    fileName: string;
    fileUrl: string;
}

interface Message {
    id: number;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: string;
    isGroupInvitation: boolean;
    groupId: number | null;
    groupName?: string;
    attachments?: Attachment[];
}

interface UserProfile {
    firstName: string;
    lastName: string;
    profilePictureUrl: string;
}

const Messages: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const currentUserId = localStorage.getItem('userId');
    const [messages, setMessages] = useState<Message[]>([]);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null); // Ref for the messages container
    const token = localStorage.getItem('token');
    const [contactProfile, setContactProfile] = useState<UserProfile | null>(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1300);
    const [showBackArrow, setShowBackArrow] = useState(window.innerWidth <= 900);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [groupInfoCache, setGroupInfoCache] = useState<{ [key: number]: any }>({});
    const [isLoadingMore, setIsLoadingMore] = useState(false); // For loading state
    const [allMessagesLoaded, setAllMessagesLoaded] = useState(false); // To check if all messages are loaded
    const [nextTokenValue, setNextTokenValue] = useState<string | null>(null); // Next token for pagination

    useEffect(() => {
        // Update isMobile state on window resize
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1300);
            setShowBackArrow(window.innerWidth <= 900);
        };
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!userId) {
            fetch(`http://localhost:5001/api/Messages/GetConversations?userId=${currentUserId}`)
                .then((response) => {
                    if (!response.ok) {
                        return response.text().then((text) => {
                            console.error('Error fetching conversations:', text);
                            throw new Error(`HTTP error! status: ${response.status}`);
                        });
                    }
                    return response.json();
                })
                .then((data) => {
                    if (data.length > 0) {
                        navigate(`/messages/${data[0].userId}`);
                    } else {
                        console.warn('No conversations found.');
                    }
                })
            return;
        }

        // Fetch messages for the specified userId
        const fetchInitialMessages = async () => {
            if (!currentUserId || !userId) return;

            try {
                const response = await fetch(
                    `http://localhost:5001/api/Messages/GetChatHistory?userId=${currentUserId}&contactId=${userId}&pageSize=30`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error fetching messages:', errorText);
                    return;
                }

                const data = await response.json();
                setMessages(data.messages);
                setNextTokenValue(data.nextToken);
                console.log(`Fetched ${data.messages.length} messages. NextToken: ${data.nextToken}`);

                if (data.messages.length < 30) {
                    setAllMessagesLoaded(true);
                }

                // Scroll to bottom after initial messages load
                setTimeout(() => {
                    if (messagesEndRef.current) {
                        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
                    }
                }, 0);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchInitialMessages();

        // Fetch contact profile
        const fetchContactProfile = async () => {
            try {
                const response = await axios.get(
                    `http://localhost:5001/api/Profile/GetProfileById?userId=${userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setContactProfile(response.data);
            } catch (error) {
                console.error('Error fetching contact profile:', error);
            }
        };

        fetchContactProfile();
    }, [currentUserId, userId, token, navigate, isMobile]);

    useEffect(() => {
        let isMounted = true;

        if (userId && token) {
            // Stop the previous connection if it exists
            if (connection) {
                connection.stop();
            }

            // Create a new connection
            const newConnection = new signalR.HubConnectionBuilder()
                .withUrl('http://localhost:5001/chatHub', {
                    accessTokenFactory: () => token || '',
                })
                .withAutomaticReconnect()
                .build();

            // Start the new connection
            newConnection
                .start()
                .then(() => {
                    // Join group for this chat
                    newConnection.invoke('JoinGroup', getChatGroupId(currentUserId!, userId));

                    const handleReceiveMessage = (message: Message) => {
                        if (isMounted) {
                            setMessages((prevMessages) => {
                                // Avoid duplicates
                                if (prevMessages.some((msg) => msg.id === message.id)) {
                                    return prevMessages;
                                } else {
                                    return [...prevMessages, message];
                                }
                            });

                            // Scroll to bottom if the user is near the bottom
                            setTimeout(() => {
                                if (messagesEndRef.current) {
                                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                                }
                            }, 0);
                        }
                    };

                    newConnection.on('ReceiveMessage', handleReceiveMessage);
                })
                .catch((error) => console.error('Connection failed: ', error));

            setConnection(newConnection);

            // Cleanup function
            return () => {
                isMounted = false;
                newConnection.off('ReceiveMessage');
                newConnection.stop();
            };
        }

        // Cleanup function if userId or token is not available
        return () => {
            if (connection) {
                connection.off('ReceiveMessage');
                connection.stop();
            }
        };
    }, [userId, token, currentUserId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                showMenu &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const fetchMoreMessages = async () => {
        if (!currentUserId || !userId) return;

        if (isLoadingMore || allMessagesLoaded) return;

        setIsLoadingMore(true);

        const container = messagesContainerRef.current;
        const scrollHeightBefore = container?.scrollHeight || 0;

        try {
            const url = new URL('http://localhost:5001/api/Messages/GetChatHistory');
            url.searchParams.append('userId', currentUserId);
            url.searchParams.append('contactId', userId);
            url.searchParams.append('pageSize', '20');
            if (nextTokenValue) {
                url.searchParams.append('nextToken', nextTokenValue);
            }

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error fetching more messages:', errorText);
                setIsLoadingMore(false);
                return;
            }

            const data = await response.json();
            const newMessages: Message[] = data.messages;
            const newNextToken: string | null = data.nextToken;

            if (newMessages.length === 0) {
                setAllMessagesLoaded(true);
            } else {
                setMessages((prevMessages) => {
                    // Filter out any duplicates
                    const existingIds = new Set(prevMessages.map(msg => msg.id));
                    const filteredNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));
                    return [...filteredNewMessages, ...prevMessages];
                });

                setNextTokenValue(newNextToken);
                console.log(`Fetched ${newMessages.length} more messages. NextToken: ${newNextToken}`);
            }
        } catch (error) {
            console.error('Error fetching more messages:', error);
        }

        setIsLoadingMore(false);

        // Adjust scroll position after new messages are loaded
        setTimeout(() => {
            if (container) {
                const scrollHeightAfter = container.scrollHeight;
                const scrollDifference = scrollHeightAfter - scrollHeightBefore;
                container.scrollTop = scrollDifference;
            }
        }, 0);
    };

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (container.scrollTop === 0 && !isLoadingMore && !allMessagesLoaded) {
                // User scrolled to top
                fetchMoreMessages();
            }
        };

        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [isLoadingMore, allMessagesLoaded, nextTokenValue]);

    const handleAcceptInvitation = async (groupId: number) => {
        try {
            await axios.post(
                'http://localhost:5001/api/Groups/RespondToInvitation',
                { groupId, accept: true },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Optionally, refresh messages or group list
        } catch (error) {
            console.error('Error accepting invitation:', error);
        }
    };

    const handleDeclineInvitation = async (groupId: number) => {
        try {
            await axios.post(
                'http://localhost:5001/api/Groups/RespondToInvitation',
                { groupId, accept: false },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Optionally, refresh messages
        } catch (error) {
            console.error('Error declining invitation:', error);
        }
    };

    const getChatGroupId = (userA: string, userB: string) => {
        return userA < userB ? `${userA}-${userB}` : `${userB}-${userA}`;
    };

    const shouldShowTimestamp = (currentIndex: number): boolean => {
        if (currentIndex === messages.length - 1) {
            return true;
        }

        const currentMessage = messages[currentIndex];
        const nextMessage = messages[currentIndex + 1];

        const currentSender = currentMessage.senderId;
        const nextSender = nextMessage.senderId;

        const currentTime = new Date(currentMessage.timestamp);
        const nextTime = new Date(nextMessage.timestamp);

        const timeDiff =
            Math.abs(nextTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

        if (currentSender !== nextSender || timeDiff >= 2) {
            return true;
        }

        // Do not show timestamp
        return false;
    };

    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    const handleToggleProfileVisibility = () => {
        setShowProfile((prev) => !prev);
        setShowMenu(false);
    };

    const handleRemoveConnection = async () => {
        try {
            await axios.post(
                'http://localhost:5001/api/Connections/RemoveConnection',
                { userId: currentUserId, connectionId: userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Optionally, navigate to another page or refresh connections
            navigate('/messages');
        } catch (error) {
            console.error('Error removing connection:', error);
        }
        setShowMenu(false);
    };

    const handleUserClick = (groupId: number | null) => {
        setSelectedGroupId(groupId);
    };

    const handleCloseGroupProfile = () => {
        setSelectedGroupId(null);
    };

    return (
        <div className="messages-page">
            <div className="message-page-subset">
                {contactProfile && (
                    <div className="contact-header" onClick={handleToggleProfileVisibility}>
                        {showBackArrow && (
                            <FaArrowLeft
                                className="back-arrow"
                                onClick={() => navigate('/messages')}
                            />
                        )}
                        <div className="contact-info">
                            <img
                                src={`http://localhost:5001/${contactProfile.profilePictureUrl}`}
                                alt={`${contactProfile.firstName} ${contactProfile.lastName}`}
                                className="contact-avatar"
                            />
                            <span className="contact-name">
                                {contactProfile.firstName} {contactProfile.lastName}
                            </span>
                        </div>
                        <div className="menu-container" ref={dropdownRef}>
                            <div
                                className="messages-menu-icon cursor-pointer"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    toggleMenu();
                                }}
                            >
                                {showMenu && (
                                    <div className="messages-dropdown-menu">
                                        <button onClick={handleRemoveConnection}>
                                            Remove Connection
                                        </button>
                                        <button onClick={handleToggleProfileVisibility}>
                                            {showProfile ? 'Hide Profile' : 'Show Profile'}
                                        </button>
                                    </div>
                                )}
                                <FaEllipsisV />
                            </div>
                        </div>
                    </div>
                )}
                <div
                    className="messages-container"
                    ref={messagesContainerRef} // Attach the ref to the container
                >
                    {isMobile && showProfile ? (
                        <MessageConnectionProfile userId={userId!} />
                    ) : (
                        <>
                            {messages.length === 0 ? (
                                <></>
                            ) : (
                                messages.map((msg, index) => {
                                    const isLastMessage = index === messages.length - 1;
                                    const isCurrentUser = msg.senderId === currentUserId;
                                    return (
                                        <React.Fragment key={msg.id}>
                                            {msg.isGroupInvitation ? (
                                                <GroupInvitationMessage
                                                    msg={msg}
                                                    isCurrentUser={isCurrentUser}
                                                    contactProfile={contactProfile}
                                                    handleAcceptInvitation={handleAcceptInvitation}
                                                    handleDeclineInvitation={handleDeclineInvitation}
                                                    handleUserClick={handleUserClick}
                                                    groupInfoCache={groupInfoCache}
                                                    setGroupInfoCache={setGroupInfoCache}
                                                />
                                            ) : (
                                                <div
                                                    className={`message-bubble ${
                                                        isCurrentUser ? 'sent' : 'received'
                                                    } ${isLastMessage ? 'last-message' : ''}`}
                                                >
                                                    {/* Display attachments if any */}
                                                    {msg.attachments &&
                                                        msg.attachments.map((attachment) => (
                                                            <div
                                                                key={`${attachment.id}-${msg.id}`} // Ensure unique key
                                                                className="message-attachment"
                                                            >
                                                                {attachment.fileName
                                                                    .toLowerCase()
                                                                    .match(/\.(jpeg|jpg|gif|png|bmp|webp)$/) ? (
                                                                    <a
                                                                        href={`http://localhost:5001/${attachment.fileUrl}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        <img
                                                                            src={`http://localhost:5001/${attachment.fileUrl}`}
                                                                            alt={attachment.fileName}
                                                                            className="message-image"
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    <a
                                                                        href={`http://localhost:5001/${attachment.fileUrl}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        <div className="attachment-preview">
                                                                            <span className="attachment-filename">
                                                                                {attachment.fileName.length > 10
                                                                                    ? `${attachment.fileName.substring(
                                                                                        0,
                                                                                        10
                                                                                    )}...`
                                                                                    : attachment.fileName}
                                                                            </span>
                                                                        </div>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ))}
                                                    <p>{msg.content}</p>
                                                </div>
                                            )}
                                            {shouldShowTimestamp(index) && (
                                                <div className="message-timestamp">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                            {isLoadingMore && (
                                <div className="loading-more-messages">Loading more messages...</div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>
                {(!isMobile || !showProfile) && (
                    <>
                        <MessageInput userId={userId} />
                    </>
                )}
                {selectedGroupId && (
                    <ViewGroupProfile groupId={selectedGroupId} onClose={handleCloseGroupProfile} />
                )}
            </div>
            {!isMobile && userId && showProfile && (
                <MessageConnectionProfile userId={userId} />
            )}
        </div>
    );
};

export default Messages;
