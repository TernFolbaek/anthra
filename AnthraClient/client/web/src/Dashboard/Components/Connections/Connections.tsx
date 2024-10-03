import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Connections.css';
import { useNavigate } from 'react-router-dom';

interface ApplicationUser {
    id: string;
    firstName: string;
    profilePictureUrl: string;
}

type ConnectionStatus = 'Pending' | 'Accepted' | 'Declined';

interface ConnectionRequest {
    id: number;
    senderId: string;
    senderName: string;
    senderProfilePicture: string;
    receiverId: string;
    status: ConnectionStatus;
    requestedAt: string;
    respondedAt: string | null;
    senderEmail: string;
}

const Connections: React.FC = () => {
    const [connections, setConnections] = useState<ApplicationUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                // Retrieve the current user's ID from localStorage
                const userId = localStorage.getItem('userId');
                if (!userId) {
                    setError('User ID not found. Please log in again.');
                    setLoading(false);
                    return;
                }

                // Fetch accepted connection requests involving the current user
                const response = await axios.get('http://localhost:5001/api/Request/Accepted', {
                    params: { userId },
                    withCredentials: true,
                });
                const connectionRequests: ConnectionRequest[] = response.data;

                // Extract the other users from the connection requests
                const connectedUsers = connectionRequests.map((request) => {
                    if (request.senderId === userId) {
                        // Assuming the receiver will always have the necessary fields
                        return {
                            id: request.receiverId,
                            firstName: request.senderName, // Adjust this to fetch actual values
                            email: request.senderEmail,
                            profilePictureUrl: request.senderProfilePicture
                        };
                    } else {
                        return {
                            id: request.senderId,
                            firstName: request.senderName.split(' ')[0],
                            lastName: request.senderName.split(' ')[1],
                            profilePictureUrl: request.senderProfilePicture
                        };
                    }
                });

                setConnections(connectedUsers);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching connections:', err);
                setError('Failed to fetch connections. Please try again later.');
                setLoading(false);
            }
        };

        fetchConnections();
    }, []);

    if (loading) {
        return <div className="connections-loading">Loading connections...</div>;
    }

    if (error) {
        return <div className="connections-error">{error}</div>;
    }

    return (
        <div className="connections-container">
            <h2>Your Connections</h2>
            {connections.length === 0 ? (
                <p>You have no connections yet.</p>
            ) : (
                <div className="connections-grid">
                    {connections.map((user) => (
                        <div key={user.id} className="connection-card">
                            <img
                                src={`http://localhost:5001${user.profilePictureUrl}`}
                                alt={`${user.firstName} `}
                                className="connection-profile-picture"
                            />
                            <h3>{`${user.firstName}`}</h3>
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
    );
};

export default Connections;
