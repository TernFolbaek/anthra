import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Connections.css';
import { useNavigate } from 'react-router-dom';
import CurrentConversations from '../CurrentConversations/CurrentConversations';

interface ApplicationUser {
    id: string;
    firstName: string;
    profilePictureUrl: string;
    connectedAt: string;
}

interface Conversation {
    participantId: string;
    participantFirstName: string;
    participantProfilePictureUrl: string;
    lastMessageContent: string;
    lastMessageTimestamp: string;
    lastMessageSenderId: string;
}

const Connections: React.FC = () => {
    const [connections, setConnections] = useState<ApplicationUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [connectionsResponse, conversationsResponse] = await Promise.all([
                    axios.get('http://localhost:5001/api/Connections/List', {
                        params: {
                            userId: userId,
                        },
                        withCredentials: true,
                    }),
                    axios.get(`http://localhost:5001/api/Messages/GetConversations?userId=${userId}`),
                ]);

                const connectedUsers: ApplicationUser[] = connectionsResponse.data;
                const conversationData: Conversation[] = conversationsResponse.data;

                // Get participant IDs from conversations
                const conversationParticipantIds = conversationData.map((conv) => conv.participantId);

                // Exclude users who are already in conversations
                const filteredConnections = connectedUsers.filter(
                    (user) => !conversationParticipantIds.includes(user.id)
                );

                setConnections(filteredConnections);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to fetch data. Please try again later.');
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    if (loading) {
        return <div className="connections-loading">Loading connections...</div>;
    }

    if (error) {
        return <div className="connections-error">{error}</div>;
    }

    return (
        <div className="connections-page">
            <CurrentConversations />
            <div className="connections-container">
                {connections.length === 0 ? (
                    <p>You have no new connections.</p>
                ) : (
                    <div className="connections-grid">
                        {connections.map((user) => (
                            <div key={user.id} className="connection-card">
                                <img
                                    src={`http://localhost:5001${user.profilePictureUrl}`}
                                    alt={`${user.firstName}`}
                                    className="connection-profile-picture"
                                />
                                <h3>{user.firstName}</h3>
                                <div className="button-container">
                                    <button
                                        className="message-button"
                                        onClick={() => {
                                            navigate(`/messages/${user.id}`);
                                        }}
                                    >
                                        Message
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Connections;
