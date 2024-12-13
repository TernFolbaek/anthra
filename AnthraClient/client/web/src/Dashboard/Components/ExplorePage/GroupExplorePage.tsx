import React, {useEffect, useState} from 'react';
import axios from 'axios';
import './GroupExplorePage.css';
import NoMoreGroupsToExplore from '../../Helpers/Animations/NoMoreGroupsToExplore';
import ViewProfile from "../ViewProfile/ViewProfile";

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
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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
                    { groupId: currentGroup.id },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                // Optionally display a success message or state
            } catch (error: any) {
                if (error.response && error.response.data) {
                    alert(error.response.data); // Display error message to the user
                } else {
                    console.error('Error applying to group:', error);
                }
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

    const handleUserClick = (userId: string) => {
        setSelectedUserId(userId);
    };

    const handleCloseProfile = () => {
        setSelectedUserId(null);
    };

    return (
        <div className="group-explore-container">
            {currentGroup ? (
                <div className="explore-group-card">
                    <div className="explore-group-card-content">
                        <div>
                        <h2 className="group-explore-name">{currentGroup.name}</h2>
                        <h3>About the group:</h3>
                        <p className="group-explore-description">{currentGroup.groupDescription}</p>
                        <h3>What the group is looking for:</h3>
                        <p className="break-all">{currentGroup.groupMemberDesire}</p>
                        <div className="group-explore-info">
                            <h3>Members</h3>
                            <ul className="group-explore-members-list">
                                {currentGroup.members.map((member) => (
                                    <li onClick={()=>handleUserClick(member.userId)} key={member.userId} className="group-explore-member-item">
                                        <img
                                            className="group-explore-member-avatar"
                                            src={`${member.profilePictureUrl}`}
                                            alt={`${member.firstName} ${member.lastName}`}
                                        />
                                        <span>
                                        {member.firstName} {member.lastName}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
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
                <NoMoreGroupsToExplore/>
            )}
            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile}/>
            )}
        </div>
    );
};

export default GroupExplorePage;
