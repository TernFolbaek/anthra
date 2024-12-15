// src/components/GroupInvitationMessage/GroupInvitationMessage.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { MdGroups } from "react-icons/md";
import { FaChalkboardTeacher, FaBookReader, FaLaptopCode } from "react-icons/fa";
import { Message, InvitationActionType, UserProfile } from '../../Components/types/types';

interface GroupInvitationMessageProps {
    msg: Message;
    isCurrentUser: boolean; // Determined by parent
    contactProfile: UserProfile | null;
    handleAcceptInvitation: () => void;
    handleDeclineInvitation: () => void;
    handleUserClick: (groupId: number | null) => void;
    groupInfoCache: { [key: number]: any };
    setGroupInfoCache: React.Dispatch<React.SetStateAction<{ [key: number]: any }>>;
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
    const [invitationStatus, setInvitationStatus] = useState<boolean | undefined>(msg.invitationStatus);
    const [actionType, setActionType] = useState<InvitationActionType>(msg.actionType || InvitationActionType.None);
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
    }, [msg.groupId, groupInfoCache, setGroupInfoCache, token]);

    // Update local state if msg prop changes
    useEffect(() => {
        setInvitationStatus(msg.invitationStatus);
        setActionType(msg.actionType || InvitationActionType.None);
    }, [msg.invitationStatus, msg.actionType]);

    if (!groupInfo) {
        return <p>Loading group info...</p>;
    }

    const descriptionPreview =
        groupInfo.groupDescription.length > 25
            ? `${groupInfo.groupDescription.substring(0, 50)}...`
            : groupInfo.groupDescription;

    const memberImages = groupInfo.members.slice(0, 3).map((member: any) => (
        <img
            key={member.userId}
            src={`${member.profilePictureUrl}`}
            alt={`${member.firstName} ${member.lastName}`}
            className="group-member-avatar"
        />
    ));

    // Define the mapping of group themes to icons
    const groupThemeIcons: { [key: string]: React.ReactElement } = {
        'social': <MdGroups size={60} />,
        'general': <FaChalkboardTeacher size={60} />,
        'exam preparation': <FaBookReader size={60} />,
        'studying': <FaLaptopCode size={60} />,
    };

    // Determine the icon based on the group theme
    const themeKey = msg.content.toLowerCase();
    const ThemeIcon = groupThemeIcons[themeKey] || <MdGroups size={60} />; // Default icon if theme not found

    // Function to handle action messages based on actionType and isCurrentUser
    const getActionMessage = () => {
        const otherUser = isCurrentUser ? "You" : contactProfile?.firstName || "Someone";

        switch (actionType) {
            case InvitationActionType.Accepted:
                return `${otherUser} accepted the group invitation.`;
            case InvitationActionType.Declined:
                return `${otherUser} declined the group invitation.`;
            default:
                return null;
        }
    }

    // Handler for Accept button click
    const onAccept = async () => {
        try {
            await handleAcceptInvitation(); // Call the handler passed from parent

            // Update local state to reflect acceptance
            setInvitationStatus(true);
            setActionType(InvitationActionType.Accepted);
        } catch (error) {
            console.error('Error accepting invitation:', error);
            alert('Failed to accept the invitation. Please try again.');
        }
    }

    // Handler for Decline button click
    const onDecline = async () => {
        try {
            await handleDeclineInvitation(); // Call the handler passed from parent

            // Update local state to reflect declination
            setInvitationStatus(true);
            setActionType(InvitationActionType.Declined);
        } catch (error) {
            console.error('Error declining invitation:', error);
            alert('Failed to decline the invitation. Please try again.');
        }
    }

    return (
        <div className="invitation-message bg-amber-50">
            <div className="bg-amber-100 min-w-[150px] rounded-md flex flex-col items-center justify-center" title={msg.content}>
                {ThemeIcon}
                <p className="text-xs text-center">
                    Group Theme: <span className="text-black text-sm font-semibold">{msg.content}</span>
                </p>
            </div>
            <div className="">
                {!isCurrentUser ? (
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
                            <p className="break-all invitation-description text-sm">{descriptionPreview}</p>

                            <p className="font-semibold text-sm invitation-member-count">
                                Members: {groupInfo.members.length}
                            </p>
                            <div className="group-member-avatars">{memberImages}</div>
                        </div>
                        {invitationStatus && (
                            <div className="action-message">
                                <p className="text-sm text-gray-600 bg-gray-100 rounded-md p-1 text-center font-semibold mt-1">
                                    {getActionMessage()}
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <p>
                            <span className="text-base font-bold">{contactProfile?.firstName}</span> has
                            invited you to join group:{' '}
                            <span
                                onClick={() => handleUserClick(msg.groupId)}
                                className="font-bold cursor-pointer group-name-clickable"
                            >
                                {groupInfo.name}
                            </span>
                        </p>
                        <div className="group-invitation-details">
                            <p className="text-sm break-all invitation-description">{descriptionPreview}</p>

                            <p className="font-semibold text-sm invitation-member-count">
                                Members: {groupInfo.members.length}
                            </p>
                            <div className="group-member-avatars">{memberImages}</div>
                        </div>

                        {/* Display Action Message if InvitationStatus is true */}
                        {invitationStatus && (
                            <div className="action-message">
                                <p className="text-sm text-gray-600 bg-gray-100 rounded-md p-1 text-center font-semibold mt-1">
                                    {getActionMessage()}
                                </p>
                            </div>
                        )}

                        {/* Show buttons only if InvitationStatus is not set */}
                        {!invitationStatus && (
                            <div className="flex justify-center gap-2">
                                <button
                                    className="p-2 hover:bg-amber-100 bg-amber-200 rounded-md text-sm font-medium"
                                    onClick={onAccept}
                                >
                                    Accept
                                </button>
                                <button
                                    className="p-2 hover:bg-amber-200 bg-amber-400 rounded-md text-sm font-medium"
                                    onClick={onDecline}
                                >
                                    Decline
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

};

export default GroupInvitationMessage;
