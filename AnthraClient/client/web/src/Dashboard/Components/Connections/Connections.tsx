import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './Connections.css';
import { useNavigate } from 'react-router-dom';
import NoConnectionsRive from "../../Helpers/Animations/NoConnections";
import ViewProfile from '../ViewProfile/ViewProfile';
import { FaEllipsisV, FaUserMinus } from 'react-icons/fa';
import { FaUser, FaUsers } from "react-icons/fa";

interface ApplicationUser {
    id: string;
    firstName: string;
    profilePictureUrl: string;
    connectedAt: string;
}

interface ConnectionRequestDTO {
    id: number;
    senderId: string;
    senderName: string;
    senderFirstName: string;
    senderLastName: string;
    senderEmail: string;
    senderProfilePicture?: string;
    receiverId: string;
    status: number;
    requestedAt: string;
    respondedAt?: string;
}

interface GroupApplicationRequestDTO {
    groupId: number;
    groupName: string;
    applications: {
        requestId: number;
        applicantId: string;
        applicantName: string;
        applicantProfilePictureUrl: string;
        requestedAt: string;
    }[];
}

const Connections: React.FC = () => {
    const [connections, setConnections] = useState<ApplicationUser[]>([]);
    const [connectionRequests, setConnectionRequests] = useState<ConnectionRequestDTO[]>([]);
    const [groupApplicationRequests, setGroupApplicationRequests] = useState<GroupApplicationRequestDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [openMenuConnectionId, setOpenMenuConnectionId] = useState<string | null>(null);
    const [screenWidth, setScreenWidth] = useState<number>(window.innerWidth);
    const [selectedTab, setSelectedTab] = useState<'connections' | 'requests'>('connections');
    const [selectedRequestTab, setSelectedRequestTab] = useState<'personal' | 'groups'>('personal');
    const menuRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

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
            setConnections(
                connections.filter((user) => user.id !== connectionId)
            );
            setOpenMenuConnectionId(null);
        } catch (error) {
            console.error('Error removing connection:', error);
            alert('Failed to remove the connection. Please try again later.');
        }
    };

    const handleAccept = (requestId: number) => {
        fetch(`http://localhost:5001/api/Request/AcceptRequest?requestId=${requestId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            method: 'POST',
        })
            .then((response) => {
                if (response.ok) {
                    setConnectionRequests((prevRequests) =>
                        prevRequests.filter((req) => req.id !== requestId)
                    );
                } else {
                    return response.text().then((text) => {
                        throw new Error(text);
                    });
                }
            })
            .catch((error) => console.error('Error accepting request:', error));
    };

    const handleDecline = (requestId: number) => {
        fetch(`http://localhost:5001/api/Request/DeclineRequest?requestId=${requestId}`, {
            method: 'POST',
        })
            .then((response) => {
                if (response.ok) {
                    setConnectionRequests((prevRequests) =>
                        prevRequests.filter((req) => req.id !== requestId)
                    );
                } else {
                    return response.text().then((text) => {
                        throw new Error(text);
                    });
                }
            })
            .catch((error) => console.error('Error declining request:', error));
    };

    const handleGroupApplicationAccept = (requestId: number) => {
        fetch(`http://localhost:5001/api/Requests/RespondToGroupApplication`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({ requestId, accept: true }),
        })
            .then((response) => {
                if (response.ok) {
                    setGroupApplicationRequests(prevState => {
                        return prevState.map(group => ({
                            ...group,
                            applications: group.applications.filter(app => app.requestId !== requestId)
                        })).filter(group => group.applications.length > 0);
                    });
                } else {
                    return response.text().then((text) => {
                        throw new Error(text);
                    });
                }
            })
            .catch((error) => console.error('Error accepting group application:', error));
    };

    const handleGroupApplicationDecline = (requestId: number) => {
        fetch(`http://localhost:5001/api/Requests/RespondToGroupApplication`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({ requestId, accept: false }),
        })
            .then((response) => {
                if (response.ok) {
                    setGroupApplicationRequests(prevState => {
                        return prevState.map(group => ({
                            ...group,
                            applications: group.applications.filter(app => app.requestId !== requestId)
                        })).filter(group => group.applications.length > 0);
                    });
                } else {
                    return response.text().then((text) => {
                        throw new Error(text);
                    });
                }
            })
            .catch((error) => console.error('Error declining group application:', error));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/Connections/List', {
                    params: {
                        userId: userId,
                    },
                    withCredentials: true,
                });

                const connectedUsers: ApplicationUser[] = response.data;
                setConnections(connectedUsers);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to fetch data. Please try again later.');
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    useEffect(() => {
        if (!userId) {
            return;
        }
        fetch(`http://localhost:5001/api/Request/Pending?userId=${userId}`)
            .then((response) => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then((data) => setConnectionRequests(data))
            .catch((error) => console.error('Error fetching requests:', error));

        fetch(`http://localhost:5001/api/Requests/GetGroupApplicationRequests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then((response) => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then((data) => setGroupApplicationRequests(data))
            .catch((error) => console.error('Error fetching group application requests:', error));

    }, [userId, token]);

    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    const renderConnections = () => (
        <div className="connections-card-container">
            {connections.length === 0 ? (
                <NoConnectionsRive />
            ) : (
                <ul className="connections-list">
                    {connections.map((user) => (
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

    const renderPersonalRequests = () => (
        <div className="requests-content">
            {connectionRequests.length === 0 ? (
                <h2 className="w-full text-center text-gray-700 text-base font-bold">No new connection requests</h2>
            ) : (
                connectionRequests.map((request) => (
                    <div
                        key={request.id}
                        onClick={() => handleUserClick(request.senderId)}
                        className="requests-user-card"
                    >
                        <div className="requests-user-info">
                            <img
                                className="requests-user-card-img"
                                src={request.senderProfilePicture}
                                alt="Profile"
                            />
                            <h2>{request.senderFirstName} {request.senderLastName}</h2>
                        </div>
                        <div className="requests-button-container">
                            <button
                                className="requests-connect-button"
                                onClick={(e) => { e.stopPropagation(); handleAccept(request.id) }}
                            >
                                Accept
                            </button>
                            <button
                                className="requests-skip-button"
                                onClick={(e) => { e.stopPropagation(); handleDecline(request.id) }}
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderGroupRequests = () => (
        <div className="requests-content">
            {groupApplicationRequests.length === 0 ? (
                <p className="no-group-text text-gray-700 w-full text-center text-base font-bold">No group application requests</p>
            ) : (
                groupApplicationRequests.map((group) => (
                    <div key={group.groupId} className="requests-group-section">
                        <h3 className="requests-group-name">{group.groupName}</h3>
                        {group.applications.map((application) => (
                            <div key={application.requestId} className="requests-user-card">
                                <div className="requests-user-info">
                                    <img
                                        className="requests-user-card-img"
                                        src={application.applicantProfilePictureUrl}
                                        alt="Profile"
                                    />
                                    <h2>{application.applicantName}</h2>
                                </div>
                                <div className="requests-button-container">
                                    <button
                                        className="requests-connect-button"
                                        onClick={() => handleGroupApplicationAccept(application.requestId)}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="requests-skip-button"
                                        onClick={() => handleGroupApplicationDecline(application.requestId)}
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))
            )}
        </div>
    );

    return (
        <div className="connections-page">
                <>
                    {screenWidth < 768 && (
                        <div className="connections-tabs">
                            <button
                                onClick={() => setSelectedTab('connections')}
                                className={selectedTab === 'connections' ? 'active' : ''}
                            >
                                {screenWidth < 481 ? <FaUser /> : 'Connections'}
                            </button>
                            <button
                                onClick={() => setSelectedTab('requests')}
                                className={selectedTab === 'requests' ? 'active' : ''}
                            >
                                {screenWidth < 481 ? <FaUsers /> : 'Requests'}
                            </button>
                        </div>
                    )}

                    {screenWidth < 768 ? (
                        selectedTab === 'connections' ? (
                            renderConnections()
                        ) : (
                            <div className="connections-card-container">
                                <div className="requests-tabs">
                                    <button
                                        onClick={() => setSelectedRequestTab('personal')}
                                        className={selectedRequestTab === 'personal' ? 'active' : ''}
                                    >
                                        Personal
                                    </button>
                                    <button
                                        onClick={() => setSelectedRequestTab('groups')}
                                        className={selectedRequestTab === 'groups' ? 'active' : ''}
                                    >
                                        Groups
                                    </button>
                                </div>
                                {selectedRequestTab === 'personal' ? renderPersonalRequests() : renderGroupRequests()}
                            </div>
                        )
                    ) : (
                        <div className="connections-columns">
                            {renderConnections()}
                            <div className="connections-card-container">
                                <div className="requests-tabs">
                                    <button
                                        onClick={() => setSelectedRequestTab('personal')}
                                        className={selectedRequestTab === 'personal' ? 'active' : ''}
                                    >
                                        Personal
                                    </button>
                                    <button
                                        onClick={() => setSelectedRequestTab('groups')}
                                        className={selectedRequestTab === 'groups' ? 'active' : ''}
                                    >
                                        Groups
                                    </button>
                                </div>
                                {selectedRequestTab === 'personal' ? renderPersonalRequests() : renderGroupRequests()}
                            </div>
                        </div>
                    )}
                </>
            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile}/>
            )}
        </div>
    );
};

export default Connections;
