// Components/GroupsList/GroupsList.tsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { FaInfo } from 'react-icons/fa';
import axios from 'axios';
import NoGroups from '../../../Helpers/Animations/NoGroups';
import CardContainer from '../../CardContainer/CardContainer';
import './GroupsList.css';
import { MdGroupAdd, MdExitToApp } from 'react-icons/md';
import ViewGroupProfile from "../../ViewGroupProfile/ViewGroupProfile";
import {NotificationContext} from "../../../context/NotificationsContext";
interface GroupMember {
    userId: string;
    profilePictureUrl: string;
}

interface Group {
    id: number;
    name: string;
    creatorId: string;
    adminName: string;
    members: GroupMember[];
}

interface GroupsListProps {
    groups: Group[];
    onGroupClick: (groupId: number) => void;
    onCreateGroup: () => void;
    selectedGroupId: number | null;
}

const GroupsList: React.FC<GroupsListProps> = ({
                                                   groups,
                                                   onGroupClick,
                                                   onCreateGroup,
                                                   selectedGroupId,
                                               }) => {
    const [openMenuGroupId, setOpenMenuGroupId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedGroupIdInfo, setSelectedGroupIdInfo] = useState<number | null>(null);
    const token = localStorage.getItem('token');
    const menuRef = useRef<HTMLDivElement | null>(null);

    // Access NotificationContext
    const notificationContext = useContext(NotificationContext);

    if (!notificationContext) {
        throw new Error('GroupsList must be used within a NotificationProvider');
    }

    const { markGroupNotificationsAsRead } = notificationContext;

    // Updated handleGroupClick to mark notifications as read
    const handleGroupClick = async (groupId: number) => {
        await markGroupNotificationsAsRead(groupId); // Mark related notifications as read
        onGroupClick(groupId); // Proceed with existing group click behavior
    };

    const handleLeaveGroup = async (groupId: number) => {
        try {
            await axios.post(
                'https://api.anthra.dk/api/Groups/LeaveGroup',
                { groupId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log(`Successfully left group ${groupId}`);
            setOpenMenuGroupId(null);
            // Optionally, you can refresh the groups list or notify the parent component
        } catch (error) {
            console.error('Error leaving group:', error);
        }
    };

    // Filter groups based on the search query
    const filteredGroups = groups.filter((group) =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Effect to handle clicks outside the menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuGroupId(null);
            }
        };

        if (openMenuGroupId !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuGroupId]);

    const handleCloseGroupProfile = () => {
        setSelectedGroupIdInfo(null);
    };

    const handleUserClick = (groupId: number | null) => {
        setSelectedGroupIdInfo(groupId);
    };

    return (
        <>
            <CardContainer title="Groups">
                {/* Search Input */}
                <div className="ml-[10px] search-container-groups flex gap-2">
                    <div className="create-group-button flex items-center justify-center gap-2" onClick={onCreateGroup}>
                        <MdGroupAdd/>
                    </div>
                    <input
                        type="text"
                        placeholder="Search Groups"
                        className="search-input-groups"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredGroups.length === 0 ? (
                    <NoGroups/>
                ) : (
                    filteredGroups.map((group) => (
                        <div
                            className={`group-card ${
                                selectedGroupId === group.id ? 'group-card-selected' : ''
                            }`}
                            key={group.id}
                            onClick={() => handleGroupClick(group.id)} // Updated to handleGroupClick
                        >
                            <div className="group-name">{group.name}</div>

                            <div className="group-options">
                                <div className="group-member-images">
                                    {group.members.slice(0, 3).map((member, index) => (
                                        <img
                                            key={member.userId}
                                            src={member.profilePictureUrl}
                                            alt="Member"
                                            className={`group-member-image group-member-image-${index}`}
                                        />
                                    ))}
                                </div>
                                <button
                                    className="group-options-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuGroupId(
                                            openMenuGroupId === group.id ? null : group.id
                                        );
                                    }}
                                >
                                    ⋯
                                </button>
                                {openMenuGroupId === group.id && (
                                    <div
                                        className="group-options-menu"
                                        ref={menuRef}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button className="flex items-center gap-2 font-medium text-sm"
                                                onClick={() => handleLeaveGroup(group.id)}>
                                            <MdExitToApp/>
                                            Leave Group
                                        </button>
                                        <button className="flex items-center gap-2 font-medium text-sm"
                                                onClick={() => handleUserClick(group.id)}>
                                            <FaInfo/>
                                            <div>
                                                Group Info
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </CardContainer>
            {selectedGroupIdInfo && (
                <ViewGroupProfile groupId={selectedGroupIdInfo} onClose={handleCloseGroupProfile}/>
            )}
        </>
    );

};

export default GroupsList;
