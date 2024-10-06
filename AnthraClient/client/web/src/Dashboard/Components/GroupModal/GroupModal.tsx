// src/components/GroupModal.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GroupModal.css'

interface Props {
    onClose: () => void;
    onGroupCreated: () => void;
}

interface Connection {
    id: string;
    firstName: string;
    profilePictureUrl: string;
}

const GroupModal: React.FC<Props> = ({ onClose, onGroupCreated }) => {
    const [groupName, setGroupName] = useState('');
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    useEffect(() => {
        fetchConnections();
    }, []);

    interface ConnectionRequest {
        id: number;
        senderId: string;
        senderName: string;
        senderProfilePicture: string;
        receiverId: string;
    }

    const fetchConnections = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/Request/Accepted', {
                params: {userId},
                headers: { Authorization: `Bearer ${token}` },
            });
            const connectionRequests: ConnectionRequest[] = response.data;

            const connectedUsers = connectionRequests.map((request) => {
                if (request.senderId === userId) {
                    // Assuming the receiver will always have the necessary fields
                    return {
                        id: request.receiverId,
                        firstName: request.senderName, // Adjust this to fetch actual values
                        profilePictureUrl: request.senderProfilePicture
                    };
                } else {
                    return {
                        id: request.senderId,
                        firstName: request.senderName.split(' ')[0],
                        profilePictureUrl: request.senderProfilePicture
                    };
                }
            });
            setConnections(connectedUsers);
        } catch (error) {
            console.error('Error fetching connections:', error);
        }
    };

    const handleUserSelect = (userId: string) => {
        if (selectedUserIds.includes(userId)) {
            setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
        } else {
            setSelectedUserIds([...selectedUserIds, userId]);
        }
    };

    const handleCreateGroup = async () => {
        try {
            const payload = {
                name: groupName,
                invitedUserIds: selectedUserIds,
            };
            console.log(payload)

            await axios.post('http://localhost:5001/api/Groups/CreateGroup', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            onGroupCreated();
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-button" onClick={onClose}>
                    &times;
                </button>
                <h2>Create New Group</h2>
                <input
                    type="text"
                    placeholder="Group Name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="group-name-input"
                />
                <h3>Select Users to Invite</h3>
                <ul className="connections-list">
                    {connections.map((user) => (
                        <li key={user.id} className="connection-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={selectedUserIds.includes(user.id)}
                                    onChange={() => handleUserSelect(user.id)}
                                />
                                {user.firstName}
                            </label>
                        </li>
                    ))}
                </ul>
                <div className="modal-buttons">
                    <button className="create-button" onClick={handleCreateGroup}>
                        Create Group
                    </button>
                    <button className="cancel-button" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupModal;
