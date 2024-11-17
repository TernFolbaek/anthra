import React, { useState, useEffect } from 'react';
import './Requests.css';
import NoConnectionsRive from "../../Helpers/Animations/NoConnections";

interface ConnectionRequestDTO {
    id: number;
    senderId: string;
    senderName: string;
    senderEmail: string;
    senderProfilePicture?: string;
    receiverId: string;
    status: number;
    requestedAt: string;
    respondedAt?: string;
}

const Requests: React.FC = () => {
    const [requests, setRequests] = useState<ConnectionRequestDTO[]>([]);
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
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
            .then((data) => setRequests(data))
            .catch((error) => console.error('Error fetching requests:', error));
    }, [userId]);

    const handleAccept = (requestId: number) => {
        fetch(`http://localhost:5001/api/Request/AcceptRequest?requestId=${requestId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            method: 'POST',
        })
            .then((response) => {
                if (response.ok) {
                    setRequests((prevRequests) =>
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
                    setRequests((prevRequests) =>
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

    return (
        <div className="requests-page">
            <div className="requests-container">
            {requests.length === 0 ? (
                <NoConnectionsRive/>
            ) : (
                requests.map((request) => (
                    <div key={request.id} className="user-card">
                        <img className="user-card-img"
                            src={`http://localhost:5001/${request.senderProfilePicture}` || '/default-profile.png'}
                            alt="Profile"
                        />
                        <h2>{request.senderName}</h2>
                        <p>{request.senderEmail}</p>
                        <div className="button-container">
                            <button
                                className="connect-button"
                                onClick={() => handleAccept(request.id)}
                            >
                                Accept
                            </button>
                            <button
                                className="skip-button"
                                onClick={() => handleDecline(request.id)}
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                ))
            )}
            </div>
        </div>
    );
};

export default Requests;
