import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Groups.css';
import GroupModal from '../GroupModal/GroupModal';
import { useNavigate } from 'react-router-dom';

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

interface Connection { id: string; firstName: string; lastName: string; profilePictureUrl: string; }

const Groups: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [openMenuGroupId, setOpenMenuGroupId] = useState<number | null>(null);
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        fetchGroups();
        fetchConnections();
    }, []);

    const fetchGroups = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/Groups/GetUserGroups', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const groupsWithMembers = response.data.map((group: Group) => ({
                ...group,
                members: group.members || [], // Ensure members is an array
            }));
            setGroups(groupsWithMembers);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };



    const fetchConnections = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/Connections/List', {
                params: { userId },
                withCredentials: true,
            });
            setConnections(response.data);
        } catch (error) {
            console.error('Error fetching connections:', error);
        }
    };

    const handleCreateGroup = () => {
        setShowModal(true);
    };

    const handleGroupCreated = () => {
        setShowModal(false);
        fetchGroups();
    };

    const handleExplore = () => {
        navigate('/explore');
    };

    const handleGroupClick = (groupId: number) => {
        navigate(`/groups/${groupId}`);
    };

    const handleLeaveGroup = async (groupId: number) => {
        // Implement the logic to leave the group
        console.log(`Leave group ${groupId}`);
        // Close the menu
        setOpenMenuGroupId(null);
    };

    const handleGroupOversight = (groupId: number) => {
        // Implement the logic to navigate to the group oversight page
        console.log(`Group oversight for group ${groupId}`);
        // Close the menu
        setOpenMenuGroupId(null);
    };

    return (
        <div className="groups-container">
            {connections.length > 0 ? (
                <>
                    <button className="create-group-button" onClick={handleCreateGroup}>
                        Create New Group
                    </button>
                    <div className="groups-grid">
                        {groups.map((group) => (
                            <div
                                className="group-card"
                                key={group.id}
                                onClick={() => handleGroupClick(group.id)}
                            >
                                <div className="group-card-header">
                                    <h3 className="group-name">{group.name}</h3>
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
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button onClick={() => handleLeaveGroup(group.id)}>
                                                    Leave Group
                                                </button>
                                                <button
                                                    onClick={() => handleGroupOversight(group.id)}
                                                >
                                                    Group Oversight
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="group-admin">Admin: {group.adminName}</p>
                                {/* Members' profile pictures */}
                                <div className="group-members">
                                    {group.members && group.members.length > 0 ? (
                                        group.members.slice(0, 5).map((member, index) => (
                                            <img
                                                key={member.userId}
                                                src={`http://localhost:5001${member.profilePictureUrl}`}
                                                alt="Member"
                                                className="group-member-avatar"
                                                style={{
                                                    left: `${index * 20}px`,
                                                    zIndex: group.members.length - index,
                                                }}
                                            />
                                        ))
                                    ) : (
                                        <p className="no-members">No members yet</p>
                                    )}
                                    {group.members && group.members.length > 5 && (
                                        <div
                                            className="group-member-avatar more-members"
                                            style={{left: `${5 * 20}px`}}
                                        >
                                            +{group.members.length - 5}
                                        </div>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>
                    {showModal && (
                        <GroupModal
                            onClose={() => setShowModal(false)}
                            onGroupCreated={handleGroupCreated}
                        />
                    )}
                </>
            ) : (
                <div className="no-connections-overlay">
                    <div className="no-connections-card">
                        <h2>You need connections to create groups.</h2>
                        <p>Get started by exploring and connecting with others.</p>
                        <button className="explore-button" onClick={handleExplore}>
                            Explore
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Groups;
