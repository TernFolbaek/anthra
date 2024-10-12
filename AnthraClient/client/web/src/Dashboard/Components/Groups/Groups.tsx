// src/components/Groups.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Groups.css';
import GroupModal from '../GroupModal/GroupModal';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface Group {
    id: number;
    name: string;
    creatorId: string;
    adminName: string;
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
    const navigate = useNavigate(); // Use useNavigate

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    useEffect(() => {
        fetchGroups();
        fetchConnections();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchGroups = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/Groups/GetUserGroups', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setGroups(response.data);
            console.log(response)
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const fetchConnections = async () => {
        try {
            // Fetch accepted connection requests involving the current user
            const response = await axios.get('http://localhost:5001/api/Connections/List', {
                params: { userId },
                withCredentials: true,
            });
            const connections: Connection[] = response.data;
            const connectedUsers = connections.map((request) => {
                if (request.id === userId) {
                    // Assuming the receiver will always have the necessary fields
                    return {
                        id: request.id,
                        firstName: request.firstName,
                        lastName: request.lastName,
                        profilePictureUrl: request.profilePictureUrl
                    };
                } else {
                    return {
                        id: request.id,
                        firstName: request.firstName,
                        lastName: request.lastName,
                        profilePictureUrl: request.profilePictureUrl
                    };
                }
            });
            setConnections(connectedUsers);
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
        navigate('/explore'); // Use navigate instead of history.push
    };

    const handleGroupClick = (groupId: number) => {
        navigate(`/groups/${groupId}`); // Navigate to group details or chat
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
                            <div className="group-card" key={group.id} onClick={() => handleGroupClick(group.id)}>
                                <h3 className="group-name">{group.name}</h3>
                                <p className="group-admin">Admin: {group.adminName}</p>
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
