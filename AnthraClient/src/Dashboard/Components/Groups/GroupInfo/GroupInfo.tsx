// Components/GroupMessage/GroupInfo/GroupInfo.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GroupInfo.css';
import ViewProfile from "../../ViewProfile/ViewProfile";
import Snackbar from "../../../Helpers/Snackbar/Snackbar";
import { FaUserMinus, FaUserPlus, FaFilePdf, FaFileWord, FaFileExcel, FaFileAlt } from "react-icons/fa";
import qs from 'qs'; // Ensure qs is installed: npm install qs

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

interface ConnectionStatusDto {
    targetUserId: string;
    isConnected: boolean;
    requestPending: boolean;
    hasUserSentRequest: boolean;
    hasUserAcceptedRequest: boolean;
}

// -------------- Helpers to detect file type and get icons --------------
function isImageFileName(fileName: string) {
    return /\.(jpeg|jpg|gif|png|bmp|webp)$/i.test(fileName);
}

function getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return (parts.pop() || '').toLowerCase();
}

function getFileIcon(extension: string) {
    switch (extension) {
        case 'pdf':
            return <FaFilePdf className="file-icon pdf" />;
        case 'doc':
        case 'docx':
            return <FaFileWord className="file-icon word" />;
        case 'xls':
        case 'xlsx':
            return <FaFileExcel className="file-icon excel" />;
        default:
            return <FaFileAlt className="file-icon generic" />;
    }
}

