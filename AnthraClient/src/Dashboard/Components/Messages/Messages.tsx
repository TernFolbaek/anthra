import React, { useEffect, useRef, useState } from 'react';
import './Messages.css';
import * as signalR from '@microsoft/signalr';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MessageConnectionProfile from './MessageConnectionProfile/MessageConnectionProfile';
import {
    FaEllipsisV, FaArrowLeft, FaUserMinus, FaInfo,
    FaFilePdf, FaFileWord, FaFileExcel, FaFileAlt
} from 'react-icons/fa';
import MessageInput from "./MessageInput";
import ViewGroupProfile from "../ViewGroupProfile/ViewGroupProfile";
import GroupInvitationMessage from "./GroupInvitationMessage";
import ReferralCardMessage from "./ReferralCardMessage";
import { Message, InvitationActionType, UserProfile } from '../types/types';

interface Attachment {
    id: number;
    fileName: string;
    fileUrl: string;
}

function isImageFileName(fileName: string) {
    return /\.(jpeg|jpg|gif|png|bmp|webp)$/i.test(fileName);
}

function getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return (parts.pop() || '').toLowerCase();
}

function getFileIcon(extension: string) {
    switch (extension) {
        case 'pdf':
            return <FaFilePdf className="file-icon pdf" />;
        case 'doc':
        case 'docx':
            return <FaFileWord className="file-icon word" />;
        case 'xls':
        case 'xlsx':
            return <FaFileExcel className="file-icon excel" />;
        default:
            return <FaFileAlt className="file-icon generic" />;
    }
}

