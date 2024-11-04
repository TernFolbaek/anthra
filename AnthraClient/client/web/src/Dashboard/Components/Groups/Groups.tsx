// Components/Groups/Groups.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Groups.css';
import GroupModal from '../GroupModal/GroupModal';
import GroupMessage from '../../GroupMessages/GroupMessage';
import { useNavigate } from 'react-router-dom';
import GroupsList from '../GroupsList/GroupsList';

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

    return (
        <div className="groups-page">
            {connections.length > 0 ? (
                <>
                    <GroupsList
                        groups={groups}
                        onGroupClick={handleGroupClick}
                        onCreateGroup={handleCreateGroup}
                        selectedGroupId={selectedGroupId}
                    />
                    <div className="group-message-view">
                        {selectedGroupId ? (
                            <GroupMessage groupId={selectedGroupId} />
                        ) : (
                            <div className="no-group-selected">
                                <p>Please select a group to view messages.</p>
                            </div>
                        )}
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
