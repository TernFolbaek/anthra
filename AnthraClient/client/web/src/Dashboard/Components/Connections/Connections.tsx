import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Connections.css';
import { useNavigate } from 'react-router-dom';
import NoConnectionsRive from "../../Helpers/Animations/NoConnections";

interface ApplicationUser {
    id: string;
    firstName: string;
    profilePictureUrl: string;
    connectedAt: string;
}

interface Conversation {
    userId: string;
    FirstName: string;
    UserProfilePicture: string;
    LastMessageContent: string;
    LastMessageTimestamp: string;
    LastMessageSenderId: string;
}
const Connections: React.FC = () => {
    const [usersWithConversations, setUsersWithConversations] = useState<ApplicationUser[]>([]);
    const [usersWithoutConversations, setUsersWithoutConversations] = useState<ApplicationUser[]>([]);

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

                // Compare IDs correctly (case-sensitive and exact match)
                const usersWithConversations = connectedUsers.filter(user =>
                    conversationData.some(conversation => conversation.userId === user.id)
                );

                const usersWithoutConversations = connectedUsers.filter(user =>
                    !conversationData.some(conversation => conversation.userId === user.id)
                );

                setUsersWithConversations(usersWithConversations);
                setUsersWithoutConversations(usersWithoutConversations);

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
            <div className="connections-container">
                {usersWithConversations.length === 0 && usersWithoutConversations.length === 0 ? (
                    <NoConnectionsRive />
                ) : (
                    <div className="connections-columns">
                        <div className="connections-column">
                            <h2 className="connections-title">Ongoing Conversations</h2>
                            {usersWithConversations.length === 0 ? (
                                <div className="connections-list">
                                    <p className="p-2 text-center font-bold text-gray-500">No conversations yet</p>
                                </div>
                            ) : (
                                <ul className="connections-list">
                                    {usersWithConversations.map((user) => (
                                        <li key={user.id} className="connection-item" onClick={() => navigate(`/messages/${user.id}`)}>
                                            <div className="connection-info">
                                                <img
                                                    src={`http://localhost:5001${user.profilePictureUrl}`}
                                                    alt={`${user.firstName}`}
                                                    className="connection-profile-picture"
                                                />
                                                <span className="connection-name">{user.firstName}</span>
                                            </div>
                                            <div className="connection-menu">
                                                <button className="menu-button">
                                                    <span className="connections-menu-icon">⋮</span>
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Right Column: New Connections */}
                        <div className="connections-column">
                            <h2 className="connections-title">New Connections</h2>
                            {usersWithoutConversations.length === 0 ? (
                                <div className="connections-list">
                                    <NoConnectionsRive/>
                                </div>) : (
                                <ul className="connections-list">
                                {usersWithoutConversations.map((user) => (
                                        <li key={user.id} className="connection-item">
                                            <div className="connection-info">
                                                <img
                                                    src={`http://localhost:5001${user.profilePictureUrl}`}
                                                    alt={`${user.firstName}`}
                                                    className="connection-profile-picture"
                                                />
                                                <span className="connection-name">{user.firstName}</span>
                                            </div>
                                            <button
                                                className="message-button"
                                                onClick={() => navigate(`/messages/${user.id}`)}
                                            >
                                                Message
                                            </button>
                                            <div className="connection-menu">
                                                <button className="menu-button">
                                                    <span className="connections-menu-icon">⋮</span>
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Connections;