const Messages: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();

    const currentUserId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    const [messages, setMessages] = useState<Message[]>([]);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const [contactProfile, setContactProfile] = useState<UserProfile | null>(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1300);
    const [showBackArrow, setShowBackArrow] = useState(window.innerWidth <= 900);

    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [groupInfoCache, setGroupInfoCache] = useState<{ [key: number]: any }>({});

    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
    const [nextTokenValue, setNextTokenValue] = useState<string | null>(null);
    const [firstLoad, setFirstLoad] = useState(true);

    // -------------------------------------------
    // Resize handling
    // -------------------------------------------
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1300);
            setShowBackArrow(window.innerWidth <= 900);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // -------------------------------------------
    // Fetch initial messages & contact
    // -------------------------------------------
    useEffect(() => {
        if (!userId) {
            // If no userId in route, fetch conversations
            fetch(`https://api.anthra.dk/api/Messages/GetConversations?userId=${currentUserId}`)
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
                        setMessages([]);
                        console.warn('No conversations found.');
                    }
                });
            return;
        }

        // If we have a userId, fetch chat history
        const fetchInitialMessages = async () => {
            if (!currentUserId || !userId) return;
            try {
                const response = await fetch(
                    `https://api.anthra.dk/api/Messages/GetChatHistory?userId=${currentUserId}&contactId=${userId}&pageSize=30`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error fetching messages:', errorText);
                    return;
                }

                const data = await response.json();
                setMessages(data.messages);
                setNextTokenValue(data.nextToken);

                if (data.messages.length < 30) {
                    setAllMessagesLoaded(true);
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        setAllMessagesLoaded(false);
        fetchInitialMessages();

        const fetchContactProfile = async () => {
            try {
                const response = await axios.get(
                    `https://api.anthra.dk/api/Profile/GetProfileById?userId=${userId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setContactProfile(response.data);
            } catch (error) {
                console.error('Error fetching contact profile:', error);
            }
        };
        fetchContactProfile();
    }, [currentUserId, userId, token, navigate, isMobile]);

    // -------------------------------------------
    // SignalR connection
    // -------------------------------------------
    useEffect(() => {
        let isMounted = true;

        if (userId && token) {
            if (connection) {
                connection.stop();
            }

            const newConnection = new signalR.HubConnectionBuilder()
                .withUrl('https://api.anthra.dk/chatHub', {
                    accessTokenFactory: () => token || '',
                })
                .withAutomaticReconnect()
                .build();

            newConnection
                .start()
                .then(() => {
                    newConnection.invoke('JoinGroup', getChatGroupId(currentUserId!, userId));
                    const handleReceiveMessage = (incomingMessage: Message) => {
                        if (isMounted) {
                            setMessages((prev) => {
                                if (prev.some((msg) => msg.id === incomingMessage.id)) {
                                    return prev;
                                }
                                return [...prev, incomingMessage];
                            });
                        }
                    };
                    newConnection.on('ReceiveMessage', handleReceiveMessage);
                })
                .catch((error) => console.error('Connection failed: ', error));

            setConnection(newConnection);

            return () => {
                isMounted = false;
                newConnection.off('ReceiveMessage');
                newConnection.stop();
            };
        }

        return () => {
            if (connection) {
                connection.off('ReceiveMessage');
                connection.stop();
            }
        };
    }, [userId, token, currentUserId]);

    // -------------------------------------------
    // Menu click outside
    // -------------------------------------------
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showMenu && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    // -------------------------------------------
    // Connection events (UpdateMessage, ReceiveMessage)
    // -------------------------------------------
    useEffect(() => {
        if (connection) {
            connection.on('UpdateMessage', (updatedMessage: Message) => {
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.id === updatedMessage.id
                            ? {
                                ...msg,
                                invitationStatus: updatedMessage.invitationStatus,
                                actionType: updatedMessage.actionType
                            }
                            : msg
                    )
                );
            });

            connection.on('ReceiveMessage', (incomingMessage: Message) => {
                setMessages(prev => [...prev, incomingMessage]);
            });
        }
        return () => {
            if (connection) {
                connection.off('UpdateMessage');
                connection.off('ReceiveMessage');
            }
        };
    }, [connection]);

    // -------------------------------------------
    // Infinite scroll / fetch more
    // -------------------------------------------
    const fetchMoreMessages = async () => {
        setFirstLoad(false);
        if (!currentUserId || !userId) return;
        if (isLoadingMore || allMessagesLoaded) return;

        setIsLoadingMore(true);
        const container = messagesContainerRef.current;
        const scrollHeightBefore = container?.scrollHeight || 0;

        try {
            const url = new URL('https://api.anthra.dk/api/Messages/GetChatHistory');
            url.searchParams.append('userId', currentUserId);
            url.searchParams.append('contactId', userId);
            url.searchParams.append('pageSize', '20');
            if (nextTokenValue) url.searchParams.append('nextToken', nextTokenValue);

            const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
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
                setMessages(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const filtered = newMessages.filter(m => !existingIds.has(m.id));
                    return [...filtered, ...prev];
                });
                setNextTokenValue(newNextToken);
            }
        } catch (error) {
            console.error('Error fetching more messages:', error);
        }

        setIsLoadingMore(false);

        // Adjust scroll to preserve position
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
                fetchMoreMessages();
            }
        };
        container.addEventListener('scroll', handleScroll);
        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [isLoadingMore, allMessagesLoaded, nextTokenValue]);

    // -------------------------------------------
    // Scroll on container resize
    // -------------------------------------------
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // For rendering completion
    const handleMessageRendered = () => {
        if (firstLoad) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // -------------------------------------------
    // Group invitation logic
    // -------------------------------------------
    const handleAcceptInvitation = async (groupId: number, messageId: number) => {
        try {
            const response = await axios.post(
                'https://api.anthra.dk/api/Groups/RespondToInvitation',
                { groupId, Accept: true },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const updatedMessage: Message = response.data;
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === updatedMessage.id
                        ? { ...msg, invitationStatus: updatedMessage.invitationStatus, actionType: updatedMessage.actionType }
                        : msg
                )
            );
        } catch (error) {
            console.error('Error accepting group invitation:', error);
        }
    };

    const handleDeclineInvitation = async (groupId: number, messageId: number) => {
        try {
            const response = await axios.post(
                'https://api.anthra.dk/api/Groups/RespondToInvitation',
                { groupId, Accept: false },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const updatedMessage: Message = response.data;
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === updatedMessage.id
                        ? { ...msg, invitationStatus: updatedMessage.invitationStatus, actionType: updatedMessage.actionType }
                        : msg
                )
            );
        } catch (error) {
            console.error('Error declining group invitation:', error);
        }
    };

    // -------------------------------------------
    // Helper: Chat group ID
    // -------------------------------------------
    const getChatGroupId = (userA: string, userB: string) => {
        return userA < userB ? `${userA}-${userB}` : `${userB}-${userA}`;
    };

    // -------------------------------------------
    // Show or hide timestamp logic
    // -------------------------------------------
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

        const timeDiffHours = Math.abs(nextTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

        if (currentSender !== nextSender || timeDiffHours >= 2) {
            return true;
        }
        return false;
    };

    // -------------------------------------------
    // Menu & profile
    // -------------------------------------------
    const toggleMenu = () => setShowMenu(!showMenu);
    const handleToggleProfileVisibility = () => {
        setShowProfile(p => !p);
        setShowMenu(false);
    };

    const handleRemoveConnection = async () => {
        try {
            await axios.post(
                'https://api.anthra.dk/api/Connections/RemoveConnection',
                { userId: currentUserId, connectionId: userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            navigate('/messages');
        } catch (error) {
            console.error('Error removing connection:', error);
        }
        setShowMenu(false);
    };

    // -------------------------------------------
    // Group profile
    // -------------------------------------------
    const handleUserClick = (groupId: number | null) => {
        setSelectedGroupId(groupId);
    };
    const handleCloseGroupProfile = () => {
        setSelectedGroupId(null);
    };

    // -------------------------------------------
    // Referral
    // -------------------------------------------
    const handleReferralConnect = async (referredUserId: string) => {
        try {
            await axios.post(
                'https://api.anthra.dk/api/Connections/SendRequest',
                { targetUserId: referredUserId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error(error);
        }
    };
    const handleReferralSkip = (referredUserId: string) => {
        // handle skip if needed
    };

    // -------------------------------------------
    // Rendering
    // -------------------------------------------
    return (
        <div className="messages-page">
            <div className="message-page-subset">
                {contactProfile && (
                    <div className="contact-header" onClick={handleToggleProfileVisibility}>
                        {showBackArrow && (
                            <FaArrowLeft className="back-arrow" onClick={() => navigate('/messages')} />
                        )}
                        <div className="contact-info">
                            <img
                                src={`${contactProfile.profilePictureUrl}`}
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMenu();
                                }}
                            >
                                {showMenu && (
                                    <div className="messages-dropdown-menu">
                                        <button
                                            className="flex items-center gap-2 font-medium text-black dark:text-white text-sm"
                                            onClick={handleRemoveConnection}
                                        >
                                            <FaUserMinus />
                                            <div>Remove Connection</div>
                                        </button>
                                        <button
                                            className="flex gap-2 items-center font-medium text-black dark:text-white text-sm"
                                            onClick={handleToggleProfileVisibility}
                                        >
                                            <FaInfo />
                                            <div>{showProfile ? 'Hide Profile' : 'Show Profile'}</div>
                                        </button>
                                    </div>
                                )}
                                <FaEllipsisV />
                            </div>
                        </div>
                    </div>
                )}

                <div className="messages-container" ref={messagesContainerRef}>
                    {isMobile && showProfile ? (
                        <MessageConnectionProfile userId={userId!} />
                    ) : (
                        <>
                            {!userId ? (
                                <div className="h-full w-full flex items-center justify-center">
                                    <p className="dark:text-white text-base font-bold">No Messages</p>
                                </div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isLastMessage = index === messages.length - 1;
                                    const isCurrentUser = msg.receiverId === currentUserId;

                                    return (
                                        <React.Fragment key={msg.id}>
                                            {msg.isReferralCard ? (
                                                <div className="message-wrapper">
                                                    <ReferralCardMessage
                                                        msg={msg}
                                                        isCurrentUser={isCurrentUser}
                                                        onConnect={handleReferralConnect}
                                                        onSkip={handleReferralSkip}
                                                        onRenderComplete={handleMessageRendered}
                                                    />
                                                </div>
                                            ) : msg.isGroupInvitation ? (
                                                <div className="message-wrapper">
                                                    <GroupInvitationMessage
                                                        msg={{
                                                            ...msg,
                                                            actionType: msg.actionType ?? InvitationActionType.None,
                                                            invitationStatus: msg.invitationStatus ?? false,
                                                        }}
                                                        isCurrentUser={isCurrentUser}
                                                        contactProfile={contactProfile}
                                                        handleAcceptInvitation={() => handleAcceptInvitation(msg.groupId!, msg.id)}
                                                        handleDeclineInvitation={() => handleDeclineInvitation(msg.groupId!, msg.id)}
                                                        handleUserClick={handleUserClick}
                                                        groupInfoCache={groupInfoCache}
                                                        setGroupInfoCache={setGroupInfoCache}
                                                        onRenderComplete={handleMessageRendered}
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    className={`message-bubble ${
                                                        isCurrentUser ? 'received' : 'sent'
                                                    } ${isLastMessage ? 'last-message' : ''}`}
                                                >
                                                    {/* Render attachments if present */}
                                                    {msg.attachments?.map((attachment) => {
                                                        const ext = getFileExtension(attachment.fileName);
                                                        const isImage = isImageFileName(attachment.fileName);

                                                        // If your server returns a FULL Azure URL, use "attachment.fileUrl" directly.
                                                        // If your server returns a relative path, you might do `href={'http://localhost:8080/' + attachment.fileUrl}`
                                                        const fileHref = attachment.fileUrl;

                                                        return (
                                                            <div
                                                                key={`${attachment.id}-${msg.id}`}
                                                                className="message-attachment"
                                                            >
                                                                {isImage ? (
                                                                    <a href={fileHref} target="_blank" rel="noopener noreferrer">
                                                                        <img
                                                                            src={fileHref}
                                                                            alt={attachment.fileName}
                                                                            className="message-image"
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    <a
                                                                        href={fileHref}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        download
                                                                    >
                                                                        <div className="attachment-preview">
                                                                            {getFileIcon(ext)}
                                                                            <span className="attachment-filename">
                                        {attachment.fileName.length > 10
                                            ? `${attachment.fileName.substring(0, 10)}...`
                                            : attachment.fileName}
                                      </span>
                                                                        </div>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    <p>{msg.content || ""}</p>
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
                                <div className="loading-more-messages"></div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {userId && (!isMobile || !showProfile) && (
                    <MessageInput userId={userId} />
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
