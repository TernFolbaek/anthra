import React, { useEffect, useRef, useState } from 'react';
import './Messages.css';
import * as signalR from '@microsoft/signalr';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MessageConnectionProfile from './MessageConnectionProfile/MessageConnectionProfile';
import { FaPaperclip, FaArrowRight, FaEllipsisV } from 'react-icons/fa';
import CurrentConversations from '../CurrentConversations/CurrentConversations';

interface Message {
    id: number;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: string;
    isGroupInvitation: boolean;
    groupId?: number;
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
    const [messageInput, setMessageInput] = useState('');
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const token = localStorage.getItem('token');
    const [contactProfile, setContactProfile] = useState<UserProfile | null>(null);
    const [showProfile, setShowProfile] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Autofocus input when user starts typing
        const handleKeyDown = (event: KeyboardEvent) => {
            if (inputRef.current && !inputRef.current.contains(document.activeElement)) {
                inputRef.current.focus();
            }
            if (event.key === 'Enter') {
                sendMessage();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [messageInput]);

    useEffect(() => {
        if (!userId) {
            // If no userId, attempt to fetch the latest conversation
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

        // Initialize SignalR connection
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
    }, [currentUserId, userId, token, navigate]);

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
        // Scroll to the bottom whenever messages change
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Close dropdown when clicking outside
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

    const sendMessage = async () => {
        if (messageInput.trim() === '' || !userId) return;

        const message = {
            senderId: currentUserId,
            receiverId: userId,
            content: messageInput,
        };

        try {
            const response = await fetch('http://localhost:5001/api/Messages/SendMessage', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error sending message:', errorData);
                return;
            }

            setMessageInput('');
        } catch (error) {
            console.error('Error sending message:', error);
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

        const timeDiff = Math.abs(nextTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

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
            <CurrentConversations />
            <div className="message-page-subset">
                {contactProfile && (
                    <div className="contact-header">
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
                                    <button onClick={handleRemoveConnection}>Remove Connection</button>
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
                    {messages.length === 0 ? (
                        <p>No messages</p>
                    ) : (
                        messages.map((msg, index) => {
                            const isLastMessage = index === messages.length - 1;
                            return (
                                <React.Fragment key={msg.id}>
                                    {msg.isGroupInvitation ? (
                                        <div className="invitation-message">
                                            <h3>{msg.content}</h3>
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
                                    ) : (
                                        <div
                                            className={`message-bubble ${
                                                msg.senderId === currentUserId ? 'sent' : 'received'
                                            } ${isLastMessage ? 'last-message' : ''}`}
                                        >
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
                </div>
                <div className="message-input-container">
                    <FaPaperclip className="paperclip-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Aa"
                        disabled={!userId} // Disable input when no userId
                    />
                    <FaArrowRight onClick={sendMessage} className="send-icon" />
                </div>
            </div>
            {userId && showProfile && <MessageConnectionProfile userId={userId} />}
        </div>
    );
};

export default Messages;
