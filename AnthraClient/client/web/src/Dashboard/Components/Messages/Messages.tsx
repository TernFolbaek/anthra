import React, { useEffect, useState } from 'react';
import './Messages.css';
import * as signalR from '@microsoft/signalr';
import { useParams } from 'react-router-dom';

interface Message {
    id: number;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: string;
}

const Messages: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const currentUserId = localStorage.getItem('userId');
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    useEffect(() => {
        // Get messages
        fetch(`http://localhost:5001/api/Messages/GetChatHistory?userId=${currentUserId}&contactId=${userId}`)
            .then((response) => response.json())
            .then((data) => setMessages(data))
            .catch((error) => console.error('Error fetching messages:', error));

        // Initialize SignalR connection
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl('http://localhost:5001/chatHub')
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, [currentUserId, userId]);

    useEffect(() => {
        if (connection) {
            connection
                .start()
                .then(() => {
                    console.log('Connected to SignalR hub');

                    // Join group for this chat
                    if(userId!== undefined){
                        connection.invoke('JoinGroup', getChatGroupId(currentUserId!, userId));
                    }

                    connection.on('ReceiveMessage', (message: Message) => {
                        setMessages((prevMessages) => [...prevMessages, message]);
                    });
                })
                .catch((error) => console.error('Connection failed: ', error));
        }
    }, [connection, currentUserId, userId]);

    const sendMessage = async () => {
        if (messageInput.trim() === '') return;

        const message = {
            senderId: currentUserId,
            receiverId: userId,
            content: messageInput,
        };

        console.log('Sending message:', message);


        try {
            const response = await fetch('http://localhost:5001/api/Messages/SendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error sending message:', errorData);
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
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`message-bubble ${
                            msg.senderId === currentUserId ? 'sent' : 'received'
                        }`}
                    >
                        <p>{msg.content}</p>
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                ))}
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
