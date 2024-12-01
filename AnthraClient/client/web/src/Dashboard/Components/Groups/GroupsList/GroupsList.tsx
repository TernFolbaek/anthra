// Components/GroupsList/GroupsList.tsx
import React, { useState, useEffect, useRef } from 'react';
import {FaInfo} from 'react-icons/fa';
import axios from 'axios';
import NoGroups from '../../../Helpers/Animations/NoGroups';
import CardContainer from '../../CardContainer/CardContainer';
import './GroupsList.css';
import { MdGroupAdd, MdExitToApp} from 'react-icons/md';
import ViewGroupProfile  from "../../ViewGroupProfile/ViewGroupProfile";

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
    const [searchQuery, setSearchQuery] = useState<string>(''); // Search query state
    const [selectedGroupIdInfo, setSelectedGroupIdInfo] = useState<number | null>(null);
    const token = localStorage.getItem('token');
    const menuRef = useRef<HTMLDivElement | null>(null); // Ref for the open menu

    const handleGroupClick = (groupId: number) => {
        onGroupClick(groupId);
    };

    const handleLeaveGroup = async (groupId: number) => {
        try {
            await axios.post(
                'http://localhost:5001/api/Groups/LeaveGroup',
                { groupId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log(`Successfully left group ${groupId}`);
            setOpenMenuGroupId(null);

            // Optionally, you can refresh the groups list by notifying the parent component.
            // Since 'groups' is a prop, you can't modify it directly here.
            // You might consider calling a function passed from the parent to refresh the groups.
        } catch (error) {
            console.error('Error leaving group:', error);
            alert('Failed to leave the group. Please try again later.');
        }
    };


    // Filter groups based on the search query
    const filteredGroups = groups.filter((group) =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Effect to handle clicks outside the menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setOpenMenuGroupId(null);
            }
        };

        if (openMenuGroupId !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        // Cleanup function
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
                        onClick={() => handleGroupClick(group.id)}
                    >
                        <div className="group-name">{group.name}</div>
                        <div className="group-options">
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
                                    <button className="flex items-center gap-2 font-bold text-sm text-gray-500" onClick={() => handleLeaveGroup(group.id)}>
                                        <MdExitToApp/>
                                        Leave Group
                                    </button>
                                    <button className="flex items-center gap-2 font-bold text-sm text-gray-500" onClick={() => handleUserClick(group.id)}>
                                        <FaInfo/>
                                        <div>
                                            Group Info
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                        {selectedGroupIdInfo && (
                            <ViewGroupProfile groupId={selectedGroupIdInfo} onClose={handleCloseGroupProfile} />
                        )}
                    </div>
                ))
            )}
        </CardContainer>
    );
};

export default GroupsList;
