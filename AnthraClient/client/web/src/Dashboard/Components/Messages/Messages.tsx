import React, { useEffect, useRef, useState } from 'react';
import './Messages.css';
import * as signalR from '@microsoft/signalr';
import { useParams } from 'react-router-dom';
import axios from "axios";
import MessageConnectionProfile from "./MessageConnectionProfile/MessageConnectionProfile";
import { FaPaperclip, FaArrowRight } from 'react-icons/fa';

interface Message {
    id: number;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: string;
    isGroupInvitation: boolean;
    groupId?: number;
}

const Messages: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const currentUserId = localStorage.getItem('userId');
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for the scroll anchor
    const token = localStorage.getItem('token');

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
        // Get messages
        fetch(
            `http://localhost:5001/api/Messages/GetChatHistory?userId=${currentUserId}&contactId=${userId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
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
    }, [currentUserId, userId, token]);

    useEffect(() => {
        if (connection) {
            connection
                .start()
                .then(() => {
                    // Join group for this chat
                    if (userId !== undefined) {
                        connection.invoke('JoinGroup', getChatGroupId(currentUserId!, userId));
                    }

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
        if (messageInput.trim() === '') return;

        const message = {
            senderId: currentUserId,
            receiverId: userId,
            content: messageInput,
        };

        console.log(message);

        try {
            const response = await fetch('http://localhost:5001/api/Messages/SendMessage', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
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
            // Always show timestamp for the last message
            return true;
        }

        const currentMessage = messages[currentIndex];
        const nextMessage = messages[currentIndex + 1];

        const currentSender = currentMessage.senderId;
        const nextSender = nextMessage.senderId;

        const currentTime = new Date(currentMessage.timestamp);
        const nextTime = new Date(nextMessage.timestamp);

        const timeDiff = Math.abs(nextTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60); // Time difference in hours

        if (currentSender !== nextSender) {
            // Show timestamp if the next message is from a different sender
            return true;
        }

        if (timeDiff >= 2) {
            // Show timestamp if more than 2 hours have passed between messages
            return true;
        }

        // Do not show timestamp
        return false;
    };

    return (
        <div className="messages-page">
            <div className="message-page-subset">
                <div className="messages-container">
                    {messages.map((msg, index) => {
                        const isLastMessage = index === messages.length - 1;
                        return (
                            <React.Fragment key={msg.id}>
                                {msg.isGroupInvitation ? (
                                    <div className="invitation-message">
                                        <h3>{msg.content}</h3>
                                        <div className="invitation-buttons">
                                            <button className="invitation-accept-button"
                                                    onClick={() => handleAcceptInvitation(msg.groupId!)}>Accept
                                            </button>
                                            <button className="invitation-decline-button"
                                                    onClick={() => handleDeclineInvitation(msg.groupId!)}>Decline
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className={`message-bubble ${msg.senderId === currentUserId ? 'sent' : 'received'} ${isLastMessage ? 'last-message' : ''}`}
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
                    })}
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
                    />
                    <FaArrowRight onClick={sendMessage} className="send-icon" />
                </div>
            </div>
            <MessageConnectionProfile userId={userId!} />
        </div>
    );
};

export default Messages;
