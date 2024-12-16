// GroupInfoTab.tsx
import React, { useState } from 'react';
import axios from 'axios';
import './EditGroupModal.css';
import Switch from '../../../Helpers/Switch';
import { FaHandPointer } from 'react-icons/fa';

interface GroupInfoTabProps {
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

const GroupInfoTab: React.FC<GroupInfoTabProps> = ({
                                                       groupInfo,
                                                       onClose,
                                                       onGroupUpdated,
                                                   }) => {
    const [groupName, setGroupName] = useState(groupInfo.groupName);
    const [groupDescription, setGroupDescription] = useState(
        groupInfo.groupDescription
    );
    const [groupMembersDesired, setGroupMembersDesired] = useState(
        groupInfo.groupMembersDesired
    );
    const [isPublic, setIsPublic] = useState(groupInfo.isPublic);

    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [isEditingGroupMembersDesired, setIsEditingGroupMembersDesired] =
        useState(false);

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
        <div className="edit-group-section z-10">
            <div className="flex items-center gap-2">
                <FaHandPointer size={12}/>
                <p className="font-bold text-sm">Group Name:</p>
            </div>
            <div className="edit-group-field bg-slate-100 rounded-md">
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
                        <p className="w-full" onClick={() => setIsEditingName(true)}>{groupName}</p>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <FaHandPointer size={12}/>
                <p className="font-bold text-sm">Description:</p>
            </div>
            <div className="edit-group-field bg-slate-100 rounded-md">
                {isEditingDescription ? (
                    <textarea
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        onBlur={() => setIsEditingDescription(false)}
                        autoFocus
                    />
                ) : (
                    <div className="flex justify-between">
                        <p className="w-full" onClick={() => setIsEditingDescription(true)}>{groupDescription}</p>
                    </div>

                )}
            </div>
            <div className="flex items-center gap-2">
                <FaHandPointer size={12}/>
                <p className="font-bold text-sm">What the group is looking for:</p>
            </div>
            <div className="edit-group-field bg-slate-100 rounded-md">
                {isEditingGroupMembersDesired ? (
                    <textarea
                        value={groupMembersDesired}
                        onChange={(e) => setGroupMembersDesired(e.target.value)}
                        onBlur={() => setIsEditingGroupMembersDesired(false)}
                        autoFocus
                    />
                ) : (
                    <div className="flex justify-between">
                        <p className="w-full" onClick={() => setIsEditingGroupMembersDesired(true)}>{groupMembersDesired}</p>
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
                <button className="bg-sky-100 text-blue-500 font-semibold hover:bg-sky-50  text-sm rounded-md" onClick={handleSaveChanges}>Save Changes</button>
                <button className="bg-slate-100 font-semibold hover:bg-slate-200  text-sm rounded-md" onClick={onClose}>Cancel</button>
            </div>
</div>
)
    ;
};

export default GroupInfoTab;
