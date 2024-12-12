import {useEffect, useState} from "react";
import axios from "axios";

interface GroupInvitationMessageProps {
    msg: Message;
    isCurrentUser: boolean;
    contactProfile: UserProfile | null;
    handleAcceptInvitation: (groupId: number) => void;
    handleDeclineInvitation: (groupId: number) => void;
    handleUserClick: (groupId: number | null) => void;
    groupInfoCache: { [key: number]: any };
    setGroupInfoCache: React.Dispatch<React.SetStateAction<{ [key: number]: any }>>;
}

interface Message {
    id: number;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: string;
    isGroupInvitation: boolean;
    groupId: number | null;
    groupName?: string;
    attachments?: Attachment[];
}
interface UserProfile {
    firstName: string;
    lastName: string;
    profilePictureUrl: string;
}

interface Attachment {
    id: number;
    fileName: string;
    fileUrl: string;
}


const GroupInvitationMessage: React.FC<GroupInvitationMessageProps> = ({
                                                                           msg,
                                                                           isCurrentUser,
                                                                           contactProfile,
                                                                           handleAcceptInvitation,
                                                                           handleDeclineInvitation,
                                                                           handleUserClick,
                                                                           groupInfoCache,
                                                                           setGroupInfoCache,
                                                                       }) => {
    const [groupInfo, setGroupInfo] = useState<any>(null);
    const token = localStorage.getItem('token');
    const fetchGroupInfo = async (groupId: number) => {
        try {
            const response = await axios.get(
                `http://localhost:5001/api/Groups/GetGroupInfo`,
                {
                    params: { groupId },
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching group info:', error);
            return null;
        }
    };

    useEffect(() => {
        let isMounted = true;

        const getGroupInfo = async () => {
            if (msg.groupId == null) return;
            if (groupInfoCache[msg.groupId]) {
                setGroupInfo(groupInfoCache[msg.groupId]);
            } else {
                const fetchedGroupInfo = await fetchGroupInfo(msg.groupId);
                if (isMounted && fetchedGroupInfo) {
                    setGroupInfo(fetchedGroupInfo);
                    setGroupInfoCache((prevCache) => ({
                        ...prevCache,
                        [msg.groupId!]: fetchedGroupInfo,
                    }));
                }
            }
        };

        getGroupInfo();

        return () => {
            isMounted = false;
        };
    }, [msg.groupId, groupInfoCache, setGroupInfoCache]);

    if (!groupInfo) {
        return <p>Loading group info...</p>;
    }

    const descriptionPreview =
        groupInfo.groupDescription.length > 25
            ? `${groupInfo.groupDescription.substring(0, 25)}...`
            : groupInfo.groupDescription;

    const memberImages = groupInfo.members.slice(0, 3).map((member: any) => (
        <img
            key={member.userId}
            src={`${member.profilePictureUrl}`}
            alt={`${member.firstName} ${member.lastName}`}
            className="group-member-avatar"
        />
    ));

    // Determine theme class based on msg.content
    let themeClass = '';
    console.log(msg.content)
    switch (msg.content) {
        case 'social':
            themeClass = 'invitation-social';
            break;
        case 'General':
            themeClass = 'invitation-general';
            break;
        case 'Exam Preparation':
            // Ensure exact match of the case or handle string variations
            themeClass = 'invitation-exam-preparation';
            break;
        case 'Studying':
            themeClass = 'invitation-studying';
            break;
        default:
            break;
    }

    return (
        <div className={`invitation-message ${themeClass}`}>
            {isCurrentUser ? (
                <>
                    <p className="text-base">
                        You have invited{' '}
                        <span className="font-bold">{contactProfile?.firstName}</span> to join
                        group:{' '}
                        <span
                            onClick={() => handleUserClick(msg.groupId)}
                            className="font-bold cursor-pointer group-name-clickable"
                        >
                            {groupInfo.name}
                        </span>
                    </p>
                    <div className="group-invitation-details">
                        <p className="invitation-description text-sm">{descriptionPreview}</p>
                        <p className="text-xs">
                            Group Theme: <span className="text-black text-sm font-semibold">{msg.content}</span>
                        </p>
                        <p className="invitation-member-count">
                            Members: {groupInfo.members.length}
                        </p>
                        <div className="group-member-avatars">{memberImages}</div>
                    </div>
                </>
            ) : (
                <>
                    <p>
                        <span className="font-bold">{contactProfile?.firstName}</span> has
                        invited you to join group:{' '}
                        <span
                            onClick={() => handleUserClick(msg.groupId)}
                            className="font-bold cursor-pointer group-name-clickable"
                        >
                            {groupInfo.name}
                        </span>
                    </p>
                    <div className="group-invitation-details">
                        <p className="invitation-description">{descriptionPreview}</p>
                        <p className="invitation-member-count">
                            Group Theme: {msg.content}
                        </p>
                        <p className="invitation-member-count">
                            Members: {groupInfo.members.length}
                        </p>
                        <div className="group-member-avatars">{memberImages}</div>
                    </div>
                    <div className="invitation-buttons">
                        <button
                            className="invitation-accept-button"
                            onClick={() => handleAcceptInvitation(msg.groupId!)}
                        >
                            Accept
                        </button>
                        <button
                            className="invitation-decline-button"
                            onClick={() => handleDeclineInvitation(msg.groupId!)}
                        >
                            Decline
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default GroupInvitationMessage;
