import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GroupModal.css';
import Switch from '../../../Helpers/Switch';

interface Props {
    onClose: () => void;
    onGroupCreated: () => void;
}

interface Connection {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string;
}

const GroupModal: React.FC<Props> = ({ onClose, onGroupCreated }) => {
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [groupMemberDesire, setGroupMemberDesire] = useState('');
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isPublic, setIsPublic] = useState(true);

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const fullName = localStorage.getItem('fullName');

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/Connections/ConnectionsGroupList', {
                params: { userId },
                withCredentials: true,
            });
            const connections: Connection[] = response.data;
            setConnections(connections);
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

    const isFormValid =
        groupName.trim() !== '' &&
        groupDescription.trim() !== '' &&
        groupMemberDesire.trim() !== '' &&
        selectedUserIds.length > 0;

    const handleCreateGroup = async () => {
        if (!isFormValid) {
            // Optionally display an error message
            return;
        }

        try {
            const payload = {
                name: groupName,
                groupDescription: groupDescription,
                groupMemberDesire: groupMemberDesire,
                invitedUserIds: selectedUserIds,
                isPublic: isPublic,
                adminName: fullName,
            };
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
                <button className="create-group-close-button" onClick={onClose}>
                    &times;
                </button>

                <div className="input-group">
                    <div className="label-and-counter">
                        <p className="font-bold text-sm">
                            Group Name<span className="required-asterisk">*</span>
                        </p>
                        <div className="create-group-char-counter">{groupName.length}/15</div>
                    </div>
                    <input
                        type="text"
                        placeholder="Group name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="group-name-input"
                        maxLength={15}
                        required
                    />
                </div>

                <div className="input-group">
                    <div className="label-and-counter">
                        <p className="font-bold text-sm">
                            Description<span className="required-asterisk">*</span>
                        </p>
                        <div className="create-group-char-counter">{groupDescription.length}/150</div>
                    </div>
                    <textarea
                        className="group-description-input"
                        placeholder="Group description"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        maxLength={100}
                        required
                    />
                </div>

                <div className="input-group">
                    <div className="label-and-counter">
                        <p className="font-bold text-sm">
                            Who are you looking for<span className="required-asterisk">*</span>
                        </p>
                        <div className="create-group-char-counter">{groupMemberDesire.length}/100</div>
                    </div>
                    <textarea
                        className="group-description-input"
                        placeholder="Which type of members is this group looking for?"
                        value={groupMemberDesire}
                        onChange={(e) => setGroupMemberDesire(e.target.value)}
                        maxLength={100}
                        required
                    />
                </div>

                <div>
                    <Switch label="Make Public" checked={isPublic} onChange={setIsPublic} />
                </div>

                <h3 className="font-bold text-sm mt-3">
                    Select Users to Invite<span className="required-asterisk">*</span>
                </h3>
                <ul className="group-creation-connections-list">
                    {connections.map((user) => (
                        <li key={user.id} className="create-group-connection-item cursor-pointer w-full">
                            <label
                                className="cursor-pointer gap-4 flex items-center justify-between w-full"
                                onClick={() => handleUserSelect(user.id)}
                            >
                                <div className="flex gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedUserIds.includes(user.id)}
                                        onChange={() => handleUserSelect(user.id)}
                                    />
                                    <p className="text-sm">
                                        {user.firstName} {user.lastName}
                                    </p>
                                </div>
                                <img
                                    src={`${user.profilePictureUrl}`}
                                    alt={`${user.firstName}`}
                                    className="connection-profile-picture"
                                />
                            </label>
                        </li>
                    ))}
                </ul>

                <div className="modal-buttons">
                    <button className="create-button" onClick={handleCreateGroup} disabled={!isFormValid}>
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
