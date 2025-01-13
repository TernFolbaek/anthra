import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './GroupModal.css';
import Switch from '../../../Helpers/Switch';
import { MdGroups } from 'react-icons/md';
import { FaChalkboardTeacher, FaBookReader, FaLaptopCode, FaQuestion } from 'react-icons/fa';

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
    const [filteredConnections, setFilteredConnections] = useState<Connection[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isPublic, setIsPublic] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPurpose, setSelectedPurpose] = useState<string>('');

    // Track all error messages here
    const [errors, setErrors] = useState<{
        groupName?: string;
        groupDescription?: string;
        groupMemberDesire?: string;
        selectedUsers?: string;
        selectedPurpose?: string;
    }>({});

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const fullName = localStorage.getItem('fullName');

    // Define group purposes
    const groupPurposes = [
        { label: 'Social', value: 'social', icon: <MdGroups /> },
        { label: 'General', value: 'general', icon: <FaChalkboardTeacher /> },
        { label: 'Exam Preparation', value: 'exam preparation', icon: <FaBookReader /> },
        { label: 'Studying', value: 'studying', icon: <FaLaptopCode /> },
    ];

    useEffect(() => {
        fetchConnections();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredConnections(connections);
        } else {
            const filtered = connections.filter((c) =>
                `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredConnections(filtered);
        }
    }, [searchQuery, connections]);

    const fetchConnections = async () => {
        try {
            const response = await axios.get('/Connections/ConnectionsGroupList', {
                params: { userId },
                withCredentials: true,
            });
            const data: Connection[] = response.data;
            setConnections(data);
            setFilteredConnections(data);
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

    const handlePurposeSelect = (value: string) => {
        setSelectedPurpose(value === selectedPurpose ? '' : value);
    };

    // Determine icon to show in the container
    const chosenPurpose = groupPurposes.find((p) => p.value === selectedPurpose);

    // Ref for modal to handle click outside
    const modalRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            onClose();
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const validateForm = () => {
        const newErrors: {
            groupName?: string;
            groupDescription?: string;
            groupMemberDesire?: string;
            selectedUsers?: string;
            selectedPurpose?: string;
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

        // 3. Group Member Desire: 80 - 150 characters
        if (groupMemberDesire.trim().length < 80) {
            newErrors.groupMemberDesire = 'This field must be at least 80 characters.';
        } else if (groupMemberDesire.trim().length > 150) {
            newErrors.groupMemberDesire = 'This field must not exceed 150 characters.';
        }

        // 4. At least one user must be selected
        if (selectedUserIds.length === 0) {
            newErrors.selectedUsers = 'Please select at least one user to invite.';
        }

        // 5. Exactly one group purpose must be selected
        if (!selectedPurpose) {
            newErrors.selectedPurpose = 'Please select a group purpose.';
        }

        setErrors(newErrors);

        // If there are no keys in newErrors, everything is valid
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateGroup = async () => {
        // Validate all fields before creating group
        if (!validateForm()) {
            return; // If invalid, do not proceed
        }

        try {
            const payload = {
                name: groupName,
                groupDescription: groupDescription,
                groupMemberDesire: groupMemberDesire,
                invitedUserIds: selectedUserIds,
                isPublic: isPublic,
                adminName: fullName,
                groupPurpose: selectedPurpose,
            };
            await axios.post('/Groups/CreateGroup', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            onGroupCreated();
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    // Simple convenience check for the Create Group button
    const isFormValid =
        groupName.trim().length >= 4 &&
        groupName.trim().length <= 15 &&
        groupDescription.trim().length >= 80 &&
        groupDescription.trim().length <= 150 &&
        groupMemberDesire.trim().length >= 80 &&
        groupMemberDesire.trim().length <= 150 &&
        selectedUserIds.length > 0 &&
        selectedPurpose.trim() !== '';

    return (
        <div className="modal-overlay">
            <div className="modal-content" ref={modalRef}>
                <button className="create-group-close-button" onClick={onClose}>
                    &times;
                </button>

                {/* GROUP NAME */}
                <div className="input-group mt-2">
                    <div className="label-and-counter">
                        <p className="font-bold dark:text-emerald-400 text-sm">
                            Group Name
                            <span className="dark:text-white required-asterisk">*</span> <span
                            className="font-medium text-xs"> min. 4 chars, max. 15.</span>

                        </p>
                        <div className="create-group-char-counter">
                            {groupName.length}/15
                        </div>
                    </div>
                    <input
                        type="text"
                        placeholder="Group name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className={
                            // Highlight if error
                            `group-name-input dark:text-black ${
                                errors.groupName ? 'error-border' : ''
                            }`
                        }
                        maxLength={15}
                        minLength={4}
                        required
                    />
                    {/* Error message for Group Name */}
                    {errors.groupName && (
                        <p className="error-message">{errors.groupName}</p>
                    )}
                </div>

                {/* DESCRIPTION */}
                <div className="input-group">
                    <div className="label-and-counter">
                        <p className="font-bold text-sm dark:text-emerald-400">
                            Description
                            <span className="dark:text-white required-asterisk">*</span>
                            <span className="font-medium text-xs"> min. 80 chars, max. 150.</span>
                        </p>
                        <div className="create-group-char-counter">
                            {groupDescription.length}/150
                        </div>
                    </div>
                    <textarea
                        className={`group-description-input dark:bg-gray-500 dark:text-black ${
                            errors.groupDescription ? 'error-border' : ''
                        }`}
                        placeholder="Group description"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        minLength={80}
                        maxLength={150}
                        required
                    />
                    {/* Error message for Description */}
                    {errors.groupDescription && (
                        <p className="error-message">{errors.groupDescription}</p>
                    )}
                </div>

                {/* GROUP MEMBER DESIRE */}
                <div className="input-group">
                    <div className="label-and-counter">
                        <p className="font-bold text-sm dark:text-emerald-400 ">
                            Who are you looking for
                            <span className="dark:text-white required-asterisk">*</span>
                            <span className="font-medium text-xs"> min. 80 chars, max. 150.</span>
                        </p>
                        <div className="create-group-char-counter">
                            {groupMemberDesire.length}/150
                        </div>
                    </div>
                    <textarea
                        className={`group-description-input dark:text-black ${
                            errors.groupMemberDesire ? 'error-border' : ''
                        }`}
                        placeholder="Which type of members is this group looking for?"
                        value={groupMemberDesire}
                        onChange={(e) => setGroupMemberDesire(e.target.value)}
                        minLength={80}
                        maxLength={150}
                        required
                    />
                    {/* Error message for "Who are you looking for" */}
                    {errors.groupMemberDesire && (
                        <p className="error-message">{errors.groupMemberDesire}</p>
                    )}
                </div>

                {/* GROUP PURPOSE */}
                <div className="input-group">
                    <p className="font-bold text-sm dark:text-emerald-400 ">
                        Group Purpose
                        <span className="dark:text-white required-asterisk">*</span> (Select exactly one)
                    </p>
                    <div className="flex w-full items-center">
                        <div className="purpose-icon-container mr-3">
                            {chosenPurpose ? (
                                <div className="selected-purpose-icon dark:text-emerald-400">
                                    {chosenPurpose.icon}
                                </div>
                            ) : (
                                <FaQuestion size={50} color="#8EE4BA" />
                            )}
                        </div>

                        <div className="group-purpose-container">
                            {groupPurposes.map((purpose) => (
                                <div
                                    key={purpose.value}
                                    className={`bg-sky-100 dark:text-gray-700 dark:bg-emerald-300 dark:hover:bg-emerald-400 group-purpose-tag ${
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
                    {/* Error message for Group Purpose */}
                    {errors.selectedPurpose && (
                        <p className="error-message">{errors.selectedPurpose}</p>
                    )}
                </div>

                {/* PUBLIC SWITCH */}
                <div className="mt-2">
                    <Switch label="Make Public" checked={isPublic} onChange={setIsPublic} />
                </div>

                {/* SELECT USERS */}
                <h3 className="font-bold text-sm mt-3 dark:text-emerald-400 ">
                    Select Users to Invite
                    <span className="dark:text-white required-asterisk">*</span>
                </h3>
                <input
                    type="text"
                    placeholder="Search your connections"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="group-name-input dark:bg-gray-100"
                />

                <div className="group-creation-connections-container">
                    <ul className="group-creation-connections-list">
                        {filteredConnections.map((user) => (
                            <li
                                key={user.id}
                                className={`
                                    dark:bg-gray-700/50
                                    dark:hover:bg-gray-600/50
                                    create-group-connection-item
                                    cursor-pointer
                                    mb-1
                                    w-full
                                    ${selectedUserIds.includes(user.id) ? 'selected-user' : ''}
                                `}
                                onClick={() => handleUserSelect(user.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <img
                                        src={`${user.profilePictureUrl}`}
                                        alt={`${user.firstName} ${user.lastName}`}
                                        className="select-user-item-avatar"
                                    />
                                    <span className="text-sm dark:text-white font-medium ">
                                        {user.firstName} {user.lastName}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                {/* Error for selected users */}
                {errors.selectedUsers && (
                    <p className="error-message">{errors.selectedUsers}</p>
                )}

                {/* ACTION BUTTONS */}
                <div className="modal-buttons">
                    <button
                        className="dark:bg-emerald-500 dark:hover:bg-emerald-400 transform hover:scale-105 dark:text-white create-button"
                        onClick={handleCreateGroup}
                        disabled={!isFormValid}
                    >
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
