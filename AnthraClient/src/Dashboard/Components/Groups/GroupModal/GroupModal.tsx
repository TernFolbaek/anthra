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

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const fullName = localStorage.getItem('fullName');

    // Define group purposes (remove size prop; rely on CSS)
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

    const isFormValid =
        groupName.trim() !== '' &&
        groupDescription.trim() !== '' &&
        groupMemberDesire.trim() !== '' &&
        selectedUserIds.length > 0 &&
        selectedPurpose.trim() !== '';

    const handleCreateGroup = async () => {
        if (!isFormValid) return;

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

    return (
        <div className="modal-overlay">
            <div className="modal-content" ref={modalRef}>
                <button className="create-group-close-button" onClick={onClose}>
                    &times;
                </button>

                <div className="input-group mt-2">
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
                        className="group-name-input dark:text-black"
                        maxLength={15}
                        minLength={4}
                        required
                    />
                </div>

                <div className="input-group">
                    <div className="label-and-counter">
                        <p className="font-bold text-sm">
                            Description<span className="required-asterisk">*</span> <span className="font-medium text-xs"> min. 100 chars.</span>
                        </p>
                        <div className="create-group-char-counter">{groupDescription.length}/150</div>
                    </div>
                    <textarea
                        className="group-description-input dark:text-black"
                        placeholder="Group description"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        minLength={80}
                        maxLength={150}
                        required
                    />
                </div>

                <div className="input-group">
                    <div className="label-and-counter">
                        <p className="font-bold text-sm">
                            Who are you looking for<span className="required-asterisk">*</span> <span className="font-medium text-xs"> min. 100 chars.</span>
                        </p>
                        <div className="create-group-char-counter">{groupMemberDesire.length}/150</div>
                    </div>
                    <textarea
                        className="group-description-input dark:text-black"
                        placeholder="Which type of members is this group looking for?"
                        value={groupMemberDesire}
                        onChange={(e) => setGroupMemberDesire(e.target.value)}
                        minLength={80}
                        maxLength={150}
                        required
                    />
                </div>

                {/* Group Purpose Tags */}
                <div className="input-group">
                    <p className="font-bold text-sm">
                        Group Purpose<span className="required-asterisk">*</span> (Select exactly one)
                    </p>
                    <div className="flex w-full items-center">
                        {/* Purpose Icon Container */}
                        <div className="purpose-icon-container mr-3">
                            {chosenPurpose ? (
                                // Render a big version of the selected icon
                                <div className="selected-purpose-icon">
                                    {chosenPurpose.icon}
                                </div>
                            ) : (
                                <FaQuestion size={50} color="#999" />
                            )}
                        </div>

                        <div className="group-purpose-container">
                            {groupPurposes.map((purpose) => (
                                <div
                                    key={purpose.value}
                                    className={`dark:text-black group-purpose-tag ${selectedPurpose === purpose.value ? 'selected' : ''}`}
                                    onClick={() => handlePurposeSelect(purpose.value)}
                                >
                                    {purpose.icon}
                                    <span>{purpose.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-2">
                    <Switch label="Make Public" checked={isPublic} onChange={setIsPublic} />
                </div>

                <h3 className="font-bold text-sm mt-3">
                    Select Users to Invite<span className="required-asterisk">*</span>
                </h3>
                <input
                    type="text"
                    placeholder="Search your connections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="group-name-input"
                />

                {/* Scrollable Connections Container */}
                <div className="group-creation-connections-container">
                    <ul className="group-creation-connections-list">
                        {filteredConnections.map((user) => (
                            <li
                                key={user.id}
                                className={`create-group-connection-item cursor-pointer w-full ${
                                    selectedUserIds.includes(user.id) ? 'selected-user' : ''
                                }`}
                                onClick={() => handleUserSelect(user.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <img
                                        src={`${user.profilePictureUrl}`}
                                        alt={`${user.firstName} ${user.lastName}`}
                                        className="select-user-item-avatar"
                                    />
                                    <span className="text-sm dark:text-black">{user.firstName} {user.lastName}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

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
    );}

    export default GroupModal;
