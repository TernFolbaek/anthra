// Components/GroupMessage/GroupInfo/GroupInfo.tsx
import React, {useEffect, useState} from 'react';
import axios from 'axios';
import './GroupInfo.css';
import ViewProfile from "../../ViewProfile/ViewProfile";

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

const GroupInfo: React.FC<GroupInfoProps> = ({groupId}) => {
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [groupDescription, setGroupDescription] = useState('');
    const [groupDesiredMembers, setGroupDesiredMembers] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
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
                setGroupDescription(response.data.groupDescription);
                setIsPublic(response.data.isPublic);
                setGroupDesiredMembers(response.data.groupDesiredMembers);
                setMembers(response.data.members);
                setAttachments(response.data.attachments);
            } catch (error) {
                console.error('Error fetching group info:', error);
            }
        };

        fetchGroupInfo();
    }, [groupId, token]);

    const handleUserClick = (member: string) => {
        setSelectedUserId(member);
    }

    const handleCloseProfile = () =>{
        setSelectedUserId(null);
    }

    return (
        <div className="group-info">
            <div className="group-info-header">Group Information</div>

            <div className="group-section-title">Group Description</div>
            <p className="group-description">{groupDescription}</p>

            <div className="group-section-title">Who Are We Looking For</div>
            <p className="group-desired-members">{groupDesiredMembers}</p>
            <div className="group-section-title">Group Visibility</div>
            <p className="group-desired-members">{isPublic ?
                "Group is on the explore page!" :
                "Group is not on the explore page"}
            </p>

            <div className="group-section-title">Members</div>
            <ul className="group-members-list">
                {members.map((member) => (
                    <li key={member.userId} onClick={()=>handleUserClick(member.userId)} className="group-member-item">
                        <img
                            src={`${member.profilePictureUrl}`}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="connection-profile-picture"
                        />
                        <span className="group-member-name">
                        {member.firstName} {member.lastName}
                    </span>
                    </li>
                ))}
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
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile}/>
            )}
        </div>
    );

};

export default GroupInfo;
