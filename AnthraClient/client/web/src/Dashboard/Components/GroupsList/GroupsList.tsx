// Components/GroupsList/GroupsList.tsx
import React, { useState, useEffect } from 'react';
import CardContainer from '../CardContainer/CardContainer';
import './GroupsList.css';

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

const GroupsList: React.FC<GroupsListProps> = ({ groups, onGroupClick, onCreateGroup, selectedGroupId }) => {
    const [openMenuGroupId, setOpenMenuGroupId] = useState<number | null>(null);

    const handleGroupClick = (groupId: number) => {
        onGroupClick(groupId);
    };

    const handleLeaveGroup = (groupId: number) => {
        // Implement the logic to leave the group
        console.log(`Leave group ${groupId}`);
        setOpenMenuGroupId(null);
    };

    const handleGroupOversight = (groupId: number) => {
        // Implement the logic to navigate to the group oversight page
        console.log(`Group oversight for group ${groupId}`);
        setOpenMenuGroupId(null);
    };

    return (
        <CardContainer title="Groups">
            <button className="create-group-button" onClick={onCreateGroup}>
                Create New Group
            </button>
            {groups.map((group) => (
                <div
                    className={`group-card ${selectedGroupId === group.id ? 'group-card-selected' : ''}`}
                    key={group.id}
                    onClick={() => handleGroupClick(group.id)}
                >
                    <div className="group-name">{group.name}</div>
                    <div className="group-options">
                        <button
                            className="group-options-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuGroupId(openMenuGroupId === group.id ? null : group.id);
                            }}
                        >
                            ⋯
                        </button>
                        {openMenuGroupId === group.id && (
                            <div
                                className="group-options-menu"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button onClick={() => handleLeaveGroup(group.id)}>
                                    Leave Group
                                </button>
                                <button onClick={() => handleGroupOversight(group.id)}>
                                    Group Oversight
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </CardContainer>
    );
};

export default GroupsList;
