import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Connections.css';
import { useNavigate } from 'react-router-dom';

interface ApplicationUser {
    id: string;
    firstName: string;
    profilePictureUrl: string;
    connectedAt: string;
}

const Connections: React.FC = () => {
    const [connections, setConnections] = useState<ApplicationUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');
    useEffect(() => {
        const fetchConnections = async () => {
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
            {connections.length === 0 ? (
                <p>You have no connections yet.</p>
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
    );
};

export default Connections;
