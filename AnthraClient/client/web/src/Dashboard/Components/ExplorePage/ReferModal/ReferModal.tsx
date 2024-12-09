import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ReferModal.css';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string;
}

interface ReferModalProps {
    currentUser: User | null;
    onClose: () => void;
}

const ReferModal: React.FC<ReferModalProps> = ({ currentUser, onClose }) => {
    const token = localStorage.getItem('token');

    const [connections, setConnections] = useState<User[]>([]);
    const [filteredConnections, setFilteredConnections] = useState<User[]>([]);
    const [selectedConnections, setSelectedConnections] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const userId =  localStorage.getItem('userId')
    useEffect(() => {
        const fetchConnections = async () => {
            if (!token) return;
            try {
                // Fetch the user's connections
                const res = await axios.get('http://localhost:5001/api/Connections/ConnectionsGroupList', {
                    params: { userId },
                    withCredentials: true,
                });
                setConnections(res.data);
                setFilteredConnections(res.data);
            } catch (err) {
                console.error('Error fetching connections:', err);
            }
        };

        fetchConnections();
    }, [token]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        const filtered = connections.filter((c) =>
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredConnections(filtered);
    };

    const toggleSelectConnection = (connection: User) => {
        const isSelected = selectedConnections.some((sel) => sel.id === connection.id);
        if (isSelected) {
            setSelectedConnections(selectedConnections.filter((sel) => sel.id !== connection.id));
        } else {
            // Limit to maximum of 3 selections
            if (selectedConnections.length < 3) {
                setSelectedConnections([...selectedConnections, connection]);
            }
        }
    };

    const handleSendReferral = async () => {
        if (!currentUser || !token) return;


        try {
            for (const conn of selectedConnections) {
                const formData = new FormData();
                formData.append('SenderId', userId!);
                formData.append('ReceiverId', conn.id);
                formData.append('Content', currentUser.id);
                formData.append('IsReferralCard', 'true'); // append as string

                await axios.post(
                    'http://localhost:5001/api/Messages/SendMessage',
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );

            }

            // After sending, close the modal
            onClose();
        } catch (err) {
            console.error('Error sending referral messages:', err);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="create-group-close-button" onClick={onClose}>
                    &times;
                </button>
                <p className="text-base font-semibold text-center">Refer {currentUser?.firstName} {currentUser?.lastName}</p>
                <input
                    type="text"
                    placeholder="Search your connections..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="group-name-input"
                />

                <ul className="group-creation-connections-list">
                    {filteredConnections.map((conn) => (
                        <li
                            key={conn.id}
                            onClick={() => toggleSelectConnection(conn)}
                            className="create-group-connection-item"
                            style={{
                                backgroundColor: selectedConnections.some(s => s.id === conn.id) ? '#ebf3fd' : 'transparent'
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <img
                                    src={conn.profilePictureUrl}
                                    alt={`${conn.firstName} ${conn.lastName}`}
                                    style={{width: '30px', height: '30px', borderRadius: '50%'}}
                                    className="select-user-item-avatar"
                                />
                                <span>{conn.firstName} {conn.lastName}</span>
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="modal-buttons">
                    <button
                        className="create-button"
                        onClick={handleSendReferral}
                        disabled={selectedConnections.length === 0}
                    >
                        Send
                    </button>
                    <button className="cancel-button" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReferModal;
