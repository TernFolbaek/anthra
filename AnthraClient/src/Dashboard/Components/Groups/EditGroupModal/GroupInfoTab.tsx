import React, { useState } from 'react';
import axios from 'axios';
import './EditGroupModal.css';
import Switch from '../../../Helpers/Switch';
import { FaQuestion } from 'react-icons/fa';
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
    const [groupDescription, setGroupDescription] = useState(
        groupInfo.groupDescription
    );
    const [groupMembersDesired, setGroupMembersDesired] = useState(
        groupInfo.groupMembersDesired
    );
    const [isPublic, setIsPublic] = useState(groupInfo.isPublic);
    const [selectedPurpose, setSelectedPurpose] = useState<string>(
        groupInfo.groupPurpose
    );

    // Track errors for each field
    const [errors, setErrors] = useState<{
        groupName?: string;
        groupDescription?: string;
        groupMembersDesired?: string;
    }>({});

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

    // Validation function
    const validateFields = () => {
        const newErrors: {
            groupName?: string;
            groupDescription?: string;
            groupMembersDesired?: string;
        } = {};

        // 1. Group Name: 4 - 15 characters
        if (groupName.trim().length < 4) {
            newErrors.groupName = 'Group name must be at least 4 characters.';
        } else if (groupName.trim().length > 15) {
            newErrors.groupName = 'Group name must not exceed 15 characters.';
        }

        // 2. Group Description: 80 - 150 characters
        if (groupDescription.trim().length < 80) {
            newErrors.groupDescription = 'Description must be at least 80 characters.';
        } else if (groupDescription.trim().length > 150) {
            newErrors.groupDescription = 'Description must not exceed 150 characters.';
        }

        // 3. Group Members Desired: 80 - 150 characters
        if (groupMembersDesired.trim().length < 80) {
            newErrors.groupMembersDesired = 'Must be at least 80 characters.';
        } else if (groupMembersDesired.trim().length > 150) {
            newErrors.groupMembersDesired = 'Must not exceed 150 characters.';
        }

        setErrors(newErrors);
        // Return whether we found any errors
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveChanges = async () => {
        // Validate fields first
        if (!validateFields()) {
            return;
        }

        try {
            const payload = {
                groupId: groupInfo.groupId,
                name: groupName,
                description: groupDescription,
                GroupMemberDesire: groupMembersDesired,
                isPublic: isPublic,
                groupPurpose: selectedPurpose,
            };

            await axios.post('/Groups/UpdateGroup', payload, {
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
            <div className="flex items-center gap-2 dark:text-white">
                <p className="font-bold text-sm">Group Name:</p>
            </div>
            <div className="edit-group-field dark:bg-gray-500 bg-slate-100 rounded-md p-2">
                {/* Character Counter Row */}
                <div className="flex justify-between items-center mb-1">
                    <label className="text-xs dark:text-white text-gray-700">Characters:</label>
                    <span className="text-xs dark:text-white text-gray-500">
            {groupName.length}/15
          </span>
                </div>
                <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    // highlight border if error
                    className={`w-full text-xs p-1 bg-white dark-background-input border rounded ${
                        errors.groupName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    maxLength={15}
                    placeholder="Click to edit group name..."
                />
                {errors.groupName && (
                    <p className="text-red-500 text-xs mt-1">{errors.groupName}</p>
                )}
            </div>

            {/* Description */}
            <div className="flex items-center gap-2 mt-4">
                <p className="font-bold text-sm dark:text-white">Description:</p>
            </div>
            <div className="edit-group-field bg-slate-100 rounded-md p-2">
                {/* Character Counter Row */}
                <div className="flex justify-between items-center mb-1">
                    <label className="text-xs dark:text-white text-gray-700">Characters:</label>
                    <span className="text-xs dark:text-white text-gray-500">
            {groupDescription.length}/150
          </span>
                </div>
                <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    rows={3}
                    className={`resize-none text-xs w-full p-1 bg-white dark-background-input border rounded ${
                        errors.groupDescription ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Click to edit description..."
                    maxLength={150}
                />
                {errors.groupDescription && (
                    <p className="text-red-500 text-xs mt-1">{errors.groupDescription}</p>
                )}
            </div>

            {/* What the group is looking for */}
            <div className="flex items-center gap-2 mt-4">
                <p className="font-bold text-sm dark:text-white">
                    What the group is looking for:
                </p>
            </div>
            <div className="edit-group-field bg-slate-100 rounded-md p-2">
                {/* Character Counter Row */}
                <div className="flex justify-between items-center mb-1">
                    <label className="text-xs dark:text-white text-gray-700">Characters:</label>
                    <span className="text-xs dark:text-white text-gray-500">
            {groupMembersDesired.length}/150
          </span>
                </div>
                <textarea
                    value={groupMembersDesired}
                    onChange={(e) => setGroupMembersDesired(e.target.value)}
                    rows={3}
                    className={`resize-none text-xs w-full p-1 bg-white dark-background-input border rounded ${
                        errors.groupMembersDesired ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Click to edit what the group is looking for..."
                    maxLength={150}
                />
                {errors.groupMembersDesired && (
                    <p className="text-red-500 text-xs mt-1">
                        {errors.groupMembersDesired}
                    </p>
                )}
            </div>

            {/* Group Purpose */}
            <div className="flex items-center gap-2 mt-4">
                <p className="font-bold text-sm dark:text-white">Group Purpose:</p>
            </div>
            <div className="edit-group-field">
                <div className="ml-2 flex items-center gap-4">
                    {/* Purpose Icon Container */}
                    <div className="purpose-icon-container">
                        {selectedPurpose ? (
                            <div className="selected-purpose-icon">
                                {
                                    groupPurposes.find((p) => p.value === selectedPurpose)
                                        ?.icon || <FaQuestion size={50} color="#999" />
                                }
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
                                className={`bg-emerald-400 text-white group-purpose-tag ${
                                    selectedPurpose === purpose.value ? 'selected' : ''
                                }`}
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
                <p className="font-bold text-sm dark:text-white">Group Visibility:</p>
                <Switch
                    label={isPublic ? 'Public' : 'Private'}
                    checked={isPublic}
                    onChange={setIsPublic}
                />
            </div>

            {/* Buttons */}
            <div className="edit-group-buttons flex gap-4 mt-6">
                <button
                    className="bg-emerald-100 text-emerald-500 font-semibold hover:bg-emerald-50 text-sm rounded-md px-4 py-2"
                    onClick={handleSaveChanges}
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
