import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Groups.css';
import GroupModal from './GroupModal/GroupModal';
import GroupMessage from './GroupMessages/GroupMessage';
import { useNavigate, useParams } from 'react-router-dom';
import GroupsList from './GroupsList/GroupsList';
import { useRive } from '@rive-app/react-canvas';
import NoConnectionsRive from "../../Helpers/Animations/NoConnections";

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
    const navigate = useNavigate();
    const { groupId } = useParams<{ groupId?: string }>();
    const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > 900);

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        const handleResize = () => {
            setIsWideScreen(window.innerWidth > 900);
        };
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                members: group.members || [],
            }));
            setGroups(groupsWithMembers);

            if (groupsWithMembers.length > 0 && !groupId && isWideScreen) {
                // Navigate to the first group
                navigate(`/groups/${groupsWithMembers[0].id}`);
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

    const handleCreateGroup = () => {
        setShowModal(true);
    };

    const handleGroupCreated = () => {
        setShowModal(false);
        fetchGroups();
    };


    const handleGroupClick = (groupId: number) => {
        navigate(`/groups/${groupId}`);
    };

    return (
        <div className="groups-page">
            {connections.length > 0 ? (
                <>
                    {(isWideScreen || !groupId) && (
                        <GroupsList
                            groups={groups}
                            onGroupClick={handleGroupClick}
                            onCreateGroup={handleCreateGroup}
                            selectedGroupId={groupId ? parseInt(groupId) : null}
                        />
                    )}
                    {(isWideScreen || groupId) && (
                        <div className="group-message-view">
                            {groupId ? (
                                <GroupMessage groupId={parseInt(groupId)} showModal={showModal} />
                            ) : (
                                isWideScreen && (
                                    <div className="no-group-selected">
                                        <p className="text-base text-gray-500 font-bold">Please select a group to view messages</p>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                    {showModal && (
                        <GroupModal onClose={() => setShowModal(false)} onGroupCreated={handleGroupCreated} />
                    )}
                </>
            ) : (
                <>
                    {(isWideScreen ) && (
                        <>
                            <GroupsList
                            groups={groups}
                            onGroupClick={handleGroupClick}
                            onCreateGroup={handleCreateGroup}
                            selectedGroupId={groupId ? parseInt(groupId) : null}
                        />
                        <div className="no-groups-container">
                        <NoConnectionsRive/>
                        </div>
                        </>
                    )}
                    {(!isWideScreen ) && (
                        <>
                            <GroupsList
                                groups={groups}
                                onGroupClick={handleGroupClick}
                                onCreateGroup={handleCreateGroup}
                                selectedGroupId={groupId ? parseInt(groupId) : null}
                            />
                        </>
                    )}

                </>
            )}
        </div>
    );
};

export default Groups;
