import React, { useEffect, useState } from 'react';
import './AddMembersModal.css';
import axios from 'axios';
import {ApplicationUser} from "../../types/types";
import ViewProfile from "../../ViewProfile/ViewProfile";
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
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
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
        }
    };

    const handleUserSelect = (userId: string) => {
        setSelectedUserId(userId)
    }

    const closeUserProfile = () => {
        setSelectedUserId(null);
    }

    if (!show) return null;

    return (
        <div className="add-members-modal-overlay" onClick={onClose}>
            <div className="add-members-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="add-members-modal-close-button" onClick={onClose}>
                    &times;
                </button>
                <p className="add-members-modal-title">Add Members</p>

                {/* Display selected users */}
                {selectedUserIds.length > 0 && (
                    <div className="add-members-modal-selected-users ">
                        {connections
                            .filter(user => selectedUserIds.includes(user.id))
                            .map(user => (
                                <div key={user.id} className="add-members-modal-selected-user cursor-pointer" onClick={() => handleUserSelect(user.id)}>
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
                                    <div className="flex flex-col">
                                        <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
                                        <p className="text-gray-500 text-xs font-light">{user.institution}</p>
                                    </div>
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
                {connections.length > 0 && (
                    <button
                        className="text-sm add-members-modal-add-button"
                        onClick={handleAddMembers}
                        disabled={selectedUserIds.length === 0}
                    >
                        Add
                    </button>
                )}
                {connections.length <= 0 && (
                    <p className="text-gray-500 font-medium text-base text-center">You need connections before you can invite new members</p>
                )}

            </div>
            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={closeUserProfile}/>
            )}
        </div>
    );
};

export default AddMembersModal;
