import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CurrentConversations.css';
import CardContainer from '../CardContainer/CardContainer';
import NoConversationsRive from "../../Helpers/Animations/NoConversations";

interface Conversation {
    userId: string;
    userName: string;
    firstName: string;
    userProfilePicture: string;
    lastMessageContent: string;
    lastMessageTimestamp: string;
    lastMessageSenderId: string;
}

const CurrentConversations: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const currentUserId = localStorage.getItem('userId');
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUserId) {
            console.error('User ID not found in localStorage.');
            setError('User ID not found.');
            return;
        }

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
                setConversations(data);
                setLoading(false);

                // Automatically select the latest conversation after data is fetched
                if (data.length > 0) {
                    setSelectedConversationId(data[0].userId);
                }
            })
            .catch((error) => {
                console.error('Error fetching conversations:', error);
                setError('Failed to fetch conversations. Please try again later.');
                setLoading(false);
            });
    }, [currentUserId]);

    if (loading) {
        return <div className="conversations-loading">Loading conversations...</div>;
    }

    if (error) {
        return <div className="conversations-error">{error}</div>;
    }

    return (
        <CardContainer title="Chats">
            {conversations.length === 0 ? (
               <NoConversationsRive />
            ) : (
                <ul className="conversations-list">
                    {conversations.map((conv) => (
                        <li
                            key={conv.userId}
                            className={`conversation-item ${
                                selectedConversationId === conv.userId ? 'selected' : ''
                            }`}
                            onClick={() => {
                                setSelectedConversationId(conv.userId);
                                navigate(`/messages/${conv.userId}`);
                            }}
                        >
                            <img
                                src={`http://localhost:5001${conv.userProfilePicture}`}
                                alt={conv.userName}
                                className="conversation-profile-picture"
                            />
                            <div className="conversation-details">
                                <h3>{conv.firstName}</h3>
                                <p className="last-message">
                                    {conv.lastMessageContent.length > 15
                                        ? `${conv.lastMessageContent.substring(0, 10)}...`
                                        : conv.lastMessageContent}
                                </p>
                            </div>
                            <p className="conversation-timestamp">
                                {new Date(conv.lastMessageTimestamp).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'numeric',
                                    year: 'numeric'
                                })}{" "}
                                {new Date(conv.lastMessageTimestamp).toLocaleTimeString('en-GB', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </CardContainer>
    );
};

export default CurrentConversations;
