// Messages.tsx
import React, { useEffect, useState } from 'react';
import './Messages.css';
import * as signalR from '@microsoft/signalr';
import { useParams } from 'react-router-dom';
import axios from "axios";

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
    const token = localStorage.getItem('token');

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
            .withUrl('http://localhost:5001/chatHub')
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

    return (
        <div className="messages-page">
            <div className="messages-container">
                {messages.map((msg) =>
                    msg.isGroupInvitation ? (
                        <div className="invitation-message" key={msg.id}>
                            <h3>{msg.content}</h3>
                            <div className="invitation-buttons">
                                <button className="invitation-accept-button" onClick={() => handleAcceptInvitation(msg.groupId!)}>Accept</button>
                                <button className="invitation-decline-button" onClick={() => handleDeclineInvitation(msg.groupId!)}>Decline</button>
                            </div>

                        </div>
                    ) : (
                        <div
                            key={msg.id}
                            className={`message-bubble ${
                                msg.senderId === currentUserId ? 'sent' : 'received'
                            }`}
                        >
                            <p>{msg.content}</p>
                            <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                    )
                )}
            </div>
            <div className="message-input-container">
                <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );

};

export default Messages;
