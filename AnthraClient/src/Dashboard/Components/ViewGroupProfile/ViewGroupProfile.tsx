// ViewGroupProfile.tsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './ViewGroupProfile.css';
import ViewProfile from "../ViewProfile/ViewProfile";

interface ViewGroupProfileProps {
    groupId: number;
    onClose: () => void;
}

interface GroupMember {
    userId: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string;
    institution: string;
    work: string;
    age: number;
    subjects: string[];
    location: string;
}

interface Group {
    id: number;
    name: string;
    groupDescription: string;
    groupDesiredMembers: number;
    members: GroupMember[];
    isPublic: boolean;
}

const ViewGroupProfile: React.FC<ViewGroupProfileProps> = ({ groupId, onClose }) => {
    const [groupProfile, setGroupProfile] = useState<Group | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null); // Changed initial state to null
    const modalRef = useRef<HTMLDivElement>(null);
    const token = localStorage.getItem('token');

    const handleUserClick = (userId: string) => {
        setSelectedUserId(userId);
    };

    const handleCloseProfile = () => {
        setSelectedUserId(null);
    };

    useEffect(() => {
        const fetchGroupProfile = async () => {
            try {
                const response = await axios.get(
                    `/Groups/GetGroupInfo`,
                    {
                        params: { groupId: groupId },
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setGroupProfile(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching group profile:', error);
                setError('Failed to fetch group profile. Please try again later.');
                setLoading(false);
            }
        };

        fetchGroupProfile();
    }, [groupId, token]);

    const handleClickOutside = (event: MouseEvent) => {
        // Prevent closing the group profile if a user profile is open
        if (selectedUserId) return;

        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            onClose();
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedUserId]); // Added selectedUserId as a dependency

    if (loading) {
        return null; // You can return a loading spinner if desired
    }

    if (error) {
        return null; // You can display an error message if desired
    }

    if (!groupProfile) {
        return null;
    }

    return (
        <div id="viewgroupprofile" className="viewgroupprofile-overlay">
            <div className="viewgroupprofile-modal" ref={modalRef}>
                <button className="viewgroupprofile-close-button" onClick={onClose}>
                    &times;
                </button>
                <div className="viewgroupprofile-content">
                    <h2 className="viewgroupprofile-name">{groupProfile.name}</h2>

                    {/* Group Description */}
                    <h3 className="viewgroupprofile-section-subtitle">Description</h3>
                    <p className="viewgroupprofile-description">{groupProfile.groupDescription}</p>

                    {/* Desired Members */}
                    <h3 className="viewgroupprofile-section-subtitle">Desired Members</h3>
                    <p className="viewgroupprofile-desired-members">
                        {groupProfile.groupDesiredMembers}
                    </p>

                    {/* Group Members */}
                    <div className="viewgroupprofile-members-header">
                        <h4 className="viewgroupprofile-section-title">Group Members</h4>
                        <span className="viewgroupprofile-members-count">
                            ({groupProfile.members.length})
                        </span>
                    </div>

                    <div className="viewgroupprofile-members-container">
                        <ul className="viewgroupprofile-members-list">
                            {groupProfile.members.map((member) => (
                                <li
                                    key={member.userId}
                                    onClick={() => handleUserClick(member.userId)}
                                    className="viewgroupprofile-member-item"
                                >
                                    <img
                                        src={`${member.profilePictureUrl}`}
                                        alt={`${member.firstName} ${member.lastName}`}
                                        className="viewgroupprofile-member-picture"
                                    />
                                    <div className="viewgroupprofile-member-info">
                                        <h5>{member.firstName} {member.lastName}</h5>
                                        <p>{member.institution}</p>
                                        <p>{member.location}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile} />
            )}
        </div>
    );
};

export default ViewGroupProfile;
