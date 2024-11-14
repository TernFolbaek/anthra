// Components/Messages/Messages.tsx
import React, { useEffect, useRef, useState } from 'react';
import './Messages.css';
import * as signalR from '@microsoft/signalr';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MessageConnectionProfile from './MessageConnectionProfile/MessageConnectionProfile';
import {
    FaEllipsisV,
    FaArrowLeft,
} from 'react-icons/fa';
import MessageInput from "./MessageInput";

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
    groupId?: number;
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
    const [connection, setConnection] = useState<signalR.HubConnection | null>(
        null
    );
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const token = localStorage.getItem('token');
    const [contactProfile, setContactProfile] = useState<UserProfile | null>(
        null
    );
    const [showProfile, setShowProfile] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
    useEffect(() => {
        // Update isMobile state on window resize
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 900);
        };
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);


    useEffect(() => {
        if (!userId) {
                const fetchLatestConversation = async () => {
                    try {
                        const response = await fetch(
                            `http://localhost:5001/api/Messages/GetLatestConversation?userId=${currentUserId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );
                        if (response.ok) {
                            console.log(response.body);
                            const latestConversation = await response.json();
                            navigate(`/messages/${latestConversation.userId}`);
                        } else if (response.status === 404) {
                            // No conversations found
                            setMessages([]);
                        } else {
                            console.error('Error fetching latest conversation.');
                        }
                    } catch (error) {
                        console.error('Error fetching latest conversation:', error);
                    }
                };

                fetchLatestConversation();
                return;
        }

        // Fetch messages for the specified userId
        fetch(
            `http://localhost:5001/api/Messages/GetChatHistory?userId=${currentUserId}&contactId=${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )
            .then((response) => response.json())
            .then((data) => setMessages(data))
            .catch((error) => console.error('Error fetching messages:', error));

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl('http://localhost:5001/chatHub', {
                accessTokenFactory: () => token || '',
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);

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
        if (connection && userId) {
            connection
                .start()
                .then(() => {
                    // Join group for this chat
                    connection.invoke('JoinGroup', getChatGroupId(currentUserId!, userId));

                    connection.on('ReceiveMessage', (message: Message) => {
                        setMessages((prevMessages) => [...prevMessages, message]);
                    });
                })
                .catch((error) => console.error('Connection failed: ', error));
        }
    }, [connection, currentUserId, userId]);


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

    const handleAcceptInvitation = async (groupId: number) => {
        try {
            await axios.post(
                'http://localhost:5001/api/Groups/RespondToInvitation',
                { groupId, accept: true },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Refresh messages or group list
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
            // Refresh messages
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

    return (
        <div className="messages-page">
            <div className="message-page-subset">
                {contactProfile && (
                    <div className="contact-header" onClick={()=>setShowProfile((prev) => !prev)}>
                        {isMobile && (
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
                        <div className="menu-icon" onClick={toggleMenu}>
                            {showMenu && (
                                <div className="messages-dropdown-menu" ref={dropdownRef}>
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
                )}
                <div className="messages-container">
                    {isMobile && showProfile ? (
                        <MessageConnectionProfile userId={userId!} />
                    ) : (
                        <>
                            {messages.length === 0 ? (
                                <p>No messages</p>
                            ) : (
                                messages.map((msg, index) => {
                                    const isLastMessage = index === messages.length - 1;
                                    const isCurrentUser = msg.senderId === currentUserId;
                                    return (
                                        <React.Fragment key={msg.id}>
                                            {msg.isGroupInvitation ? (
                                                msg.senderId === currentUserId ? (
                                                    <div className="invitation-message">
                                                        <p>You have invited <span className="font-bold">{contactProfile?.firstName}</span> to join group: <span className="font-bold">{msg.groupName}</span></p>
                                                    </div>
                                                ) : (
                                                    <div className="invitation-message">
                                                        <p><span className="font-bold">{contactProfile?.firstName}</span> has invited you to join group: <span className="font-bold">{msg.groupName}</span></p>
                                                        <div className="invitation-buttons">
                                                            <button
                                                                className="invitation-accept-button"
                                                                onClick={() => handleAcceptInvitation(msg.groupId!)}
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                className="invitation-decline-button"
                                                                onClick={() => handleDeclineInvitation(msg.groupId!)}
                                                            >
                                                                Decline
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
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
                                                                key={attachment.id}
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
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>
                {(!isMobile || !showProfile) && (
                    <>
                        <MessageInput userId={userId}/>
                    </>
                )}
            </div>
            {!isMobile && userId && showProfile && (
                <MessageConnectionProfile userId={userId} />
            )}
        </div>
    );
};

export default Messages;
