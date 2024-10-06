// src/components/Groups.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Groups.css'
import GroupModal from '../GroupModal/GroupModal';

interface Group {
    id: number;
    name: string;
    creatorId: string;
}

const Groups: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [showModal, setShowModal] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/Groups/GetUserGroups', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setGroups(response.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const handleCreateGroup = () => {
        setShowModal(true);
    };

    const handleGroupCreated = () => {
        setShowModal(false);
        fetchGroups();
    };

    return (
        <div  className="groups-container">
            <h2>Your Groups</h2>
            <button className="create-group-button" onClick={handleCreateGroup}>Create New Group</button>
            <ul className="groups-list">
                {groups.map((group) => (
                    <li className="group-item" key={group.id}>{group.name}</li>
                ))}
            </ul>
            {showModal && <GroupModal onClose={() => setShowModal(false)} onGroupCreated={handleGroupCreated} />}
        </div>
    );
};

export default Groups;
