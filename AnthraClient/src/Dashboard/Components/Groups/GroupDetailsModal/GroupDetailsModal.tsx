// Components/GroupDetailsModal.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Props {
    groupId: number;
    onClose: () => void;
}

interface Group {
    id: number;
    name: string;
    invitedUsers: User[];
    members: User[];
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
}

const GroupDetailsModal: React.FC<Props> = ({ groupId, onClose }) => {
    const [group, setGroup] = useState<Group | null>(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchGroupDetails();
    }, [groupId]);

    const fetchGroupDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5001/api/Groups/GetGroupDetails`, {
                params: { groupId },
                headers: { Authorization: `Bearer ${token}` },
            });
            setGroup(response.data);
        } catch (error) {
            console.error('Error fetching group details:', error);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-button" onClick={onClose}>
                    &times;
                </button>
                {group ? (
                    <>
                        <h2 className="font-bold">{group.name}</h2>
                        <h3>Members:</h3>
                        <ul>
                            {group.members.map((user) => (
                                <li key={user.id}>
                                    {user.firstName} {user.lastName}
                                </li>
                            ))}
                        </ul>
                        <h3>Invited Users:</h3>
                        <ul>
                            {group.invitedUsers.map((user) => (
                                <li key={user.id}>
                                    {user.firstName} {user.lastName}
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <p>Loading group details...</p>
                )}
            </div>
        </div>
    );
};

export default GroupDetailsModal;
