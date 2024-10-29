import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CurrentConversations.css';

interface Conversation {
    participantId: string;
    participantFirstName: string;
    participantProfilePictureUrl: string;
    lastMessageContent: string;
    lastMessageTimestamp: string;
    lastMessageSenderId: string;
}

const CurrentConversations: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
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
        <div className="conversations-container">
            <h2>Conversations</h2>
            {conversations.length === 0 ? (
                <p>You have no conversations yet.</p>
            ) : (
                <ul className="conversations-list">
                    {conversations.map((conv) => (
                        <li
                            key={conv.participantId}
                            className="conversation-item"
                            onClick={() => navigate(`/messages/${conv.participantId}`)}
                        >
                            <img
                                src={`http://localhost:5001${conv.participantProfilePictureUrl}`}
                                alt={conv.participantFirstName}
                                className="conversation-profile-picture"
                            />
                            <div className="conversation-details">
                                <h3>{conv.participantFirstName}</h3>
                                <p className="last-message">{conv.lastMessageContent}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CurrentConversations;
