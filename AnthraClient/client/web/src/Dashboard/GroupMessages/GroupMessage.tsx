import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './GroupMessage.css';
import { useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';

interface Message {
    id: number;
    content: string;
    timestamp: string;
    senderId: string;
    senderFirstName: string;
    senderProfilePictureUrl: string;
    groupId: number;
}

interface GroupMessageProps {
    groupId: number;
}

const GroupMessage: React.FC<GroupMessageProps> = ({ groupId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [groupName, setGroupName] = useState('');
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();
    const previousGroupIdRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        fetchGroupDetails();
        fetchMessages();
    }, [groupId]);

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl('http://localhost:5001/chatHub', {
                accessTokenFactory: () => token || '',
            })
            .withAutomaticReconnect()
            .build();

        connectionRef.current = connection;

        connection.on('ReceiveGroupMessage', (message: Message) => {
            if (message.groupId === groupId) {
                setMessages((prevMessages) => [...prevMessages, message]);
                scrollToBottom();
            }
        });

        connection
            .start()
            .then(() => {
                console.log('SignalR connection established.');
                if (groupId) {
                    connection.invoke('JoinGroup', `Group_${groupId}`);
                    previousGroupIdRef.current = groupId;
                }
            })
            .catch((error) => console.error('Connection failed: ', error));

        return () => {
            if (connectionRef.current) {
                connectionRef.current.off('ReceiveGroupMessage');
                connectionRef.current.stop();
            }
        };
    }, []);

    useEffect(() => {
        const joinGroup = async () => {
            if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
                if (previousGroupIdRef.current && previousGroupIdRef.current !== groupId) {
                    await connectionRef.current.invoke('LeaveGroup', `Group_${previousGroupIdRef.current}`);
                }

                if (groupId) {
                    await connectionRef.current.invoke('JoinGroup', `Group_${groupId}`);
                    previousGroupIdRef.current = groupId;
                } else {
                    console.error('Group ID is undefined');
                }
            }
        };

        joinGroup();
    }, [groupId]);

    const fetchGroupDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5001/api/Groups/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setGroupName(response.data.name);
        } catch (error) {
            console.error('Error fetching group details:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/GroupMessages/GetGroupChatHistory', {
                params: { groupId },
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessages(response.data);
            scrollToBottom();
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async () => {
        if (!groupId || !userId) {
            console.error('Group ID or user ID is undefined');
            return;
        }

        if (newMessage.trim() === '') return;

        const message = {
            senderId: userId,
            content: newMessage,
            groupId: groupId,
        };

        try {
            await axios.post('http://localhost:5001/api/GroupMessages/SendGroupMessage', message, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

        return false;
    };

    return (
        <div className="group-message-container">
            <div className="group-message-list">
                {messages.map((message, index) => {
                    const previousMessage = messages[index - 1];
                    const showSenderInfo = !previousMessage || previousMessage.senderId !== message.senderId;
                    const isCurrentUser = message.senderId === userId;
                    const isLastMessage = shouldShowTimestamp(index);

                    return (
                        <div key={message.id} className={`group-message-item ${isCurrentUser ? 'group-message-own' : ''}`}>
                            {showSenderInfo && !isCurrentUser && (
                                <div className={`group-message-sender-info`}>
                                    <img
                                        className="group-message-sender-avatar"
                                        src={`http://localhost:5001${message.senderProfilePictureUrl}`}
                                        alt={message.senderFirstName}
                                    />
                                    <span className="group-message-sender-name">{message.senderFirstName}</span>
                                </div>
                            )}
                            <div
                                className={`${
                                    isCurrentUser ? 'group-message-content-own' : 'group-message-content-other'
                                } ${isLastMessage ? 'last-message' : ''}`}
                            >
                                <p>{message.content}</p>
                            </div>
                            {isLastMessage && (
                                <div className="group-message-timestamp">
                                    {new Date(message.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="group-message-input-container">
                <input
                    type="text"
                    className="group-message-input"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button className="group-message-send-button" onClick={sendMessage}>
                    Send
                </button>
            </div>
        </div>
    );
};

export default GroupMessage;
