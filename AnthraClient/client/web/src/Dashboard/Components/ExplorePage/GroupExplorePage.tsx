// GroupExplorePage.tsx
import React, {useEffect, useState} from 'react';
import axios from 'axios';
import './GroupExplorePage.css';
import NoMoreUsersToExplore from '../../Helpers/Animations/NoMoreUsersToExplore';

interface GroupMember {
    userId: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string;
}

interface Group {
    id: number;
    name: string;
    groupDescription: string;
    groupMemberDesire: string;
    members: GroupMember[];
}

const GroupExplorePage: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/GroupsExplore/GetGroups', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setGroups(response.data);
                setCurrentIndex(0);
            } catch (error) {
                console.error('Error fetching groups:', error);
            }
        };

        fetchGroups();
    }, [token]);

    useEffect(() => {
        if (groups.length > 0 && currentIndex < groups.length) {
            setCurrentGroup(groups[currentIndex]);
        } else {
            setCurrentGroup(null);
        }
    }, [groups, currentIndex]);

    const handleApply = async () => {
        if (currentGroup) {
            try {
                await axios.post(
                    'http://localhost:5001/api/GroupsExplore/ApplyToGroup',
                    {groupId: currentGroup.id},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            } catch (error) {
                console.error('Error applying to group:', error);
            }
        }
        setCurrentIndex(currentIndex + 1);
    };

    const handleSkip = async () => {
        if (currentGroup) {
            try {
                await axios.post(
                    'http://localhost:5001/api/GroupsExplore/SkipGroup',
                    {groupIdToSkip: currentGroup.id},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            } catch (error) {
                console.error('Error skipping group:', error);
            }
        }
        setCurrentIndex(currentIndex + 1);
    };

    return (
        <div className="group-explore-container">
            {currentGroup ? (
                <div className="explore-group-card">
                    <div className="explore-group-card-content">
                        <h2 className="group-explore-name">{currentGroup.name}</h2>
                        <p className="group-explore-description">{currentGroup.groupDescription}</p>
                        <h3>What the group is looking for:</h3>
                        <p>{currentGroup.groupMemberDesire}</p>
                        <div className="group-explore-info">
                            <h3>Members</h3>
                            <ul className="group-explore-members-list">
                                {currentGroup.members.map((member) => (
                                    <li key={member.userId} className="group-explore-member-item">
                                        <img
                                            className="group-explore-member-avatar"
                                            src={`http://localhost:5001${member.profilePictureUrl}`}
                                            alt={`${member.firstName} ${member.lastName}`}
                                        />
                                        <span>
                      {member.firstName} {member.lastName}
                    </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="group-explore-button-container">
                            <button className="group-explore-apply-button" onClick={handleApply}>
                                Apply
                            </button>
                            <button className="group-explore-skip-button" onClick={handleSkip}>
                                Skip
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <NoMoreUsersToExplore/>
            )}
        </div>
    );
};

export default GroupExplorePage;
