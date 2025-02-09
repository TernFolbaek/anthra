// GroupMembersTab.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EditGroupModal.css';
import { useNavigate } from 'react-router-dom';
import ViewProfile from "../../ViewProfile/ViewProfile";
interface GroupMember {
    userId: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string;
}

interface GroupMembersTabProps {
    groupInfo: {
        groupId: number;
        groupName: string;
        creatorId: string;
    };
}

const GroupMembersTab: React.FC<GroupMembersTabProps> = ({ groupInfo }) => {
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [selectedMemberToKick, setSelectedMemberToKick] =
        useState<GroupMember | null>(null);
    const [showKickConfirmation, setShowKickConfirmation] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchGroupMembers();
    }, []);

    const fetchGroupMembers = async () => {
        try {
            const response = await axios.get(
                `/Groups/GetGroupInfo`,
                {
                    params: { groupId: groupInfo.groupId },
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setGroupMembers(response.data.members);
        } catch (error) {
            console.error('Error fetching group members:', error);
        }
    };

    const handleKickMember = (member: GroupMember) => {
        setSelectedMemberToKick(member);
        setShowKickConfirmation(true);
    };

    const confirmKickMember = async () => {
        if (selectedMemberToKick) {
            try {
                await axios.post(
                    '/Groups/KickMember',
                    {
                        groupId: groupInfo.groupId,
                        memberId: selectedMemberToKick.userId,
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setGroupMembers((prevMembers) =>
                    prevMembers.filter((m) => m.userId !== selectedMemberToKick.userId)
                );
                setShowKickConfirmation(false);
                setSelectedMemberToKick(null);
            } catch (error) {
                console.error('Error kicking member:', error);
            }
        }
    };

    const cancelKickMember = () => {
        setSelectedMemberToKick(null);
        setShowKickConfirmation(false);
    };

    const handleOpenProfile = (userId: string) => {
        setSelectedUserId(userId)
    };

    const handleCloseProfile = () =>{
        setSelectedUserId(null);
    }

    return (
        <div className="edit-group-members-section">
            <ul className="group-members-list">
                {groupMembers.map((member) => (
                    <li key={member.userId} className="group-member-item-edit dark:text-white">
                        <div className="member-info">
                            <img
                                src={`${member.profilePictureUrl}`}
                                alt={`${member.firstName} ${member.lastName}`}
                            />
                            <span>
                {member.firstName} {member.lastName}
              </span>
                        </div>
                        <div className="member-actions">
                            {member.userId !== groupInfo.creatorId && (
                                <button className="edit-member-action-button-kick text-sm" onClick={() => handleKickMember(member)}>
                                    Kick
                                </button>
                            )}
                            <button className="dark:bg-transparent edit-member-action-button-profile text-sm" onClick={() => handleOpenProfile(member.userId)}>
                                Info
                            </button>

                        </div>
                    </li>
                ))}
            </ul>
            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile}/>
            )}
            {/* Kick Confirmation Modal */}
            {showKickConfirmation && selectedMemberToKick && (
                <div className="kick-confirmation-overlay">
                    <div className="kick-confirmation-modal">
                        <p>
                            Are you sure you want to kick{' '}
                            {selectedMemberToKick.firstName} {selectedMemberToKick.lastName}?
                        </p>
                        <div className="kick-confirmation-buttons">
                            <button className="kick-confirmation-buttons-continue"
                                    onClick={confirmKickMember}>Continue
                            </button>
                            <button className="kick-confirmation-buttons-cancel" onClick={cancelKickMember}>Cancel
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupMembersTab;
