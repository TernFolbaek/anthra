// Requests.tsx
import React, { useState, useEffect } from 'react';
import './Requests.css';
import NoConnectionsRive from "../../Helpers/Animations/NoConnections";
import ViewProfile from '../ViewProfile/ViewProfile';

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

const Requests: React.FC = () => {
    const [connectionRequests, setConnectionRequests] = useState<ConnectionRequestDTO[]>([]);
    const [groupApplicationRequests, setGroupApplicationRequests] = useState<GroupApplicationRequestDTO[]>([]);
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            return;
        }
        // Fetch personal connection requests
        fetch(`http://localhost:5001/api/Request/Pending?userId=${userId}`)
            .then((response) => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then((data) => {
                console.log(data);
                setConnectionRequests(data)
            })
            .catch((error) => console.error('Error fetching requests:', error));

        // Fetch group application requests
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

    // Handle accepting or declining personal connection requests
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

    // Handle accepting or declining group applications
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

    const handleUserClick = (userId: string) => {
        setSelectedUserId(userId);
    };

    const handleCloseProfile = () => {
        setSelectedUserId(null);
    };

    return (
        <div className="requests-page">
            {/* Personal Connection Requests */}
            <div className="connections-card-container">
                <h2 className="requests-title">Personal Connection Requests</h2>
                {connectionRequests.length === 0 ? (
                    <NoConnectionsRive />
                ) : (
                    connectionRequests.map((request) => (
                        <div key={request.id} onClick={() => handleUserClick(request.senderId)} className="requests-user-card">
                            {/* **Add onClick handler to user info** */}
                            <div className="requests-user-info" onClick={() => handleUserClick(request.senderId)}>
                                <img
                                    className="requests-user-card-img"
                                    src={request.senderProfilePicture ? `http://localhost:5001/${request.senderProfilePicture}` : '/default-profile.png'}
                                    alt="Profile"
                                />
                                <h2>{request.senderFirstName} {request.senderLastName}</h2>
                            </div>
                            <div className="requests-button-container">
                                <button
                                    className="requests-connect-button"
                                    onClick={() => handleAccept(request.id)}
                                >
                                    Accept
                                </button>
                                <button
                                    className="requests-skip-button"
                                    onClick={() => handleDecline(request.id)}
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Group Application Requests */}
            <div className="connections-card-container">
                <h2 className="requests-title">Group Application Requests</h2>
                {groupApplicationRequests.length === 0 ? (
                    <p className="no-group-text text-gray-700">No group application requests</p>
                ) : (
                    groupApplicationRequests.map((group) => (
                        <div key={group.groupId} className="requests-group-section">
                            <h3 className="requests-group-name">{group.groupName}</h3>
                            {group.applications.map((application) => (
                                <div key={application.requestId} className="requests-user-card">
                                    {/* **Add onClick handler to user info** */}
                                    <div className="requests-user-info" onClick={() => handleUserClick(application.applicantId)}>
                                        <img
                                            className="requests-user-card-img"
                                            src={application.applicantProfilePictureUrl ? `http://localhost:5001${application.applicantProfilePictureUrl}` : '/default-profile.png'}
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

            {/* **Render ViewProfile modal if a user is selected** */}
            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile} />
            )}
        </div>
    );

};
export default Requests;