const GroupInfo: React.FC<GroupInfoProps> = ({ groupId }) => {
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [groupDescription, setGroupDescription] = useState('');
    const [groupDesiredMembers, setGroupDesiredMembers] = useState('');
    const [groupPurpose, setGroupPurpose] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    // Attachments
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [showModal, setShowModal] = useState(false); // "See More" modal

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [showMembersModal, setShowMembersModal] = useState<boolean>(false);

    // New state for connection statuses
    const [connectionStatuses, setConnectionStatuses] = useState<{ [key: string]: ConnectionStatusDto }>({});
    const [loadingStatuses, setLoadingStatuses] = useState<boolean>(false);
    const [errorStatuses, setErrorStatuses] = useState<string | null>(null);

    // Snackbar states
    const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
    const [snackbarTitle, setSnackbarTitle] = useState<string>("");
    const [snackbarMessage, setSnackbarMessage] = useState<string>("");

    // Loading state for individual actions (send/revoke/remove)
    const [loadingActions, setLoadingActions] = useState<{ [key: string]: boolean }>({});

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        const fetchGroupInfo = async () => {
            try {
                const response = await axios.get(
                    `/Groups/GetGroupInfo?groupId=${groupId}`,
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
                setGroupPurpose(response.data.groupPurpose);
            } catch (error) {
                console.error('Error fetching group info:', error);
            }
        };

        fetchGroupInfo();
    }, [groupId, token]);

    useEffect(() => {
        const fetchConnectionStatuses = async () => {
            if (members.length === 0) return;

            // Exclude current user from targetUserIds if present
            const targetUserIds = members
                .filter(member => member.userId !== userId)
                .map(member => member.userId);

            if (targetUserIds.length === 0) return;

            try {
                setLoadingStatuses(true);
                setErrorStatuses(null);

                const response = await axios.get(
                    '/Connections/Statuses',
                    {
                        params: { targetUserIds },
                        paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' }),
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const statuses: ConnectionStatusDto[] = response.data;

                // Convert the array to a map for easy access
                const statusMap: { [key: string]: ConnectionStatusDto } = {};
                statuses.forEach(status => {
                    statusMap[status.targetUserId] = status;
                });

                setConnectionStatuses(statusMap);
            } catch (error) {
                console.error('Error fetching connection statuses:', error);
                setErrorStatuses('Failed to fetch connection statuses. Please try again later.');
            } finally {
                setLoadingStatuses(false);
            }
        };

        fetchConnectionStatuses();
    }, [members, token, userId]);

    const handleUserClick = (userId: string) => {
        setSelectedUserId(userId);
    };

    const handleCloseProfile = () => {
        setSelectedUserId(null);
    };

    const openMembersModal = () => {
        setShowMembersModal(true);
    };

    const closeMembersModal = () => {
        setShowMembersModal(false);
    };

    // Helper function to get user's full name
    const getUserFullName = (uid: string): string => {
        const member = members.find(member => member.userId === uid);
        return member ? `${member.firstName} ${member.lastName}` : "User";
    };

    // Handle sending a connection request
    const handleConnect = async (targetUserId: string) => {
        try {
            setLoadingActions(prev => ({ ...prev, [targetUserId]: true }));
            await axios.post(
                '/Connections/SendRequest',
                { targetUserId: targetUserId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Update connectionStatuses state
            setConnectionStatuses(prev => ({
                ...prev,
                [targetUserId]: {
                    targetUserId: targetUserId,
                    isConnected: false,
                    requestPending: true,
                    hasUserSentRequest: true,
                    hasUserAcceptedRequest: false,
                }
            }));

            // Show success Snackbar
            setSnackbarTitle("Connection Request Sent");
            setSnackbarMessage(`You have sent a connection request to ${getUserFullName(targetUserId)}.`);
            setSnackbarVisible(true);
        } catch (error) {
            console.error('Error sending connection request:', error);
            // Show error Snackbar
            setSnackbarTitle("Error");
            setSnackbarMessage("Failed to send connection request. Please try again.");
            setSnackbarVisible(true);
        } finally {
            setLoadingActions(prev => ({ ...prev, [targetUserId]: false }));
        }
    };

    // Handle cancelling a connection request or removing a connection
    const handleCancelRequest = async (targetUserId: string) => {
        const status = connectionStatuses[targetUserId];

        if (!status) {
            console.error('No connection status found for user:', targetUserId);
            return;
        }

        if (status.isConnected) {
            // Remove existing connection
            try {
                setLoadingActions(prev => ({ ...prev, [targetUserId]: true }));
                await axios.post(
                    '/Connections/RemoveConnection',
                    { targetUserId: targetUserId },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                // Update connectionStatuses
                setConnectionStatuses(prev => ({
                    ...prev,
                    [targetUserId]: {
                        targetUserId: targetUserId,
                        isConnected: false,
                        requestPending: false,
                        hasUserSentRequest: false,
                        hasUserAcceptedRequest: false,
                    }
                }));

                // Show success Snackbar
                setSnackbarTitle("Connection Removed");
                setSnackbarMessage(`You have removed the connection with ${getUserFullName(targetUserId)}.`);
                setSnackbarVisible(true);
            } catch (error) {
                console.error('Error removing connection:', error);
                setSnackbarTitle("Error");
                setSnackbarMessage("Failed to remove connection. Please try again.");
                setSnackbarVisible(true);
            } finally {
                setLoadingActions(prev => ({ ...prev, [targetUserId]: false }));
            }
        } else if (status.hasUserSentRequest) {
            // Revoke sent connection request
            try {
                setLoadingActions(prev => ({ ...prev, [targetUserId]: true }));
                await axios.post(
                    '/Connections/RevokeRequest',
                    { targetUserId: targetUserId },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setConnectionStatuses(prev => ({
                    ...prev,
                    [targetUserId]: {
                        targetUserId: targetUserId,
                        isConnected: false,
                        requestPending: false,
                        hasUserSentRequest: false,
                        hasUserAcceptedRequest: false,
                    }
                }));

                // Show success Snackbar
                setSnackbarTitle("Connection Request Revoked");
                setSnackbarMessage(`You have revoked your connection request to ${getUserFullName(targetUserId)}.`);
                setSnackbarVisible(true);
            } catch (error) {
                console.error('Error revoking connection request:', error);
                setSnackbarTitle("Error");
                setSnackbarMessage("Failed to revoke connection request. Please try again.");
                setSnackbarVisible(true);
            } finally {
                setLoadingActions(prev => ({ ...prev, [targetUserId]: false }));
            }
        }
    };

    // Determine how many members to show
    const maxMembersToShow = 5;
    const membersToShow = members.slice(0, maxMembersToShow);
    const extraMembersCount = members.length > maxMembersToShow ? members.length - maxMembersToShow : 0;

    if (loadingStatuses) {
        return <div>Loading connection statuses...</div>;
    }

    if (errorStatuses) {
        return <div>{errorStatuses}</div>;
    }

    // ---------------- "MEDIA" Section for Attachments ----------------

    // We'll display up to 4 attachments in a grid, then use "See More" if there are extras
    const renderThumbnail = (att: Attachment, size = 120) => {
        const ext = getFileExtension(att.fileName);
        const isImage = isImageFileName(att.fileName);

        return (
            <div key={att.id} className="media-thumb">
                {isImage ? (
                    <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                        <img
                            src={att.fileUrl}
                            alt={att.fileName}
                            style={{ width: size, height: size, objectFit: 'cover', borderRadius: '10%' }}
                        />
                    </a>
                ) : (
                    <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                    >
                        <div className="doc-thumb-icon" style={{ width: size, height: size }}>
                            {getFileIcon(ext)}
                        </div>
                    </a>
                )}
                <div className="thumb-filename">
                    {att.fileName.length > 10
                        ? `${att.fileName.substring(0, 10)}...`
                        : att.fileName}
                </div>
            </div>
        );
    };

    const maxMediaPreview = 4;
    const attachmentsToShow = attachments.slice(0, maxMediaPreview);
    const showSeeMoreButton = attachments.length > maxMediaPreview;

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
            <p className="group-desired-members">
                {isPublic ? "Group is on the explore page!" : "Group is not on the explore page"}
            </p>

            <div className="group-section-title">Members</div>
            <ul className="group-members-list">
                {membersToShow.map((member) => {
                    const status = connectionStatuses[member.userId];
                    const isLoading = loadingActions[member.userId] || false;

                    return (
                        <li
                            key={member.userId}
                            onClick={() => handleUserClick(member.userId)}
                            className="group-member-item"
                        >
                            <img
                                src={`${member.profilePictureUrl}`}
                                alt={`${member.firstName} ${member.lastName}`}
                                className="connection-profile-picture"
                            />
                            <div className="flex w-full justify-between">
                                <p className="modal-member-name">
                                    {member.firstName} {member.lastName}
                                </p>
                                <div className="connection-action">
                                    {status && (status.isConnected || status.requestPending) && member.userId !== userId ? (
                                        <button
                                            className="connection-button-remove"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCancelRequest(member.userId);
                                            }}
                                            title={
                                                status.isConnected
                                                    ? "Remove Connection"
                                                    : "Revoke Connection Request"
                                            }
                                            disabled={isLoading}
                                            aria-label={
                                                status.isConnected
                                                    ? `Remove connection with ${member.firstName} ${member.lastName}`
                                                    : `Revoke connection request to ${member.firstName} ${member.lastName}`
                                            }
                                        >
                                            {isLoading ? "..." : <FaUserMinus size={18} />}
                                        </button>
                                    ) : (
                                        member.userId !== userId && (
                                            <button
                                                className="connection-button text-emerald-400"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleConnect(member.userId);
                                                }}
                                                title="Send Friend Request"
                                                disabled={status?.requestPending || isLoading}
                                                aria-label={`Send friend request to ${member.firstName} ${member.lastName}`}
                                            >
                                                {isLoading ? "..." : <FaUserPlus size={18} />}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
                {extraMembersCount > 0 && (
                    <li
                        className="group-member-item more-members-button"
                        onClick={openMembersModal}
                    >
                        <span className="group-member-name">+ {extraMembersCount} more</span>
                    </li>
                )}
            </ul>

            {/* ---------------- MEDIA Section: Attachments in grid ---------------- */}
            <div className="group-section-title">Media</div>
            {attachments.length === 0 ? (
                <p style={{ fontSize: '0.9rem', color: '#666' }}>No media found</p>
            ) : (
                <div className="media-section-grid">
                    {attachmentsToShow.map((att) => renderThumbnail(att, 120))}
                </div>
            )}
            {showSeeMoreButton && (
                <button className="see-more-button" onClick={() => setShowModal(true)}>
                    See More
                </button>
            )}

            {/* "See More" Modal */}
            {showModal && (
                <div
                    className="media-modal-backdrop"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="media-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>All Attachments</h3>
                        <div className="all-attachments-grid">
                            {attachments.map((att) => renderThumbnail(att, 80))}
                        </div>
                        <button
                            className="close-modal-button"
                            onClick={() => setShowModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

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
                        <h2 className="modal-title font-semibold">Group Members</h2>
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
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                                            {member.institution}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Snackbar Component */}
            {snackbarVisible && (
                <Snackbar
                    title={snackbarTitle}
                    message={snackbarMessage}
                    duration={4000}
                    onClose={() => setSnackbarVisible(false)}
                />
            )}
        </div>
    );
};

export default GroupInfo;
