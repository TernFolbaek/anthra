import React, { useState } from 'react';
import axios from 'axios';
import './EditGroupModal.css';
import Switch from "../../../Helpers/Switch";
import {FaHandPointer} from 'react-icons/fa';

interface EditGroupModalProps {
    groupInfo: {
        groupId: number;
        groupName: string;
        groupDescription: string;
        creatorId: string;
        groupMembersDesired: string;
        isPublic: boolean;
    };
    onClose: () => void;
    onGroupUpdated: () => void;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({ groupInfo, onClose, onGroupUpdated }) => {
    const [groupName, setGroupName] = useState(groupInfo.groupName);
    const [groupDescription, setGroupDescription] = useState(groupInfo.groupDescription);
    const [groupMembersDesired, setGroupMembersDesired] = useState(groupInfo.groupMembersDesired);
    const [isPublic, setIsPublic] = useState(groupInfo.isPublic);

    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [isEditingGroupMembersDesired, setIsEditingGroupMembersDesired] = useState(false);

    const token = localStorage.getItem('token');

    const handleSaveChanges = async () => {
        try {
            const payload = {
                groupId: groupInfo.groupId,
                name: groupName,
                description: groupDescription,
                GroupMemberDesire: groupMembersDesired,
                isPublic: isPublic,
            };

            await axios.post('http://localhost:5001/api/Groups/UpdateGroup', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            onGroupUpdated();
            onClose();
        } catch (error) {
            console.error('Error updating group:', error);
        }
    };

    return (
        <div className="edit-group-modal-overlay">
            <div className="edit-group-modal-content">
                <button className="edit-group-close-button" onClick={onClose}>
                    &times;
                </button>

                <div className="edit-group-section">
                    <div className="flex items-center gap-2">
                        <FaHandPointer size={12}/>
                        <p className="font-bold text-sm">Group Name:</p>
                    </div>
                    <div className="edit-group-field">
                        {isEditingName ? (
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                onBlur={() => setIsEditingName(false)}
                                autoFocus
                            />
                        ) : (
                            <div className="flex justify-between">
                                <p onClick={() => setIsEditingName(true)}>{groupName}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <FaHandPointer size={12}/>
                        <p className="font-bold text-sm">Description:</p>
                    </div>
                    <div className="edit-group-field">
                        {isEditingDescription ? (
                            <textarea
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                onBlur={() => setIsEditingDescription(false)}
                                autoFocus
                            />
                        ) : (
                            <div className="flex justify-between">
                                <p onClick={() => setIsEditingDescription(true)}>{groupDescription}</p>
                            </div>

                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <FaHandPointer size={12}/>
                        <p className="font-bold text-sm">What the group is looking for:</p>
                    </div>
                    <div className="edit-group-field">
                        {isEditingGroupMembersDesired ? (
                            <textarea
                                value={groupMembersDesired}
                                onChange={(e) => setGroupMembersDesired(e.target.value)}
                                onBlur={() => setIsEditingGroupMembersDesired(false)}
                                autoFocus
                            />
                        ) : (
                            <div className="flex justify-between">
                                <p onClick={() => setIsEditingGroupMembersDesired(true)}>{groupMembersDesired}</p>
                            </div>
                        )}
                    </div>
                    <div className="edit-group-field">
                        <p className="font-bold text-sm">Group Visibility:</p>
                        <Switch
                            label={isPublic ? 'Public' : 'Private'}
                            checked={isPublic}
                            onChange={setIsPublic}
                        />
                    </div>

                    <div className="edit-group-buttons">
                        <button onClick={handleSaveChanges}>Save Changes</button>
                        <button onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditGroupModal;
