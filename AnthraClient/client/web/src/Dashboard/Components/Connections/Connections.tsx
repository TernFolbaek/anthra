import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './Connections.css';
import { useNavigate } from 'react-router-dom';
import NoConnectionsRive from "../../Helpers/Animations/NoConnections";
import ViewProfile from '../ViewProfile/ViewProfile';
import { FaEllipsisV, FaUserMinus } from 'react-icons/fa';

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

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [openMenuConnectionId, setOpenMenuConnectionId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // New state variables for responsiveness and tab selection
    const [screenWidth, setScreenWidth] = useState<number>(window.innerWidth);
    const [selectedTab, setSelectedTab] = useState<'conversations' | 'connections'>('conversations');

    const handleUserClick = (userId: string) => {
        setSelectedUserId(userId);
    };

    const handleCloseProfile = () => {
        setSelectedUserId(null);
    };


    const handleRemoveConnection = async (connectionId: string) => {
        try {
            await axios.post(
                'http://localhost:5001/api/Connections/Remove',
                { userId: connectionId, currentUserId: userId },
                {
                    withCredentials: true,
                }
            );
            // Update the connections lists after removal
            setUsersWithConversations(
                usersWithConversations.filter((user) => user.id !== connectionId)
            );
            setUsersWithoutConversations(
                usersWithoutConversations.filter((user) => user.id !== connectionId)
            );
            setOpenMenuConnectionId(null);
        } catch (error) {
            console.error('Error removing connection:', error);
            alert('Failed to remove the connection. Please try again later.');
        }
    };

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

    // Handle screen resize for responsiveness
    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle clicks outside the menu to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                openMenuConnectionId !== null &&
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setOpenMenuConnectionId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuConnectionId]);

    if (loading) {
        return <div className="connections-loading">Loading connections...</div>;
    }

    if (error) {
        return <div className="connections-error">{error}</div>;
    }

    // Helper functions to render content
    const renderConversations = () => (
        <div className="connections-card-container">
            <h2 className="connections-title">Ongoing Conversations</h2>
            {usersWithConversations.length === 0 ? (
                <div className="connections-list">
                    <p className="p-2 text-center font-bold text-gray-500">No conversations yet</p>
                </div>
            ) : (
                <ul className="connections-list">
                    {usersWithConversations.map((user) => (
                        <li
                            key={user.id}
                            className="connection-item"
                            onClick={() => navigate(`/messages/${user.id}`)}
                        >
                            <div className="connection-info">
                                <img
                                    src={`${user.profilePictureUrl}`}
                                    alt={user.firstName}
                                    className="connection-profile-picture"
                                />
                                <span className="connection-name">{user.firstName}</span>
                            </div>
                            <div className="connections-menu-button">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuConnectionId(
                                            openMenuConnectionId === user.id ? null : user.id
                                        );
                                    }}
                                >
                                    <FaEllipsisV />
                                </button>
                                {openMenuConnectionId === user.id && (
                                    <div
                                        className="connections-options-menu"
                                        ref={menuRef}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button className="flex items-center gap-2 text-sm font-bold text-gray-500" onClick={() => handleRemoveConnection(user.id)}>
                                            <FaUserMinus/>
                                            <div>
                                                Remove Connection
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    const renderNewConnections = () => (
        <div className="connections-card-container">
            <h2 className="connections-title">New Connections</h2>
            {usersWithoutConversations.length === 0 ? (
                <div className="connections-list">
                    <NoConnectionsRive />
                </div>
            ) : (
                <ul className="connections-list">
                    {usersWithoutConversations.map((user) => (
                        <li
                            key={user.id}
                            className="connection-item"
                            onClick={() => handleUserClick(user.id)}
                        >
                            <div className="connection-info">
                                <img
                                    src={`${user.profilePictureUrl}`}
                                    alt={user.firstName}
                                    className="connection-profile-picture"
                                />
                                <span className="connection-name">{user.firstName}</span>
                            </div>
                            <button
                                className="message-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/messages/${user.id}`);
                                }}
                            >
                                Message
                            </button>
                            <div>
                                <button
                                    className="connections-menu-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuConnectionId(
                                            openMenuConnectionId === user.id ? null : user.id
                                        );
                                    }}
                                >
                                    <FaEllipsisV/>
                                </button>
                                {openMenuConnectionId === user.id && (
                                    <div
                                        className="connections-options-menu"
                                        ref={menuRef}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            className="flex items-center gap-2 text-sm font-bold text-gray-500"
                                            onClick={() => handleRemoveConnection(user.id)}>
                                            <FaUserMinus/>
                                            <div>
                                                Remove Connection
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <div className="connections-page">
            {usersWithConversations.length === 0 && usersWithoutConversations.length === 0 ? (
                <div className="connections-container">
                    <NoConnectionsRive />
                </div>
            ) : (
                <>
                    {/* Tabs for mobile view */}
                    {screenWidth < 768 && (
                        <div className="connections-tabs">
                            <button
                                onClick={() => setSelectedTab('conversations')}
                                className={selectedTab === 'conversations' ? 'active' : ''}
                            >
                                Conversations
                            </button>
                            <button
                                onClick={() => setSelectedTab('connections')}
                                className={selectedTab === 'connections' ? 'active' : ''}
                            >
                                Connections
                            </button>
                        </div>
                    )}

                    {/* Conditional rendering based on screen width */}
                    {screenWidth < 768 ? (
                        selectedTab === 'conversations' ? renderConversations() : renderNewConnections()
                    ) : (
                        <div className="connections-columns">
                            {renderConversations()}
                            {renderNewConnections()}
                        </div>
                    )}
                </>
            )}
            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile}/>
            )}
        </div>
    );
};

export default Connections;
