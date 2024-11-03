import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Groups.css';
import GroupModal from '../GroupModal/GroupModal';
import GroupMessage from "../../GroupMessages/GroupMessage";
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

interface Connection {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string;
}

const Groups: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [openMenuGroupId, setOpenMenuGroupId] = useState<number | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        fetchGroups();
        fetchConnections();
        fetchLatestGroupConversation();
    }, []);

    const fetchGroups = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/Groups/GetUserGroups', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const groupsWithMembers = response.data.map((group: Group) => ({
                ...group,
                members: group.members || [],
            }));
            setGroups(groupsWithMembers);

            if (groupsWithMembers.length > 0 && !selectedGroupId) {
                setSelectedGroupId(groupsWithMembers[0].id);
            }
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

    const fetchLatestGroupConversation = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/GroupMessages/GetLatestGroupConversation', {
                params: { userId },
                headers: { Authorization: `Bearer ${token}` },
            });
            const latestGroupId = response.data.groupId;
            setSelectedGroupId(latestGroupId);
        } catch (error) {
            console.error('Error fetching latest group conversation:', error);
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
        setSelectedGroupId(groupId);
    };

    const handleLeaveGroup = async (groupId: number) => {
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
        <div className="groups-container">
            {connections.length > 0 ? (
                <>
                    <div className="groups-content">
                        <div className="groups-list">
                            <button className="create-group-button" onClick={handleCreateGroup}>
                                Create New Group
                            </button>
                            {groups.map((group) => (
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
                        </div>
                        <div className="group-message-view">
                            {selectedGroupId ? (
                                <GroupMessage groupId={selectedGroupId} />
                            ) : (
                                <div className="no-group-selected">
                                    <p>Please select a group to view messages.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {showModal && (
                        <GroupModal onClose={() => setShowModal(false)} onGroupCreated={handleGroupCreated} />
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
