// Components/GroupMessage/GroupInfo/GroupInfo.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GroupInfo.css';
import ViewProfile from "../../ViewProfile/ViewProfile";

interface GroupMember {
    userId: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string;
    institution: string;
}

interface Attachment {
    id: number;
    fileName: string;
    fileUrl: string;
}

interface GroupInfoProps {
    groupId: number;
}

const GroupInfo: React.FC<GroupInfoProps> = ({ groupId }) => {
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [groupDescription, setGroupDescription] = useState('');
    const [groupDesiredMembers, setGroupDesiredMembers] = useState('');
    const [groupPurpose, setGroupPurpose] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [showMembersModal, setShowMembersModal] = useState<boolean>(false);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchGroupInfo = async () => {
            try {
                const response = await axios.get(
                    `http://localhost:5001/api/Groups/GetGroupInfo?groupId=${groupId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                console.log(response.data)
                setGroupDescription(response.data.groupDescription);
                setIsPublic(response.data.isPublic);
                setGroupDesiredMembers(response.data.groupDesiredMembers);
                console.log(response.data.members);
                setMembers(response.data.members);
                setAttachments(response.data.attachments);
                setGroupPurpose(response.data.groupPurpose);
            } catch (error) {
                console.error('Error fetching group info:', error);
            }
        };

        fetchGroupInfo();
    }, [groupId, token]);

    const handleUserClick = (userId: string) => {
        setSelectedUserId(userId);
    }

    const handleCloseProfile = () => {
        setSelectedUserId(null);
    }

    // Determine how many members to show
    const maxMembersToShow = 5;
    const membersToShow = members.slice(0, maxMembersToShow);
    const extraMembersCount = members.length > maxMembersToShow ? members.length - maxMembersToShow : 0;

    const openMembersModal = () => {
        setShowMembersModal(true);
    };

    const closeMembersModal = () => {
        setShowMembersModal(false);
    };

    return (
        <div className="group-info">
            <div className="group-info-header">Group Information</div>

            <div className="group-section-title">Group Description</div>
            <p className="group-description">{groupDescription}</p>

            <div className="group-section-title">Who Are We Looking For</div>
            <p className="group-desired-members">{groupDesiredMembers}</p>
            <div className="group-section-title">Group Purpose</div>
            <p className="group-desired-members">{groupPurpose}</p>

            <div className="group-section-title">Group Visibility</div>
            <p className="group-desired-members">{isPublic ?
                "Group is on the explore page!" :
                "Group is not on the explore page"}
            </p>

            <div className="group-section-title">Members</div>
            <ul className="group-members-list">
                {membersToShow.map((member) => (
                    <li key={member.userId} onClick={() => handleUserClick(member.userId)}
                        className="group-member-item">
                        <img
                            src={`${member.profilePictureUrl}`}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="connection-profile-picture"
                        />
                        <div className="flex w-full justify-between">
                            <p className="modal-member-name">
                                {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs font-semibold text-gray-500">
                                {member.institution}
                            </p>
                        </div>
                    </li>
                ))}
                {extraMembersCount > 0 && (
                    <li
                        className="group-member-item more-members-button"
                        onClick={openMembersModal}
                    >
                        <span className="group-member-name">
                            + {extraMembersCount} more
                        </span>
                    </li>
                )}
            </ul>

            <div className="group-section-title">Attachments</div>
            <ul className="group-attachments-list">
                {attachments.map((attachment) => (
                    <li key={attachment.id} className="group-attachment-item">
                        <a
                            href={`http://localhost:5001/${attachment.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group-attachment-link"
                        >
                            {attachment.fileName}
                        </a>
                    </li>
                ))}
            </ul>
            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile} />
            )}

            {/* Members Modal */}
            {showMembersModal && (
                <div className="modal-overlay" onClick={closeMembersModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-button" onClick={closeMembersModal}>
                            &times;
                        </button>
                        <h2 className="modal-title">Group Members</h2>
                        <ul className="modal-members-list">
                            {members.map((member) => (
                                <li
                                    onClick={() => {
                                        handleUserClick(member.userId);
                                        closeMembersModal();
                                    }}
                                    key={member.userId}
                                    className="modal-member-item flex"
                                >
                                    <img
                                        src={`${member.profilePictureUrl}`}
                                        alt={`${member.firstName} ${member.lastName}`}
                                        className="modal-member-avatar"
                                    />
                                    <div className="flex w-full justify-between">
                                        <p className="modal-member-name">
                                            {member.firstName} {member.lastName}
                                        </p>
                                        <p className="text-xs font-semibold text-gray-500">
                                            {member.institution}
                                        </p>
                                    </div>

                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );

};

export default GroupInfo;
