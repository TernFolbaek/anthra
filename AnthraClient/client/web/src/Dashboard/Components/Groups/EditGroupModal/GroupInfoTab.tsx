import React, { useState } from 'react';
import axios from 'axios';
import './EditGroupModal.css';
import Switch from '../../../Helpers/Switch';
import { FaHandPointer, FaQuestion } from 'react-icons/fa';
import { MdGroups } from 'react-icons/md';
import { FaChalkboardTeacher, FaBookReader, FaLaptopCode } from 'react-icons/fa';

interface GroupInfoTabProps {
    groupInfo: {
        groupId: number;
        groupName: string;
        groupDescription: string;
        creatorId: string;
        groupMembersDesired: string;
        isPublic: boolean;
        groupPurpose: string;
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
    const [groupDescription, setGroupDescription] = useState(groupInfo.groupDescription);
    const [groupMembersDesired, setGroupMembersDesired] = useState(groupInfo.groupMembersDesired);
    const [isPublic, setIsPublic] = useState(groupInfo.isPublic);

    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [isEditingGroupMembersDesired, setIsEditingGroupMembersDesired] = useState(false);

    const [selectedPurpose, setSelectedPurpose] = useState<string>(groupInfo.groupPurpose);

    const token = localStorage.getItem('token');

    // Define group purposes
    const groupPurposes = [
        { label: 'Social', value: 'social', icon: <MdGroups /> },
        { label: 'General', value: 'general', icon: <FaChalkboardTeacher /> },
        { label: 'Exam Preparation', value: 'exam preparation', icon: <FaBookReader /> },
        { label: 'Studying', value: 'studying', icon: <FaLaptopCode /> },
    ];

    const handlePurposeSelect = (value: string) => {
        setSelectedPurpose(value === selectedPurpose ? '' : value);
    };

    const handleSaveChanges = async () => {
        try {
            const payload = {
                groupId: groupInfo.groupId,
                name: groupName,
                description: groupDescription,
                GroupMemberDesire: groupMembersDesired,
                isPublic: isPublic,
                groupPurpose: selectedPurpose, // Include groupPurpose
            };

            await axios.post('http://localhost:5001/api/Groups/UpdateGroup', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            onGroupUpdated();
            onClose();
        } catch (error) {
            console.error('Error updating group:', error);
            // Optionally, display an error message to the user
        }
    };

    return (
        <div className="edit-group-section z-10">
            {/* Group Name */}
            <div className="flex items-center gap-2">
                <FaHandPointer size={12}/>
                <p className="font-bold text-sm">Group Name:</p>
            </div>
            <div className="edit-group-field bg-slate-100 rounded-md p-2">
                {isEditingName ? (
                    <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        onBlur={() => setIsEditingName(false)}
                        autoFocus
                        className="w-full p-1 bg-white border border-gray-300 rounded"
                    />
                ) : (
                    <div className="flex justify-between">
                        <p className="w-full" onClick={() => setIsEditingName(true)}>{groupName}</p>
                    </div>
                )}
            </div>

            {/* Description */}
            <div className="flex items-center gap-2 mt-4">
                <FaHandPointer size={12}/>
                <p className="font-bold text-sm">Description:</p>
            </div>
            <div className="edit-group-field bg-slate-100 rounded-md p-2">
                {isEditingDescription ? (
                    <textarea
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        onBlur={() => setIsEditingDescription(false)}
                        autoFocus
                        className="w-full p-1 bg-white border border-gray-300 rounded"
                        rows={3}
                    />
                ) : (
                    <div className="flex justify-between">
                        <p className="w-full" onClick={() => setIsEditingDescription(true)}>{groupDescription}</p>
                    </div>
                )}
            </div>

            {/* What the group is looking for */}
            <div className="flex items-center gap-2 mt-4">
                <FaHandPointer size={12}/>
                <p className="font-bold text-sm">What the group is looking for:</p>
            </div>
            <div className="edit-group-field bg-slate-100 rounded-md p-2">
                {isEditingGroupMembersDesired ? (
                    <textarea
                        value={groupMembersDesired}
                        onChange={(e) => setGroupMembersDesired(e.target.value)}
                        onBlur={() => setIsEditingGroupMembersDesired(false)}
                        autoFocus
                        className="w-full p-1 bg-white border border-gray-300 rounded"
                        rows={3}
                    />
                ) : (
                    <div className="flex justify-between">
                        <p className="w-full" onClick={() => setIsEditingGroupMembersDesired(true)}>{groupMembersDesired}</p>
                    </div>
                )}
            </div>

            {/* Group Purpose */}
            <div className="flex items-center gap-2 mt-4">
                <FaHandPointer size={12}/>
                <p className="font-bold text-sm">Group Purpose:</p>
            </div>
            <div className="edit-group-field">
                <div className="ml-2 flex items-center gap-4">
                    {/* Purpose Icon Container */}
                    <div className="purpose-icon-container">
                        {selectedPurpose ? (
                            <div className="selected-purpose-icon">
                                {groupPurposes.find(p => p.value === selectedPurpose)?.icon || <FaQuestion size={50} color="#999" />}
                            </div>
                        ) : (
                            <FaQuestion size={50} color="#999" />
                        )}
                    </div>

                    {/* Purpose Tags */}
                    <div className="group-purpose-container">
                        {groupPurposes.map((purpose) => (
                            <div
                                key={purpose.value}
                                className={`group-purpose-tag ${selectedPurpose === purpose.value ? 'selected' : ''}`}
                                onClick={() => handlePurposeSelect(purpose.value)}
                            >
                                {purpose.icon}
                                <span>{purpose.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Group Visibility */}
            <div className="edit-group-field mt-4">
                <p className="font-bold text-sm">Group Visibility:</p>
                <Switch
                    label={isPublic ? 'Public' : 'Private'}
                    checked={isPublic}
                    onChange={setIsPublic}
                />
            </div>

            {/* Buttons */}
            <div className="edit-group-buttons flex gap-4 mt-6">
                <button
                    className="bg-sky-100 text-blue-500 font-semibold hover:bg-sky-50 text-sm rounded-md px-4 py-2"
                    onClick={handleSaveChanges}
                    disabled={!selectedPurpose}
                >
                    Save Changes
                </button>
                <button
                    className="bg-slate-100 font-semibold hover:bg-slate-200 text-sm rounded-md px-4 py-2"
                    onClick={onClose}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default GroupInfoTab;
