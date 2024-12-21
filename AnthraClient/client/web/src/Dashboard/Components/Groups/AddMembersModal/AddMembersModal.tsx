import React, { useEffect, useState } from 'react';
import './AddMembersModal.css';
import axios from 'axios';

interface ApplicationUser {
    id: string;
    firstName: string;
    profilePictureUrl: string;
}

interface AddMembersModalProps {
    show: boolean;
    onClose: () => void;
    groupId: number;
    groupName: string | undefined;
    groupPurpose: string | undefined;
}

const AddMembersModal: React.FC<AddMembersModalProps> = ({ show, onClose, groupId, groupPurpose, groupName}) => {
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [connections, setConnections] = useState<ApplicationUser[]>([]);
    const [loadingConnections, setLoadingConnections] = useState(true);
    const [errorConnections, setErrorConnections] = useState<string | null>(null);

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (!show) return; // Fetch connections only when modal is shown

        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/Connections/List', {
                    params: {
                        userId: userId,
                    },
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });
                console.log(response.data)
                const connectedUsers: ApplicationUser[] = response.data;
                setConnections(connectedUsers);
                setLoadingConnections(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setErrorConnections('Failed to fetch connections. Please try again later.');
                setLoadingConnections(false);
            }
        };

        fetchData();
    }, [show, userId, token]);

    const toggleUserSelection = (userId: string) => {
        console.log(userId)
        setSelectedUserIds(prevSelected => {
            const newSelected = prevSelected.includes(userId)
                ? prevSelected.filter(id => id !== userId)
                : [...prevSelected, userId];
            return newSelected;
        });
    };

    const handleAddMembers = async () => {
        try {
            const payload = {
                groupId,
                invitedUserIds: selectedUserIds,
                groupPurpose,
                groupName,
            };
            console.log(payload);
            await axios.post('http://localhost:5001/api/Groups/AddMembers', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            onClose();
        } catch (error) {
            console.error('Error adding members:', error);
            alert('Failed to add members. Please try again.');
        }
    };

    if (!show) return null;

    return (
        <div className="add-members-modal-overlay" onClick={onClose}>
            <div className="add-members-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="add-members-modal-close-button" onClick={onClose}>
                    &times;
                </button>
                <h2 className="add-members-modal-title">Add Members</h2>

                {/* Display selected users */}
                {selectedUserIds.length > 0 && (
                    <div className="add-members-modal-selected-users">
                        {connections
                            .filter(user => selectedUserIds.includes(user.id))
                            .map(user => (
                                <div key={user.id} className="add-members-modal-selected-user">
                                    <img
                                        src={user.profilePictureUrl}
                                        alt={user.firstName}
                                        className="add-members-modal-selected-avatar"
                                    />
                                    <span className="add-members-modal-selected-name">{user.firstName}</span>
                                </div>
                            ))}
                    </div>
                )}

                <div className="add-members-modal-members-container">
                    {loadingConnections ? (
                        <p>Loading connections...</p>
                    ) : errorConnections ? (
                        <p className="error-message">{errorConnections}</p>
                    ) : (
                        <ul className="add-members-modal-members-list">
                            {connections.map(user => (
                                <li
                                    key={user.id}
                                    className={`add-members-modal-member-item ${selectedUserIds.includes(user.id) ? 'selected' : ''}`}
                                    onClick={() => toggleUserSelection(user.id)}
                                >
                                    <img
                                        src={user.profilePictureUrl}
                                        alt={user.firstName}
                                        className="add-members-modal-member-avatar"
                                    />
                                    <span className="add-members-modal-member-name">{user.firstName}</span>
                                    <input
                                        type="checkbox"
                                        checked={selectedUserIds.includes(user.id)}
                                        onChange={() => toggleUserSelection(user.id)}
                                        className="add-members-modal-checkbox"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <button
                    className="add-members-modal-add-button"
                    onClick={handleAddMembers}
                    disabled={selectedUserIds.length === 0}
                >
                    Add Selected Members
                </button>
            </div>
        </div>
    );
};

export default AddMembersModal;
