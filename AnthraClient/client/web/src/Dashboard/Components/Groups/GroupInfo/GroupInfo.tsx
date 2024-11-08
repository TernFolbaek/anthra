// Components/GroupMessage/GroupInfo/GroupInfo.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GroupInfo.css';

interface GroupMember {
    userId: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string;
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
    const [attachments, setAttachments] = useState<Attachment[]>([]);
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
                setMembers(response.data.members);
                setAttachments(response.data.attachments);
            } catch (error) {
                console.error('Error fetching group info:', error);
            }
        };

        fetchGroupInfo();
    }, [groupId, token]);

    return (
        <div className="group-info">
            <h2>Group Members</h2>
            <ul className="group-members-list">
                {members.map((member) => (
                    <li key={member.userId} className="group-member-item">
                        <img
                            src={`http://localhost:5001/${member.profilePictureUrl}`}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="member-avatar"
                        />
                        <span>
                            {member.firstName} {member.lastName}
                        </span>
                    </li>
                ))}
            </ul>
            <h2>Attachments</h2>
            <ul className="group-attachments-list">
                {attachments.map((attachment) => (
                    <li key={attachment.id} className="group-attachment-item">
                        <a
                            href={`http://localhost:5001/${attachment.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {attachment.fileName}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GroupInfo;
