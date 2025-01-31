import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import axios from 'axios';
import './GroupMessage.css';
import { useNavigate } from 'react-router-dom';
import {
    FaEllipsisV, FaArrowLeft, FaPenSquare, FaInfo, FaUserPlus,
    FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFlag, FaTrash
} from 'react-icons/fa';
import * as signalR from '@microsoft/signalr';
import { MdExitToApp } from "react-icons/md";
import GroupInfo from '../GroupInfo/GroupInfo';
import GroupMessageInput from "./GroupMessageInput";
import EditGroupModal from "../EditGroupModal/EditGroupModal";
import ViewProfile from "../../ViewProfile/ViewProfile";
import AddMembersModal from "../AddMembersModal/AddMembersModal";
import Snackbar from "../../../Helpers/Snackbar/Snackbar";
import useWindowWidth from "../../../hooks/useWindowWidth";
import ConfirmationDialog from "../../../Helpers/Dialogs/ConfirmationDialog/ConfirmationDialog";

/** ---- TYPES ---- **/
interface Attachment {
    id: number;
    fileName: string;
    fileUrl: string;
}

interface Message {
    id: number;
    content: string;
    timestamp: string;
    senderId: string;
    senderFirstName: string;
    senderProfilePictureUrl: string | null;
    groupId: number;
    attachments?: Attachment[];
}

interface GroupMessageProps {
    groupId: number;
    showModal: boolean;
}

interface GroupDetails {
    adminName: string;
    groupName: string;
    creatorId: string;
    groupId: number;
    groupDescription: string;
    groupMembersDesired: string;
    isPublic: boolean;
    groupPurpose: string;
}

/** ---- FILE ICON HELPERS ---- **/
function isImageFileName(fileName: string) {
    return /\.(jpeg|jpg|gif|png|bmp|webp)$/i.test(fileName);
}

function getFileExtension(fileName: string): string {
    const parts = fileName.split(".");
    return (parts.pop() || "").toLowerCase();
}

function getFileIcon(extension: string) {
    switch (extension) {
        case "pdf":
            return <FaFilePdf className="file-icon pdf" />;
        case "doc":
        case "docx":
            return <FaFileWord className="file-icon word" />;
        case "xls":
        case "xlsx":
            return <FaFileExcel className="file-icon excel" />;
        default:
            return <FaFileAlt className="file-icon generic" />;
    }
}

const GroupMessage: React.FC<GroupMessageProps> = ({ groupId, showModal }) => {
    /** ---- STATE ---- **/
        // Main state for messages (in chronological order)
    const [messages, setMessages] = useState<Message[]>([]);

    // Group info details (fetched once per groupId)
    const [groupInfo, setGroupInfo] = useState<GroupDetails | null>(null);
    const isGroupCreator = groupInfo?.creatorId === localStorage.getItem("userId");

    // Connection to SignalR (mirroring Messages.tsx)
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

    // For general “mobile layout” usage
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1300);
    const [isMobileDeleteMessage, setIsMobileDeleteMessage] = useState(window.innerWidth <= 500);

    // UI toggles
    const [showMenu, setShowMenu] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [showEditGroupModal, setShowEditGroupModal] = useState(false);

    // Reporting
    const [showReportPopup, setShowReportPopup] = useState(false);
    const [reportDescription, setReportDescription] = useState('');
    const [reportFiles, setReportFiles] = useState<File[]>([]);

    // For viewing another user's profile
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Add members
    const [showAddMembersModal, setShowAddMembersModal] = useState(false);

    // Context menu
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

    // Infinite scroll & paging states
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
    const [nextTokenValue, setNextTokenValue] = useState<string | null>(null);
    const [firstLoad, setFirstLoad] = useState(true);

    // Snackbar / notifications
    const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
    const [snackbarTitle, setSnackbarTitle] = useState<string>('');
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const windowWidth = useWindowWidth();
    const isSmallScreen = windowWidth < 480;

    // Deletion-related state
    const [selectedMessageForDelete, setSelectedMessageForDelete] = useState<number | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Refs
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Basic user info
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    /** ---- EFFECT: Resize => update isMobile ---- **/
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1300);
            setIsMobileDeleteMessage(window.innerWidth <= 500);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    /**
     * 1) Whenever groupId changes, fetch the group info & initial messages.
     *    (Like your existing logic in Messages.tsx that fetches user profile + messages.)
     */
    useEffect(() => {
        if (!groupId) return;
        setAllMessagesLoaded(false);
        setMessages([]);
        setNextTokenValue(null);
        setFirstLoad(true);

        void fetchGroupDetails();
        void fetchInitialMessages();
    }, [groupId]);

    /**
     * 2) Build the SignalR connection or rebuild it
     *    every time groupId/token changes (mirror of Messages.tsx).
     */
    useEffect(() => {
        // If either is missing, no connection
        if (!groupId || !token) return;

        // If we already have a connection, stop it before building a new one
        if (connection) {
            connection.stop();
        }

        // Build a new connection
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("https://api.anthra/chatHub", {
                accessTokenFactory: () => token || "",
            })
            .withAutomaticReconnect()
            .build();

        // Start the connection, then join the group & set up event listeners
        newConnection
            .start()
            .then(() => {
                // Join the group
                newConnection.invoke("JoinGroup", `Group_${groupId}`);

                // Listen for new messages in this group
                newConnection.on("ReceiveGroupMessage", (message: Message) => {
                    // Only append if it belongs to the current group
                    if (message.groupId === groupId) {
                        setMessages((prev) => [...prev, message]);
                    }
                });

                // If your backend emits "GroupMessageDeleted"
                newConnection.on("GroupMessageDeleted", (data) => {setMessages(prev => prev.filter(m => m.id !== data.messageId));
                });
            })
            .catch((error) => {
                console.error("SignalR Connection failed:", error);
            });

        // Store the connection instance in state
        setConnection(newConnection);

        // Cleanup
        return () => {
            // Remove listeners
            newConnection.off("ReceiveGroupMessage");
            // newConnection.off("GroupMessageDeleted");
            // Stop the connection
            newConnection.stop();
        };
    }, [groupId, token]);

    /**
     * 3) Infinite scrolling: if user scrolls to top, fetch older messages
     */
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (container.scrollTop === 0 && !isLoadingMore && !allMessagesLoaded) {
                void fetchMoreMessages();
            }
        };
        container.addEventListener("scroll", handleScroll);
        return () => {
            container.removeEventListener("scroll", handleScroll);
        };
    }, [isLoadingMore, allMessagesLoaded]);

    /**
     * 4) Auto-scroll to bottom on first load if you want
     */
    useEffect(() => {
        if (firstLoad && messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, firstLoad]);

    /** ---- API CALLS ---- **/

    const fetchGroupDetails = async () => {
        try {
            const response = await axios.get(`/Groups/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setGroupInfo(response.data);
        } catch (error) {
            console.error("Error fetching group details:", error);
        }
    };

    const fetchInitialMessages = async () => {
        try {
            const response = await axios.get(`/GroupMessages/GetGroupChatHistory`, {
                params: { groupId, pageSize: 30 },
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = response.data;
            setMessages(data.messages);
            setNextTokenValue(data.nextToken);

            if (data.messages.length < 30) {
                setAllMessagesLoaded(true);
            }
        } catch (error) {
            console.error("Error fetching initial messages:", error);
        }
    };

    const fetchMoreMessages = async () => {
        setFirstLoad(false);
        if (!groupId || isLoadingMore || allMessagesLoaded) return;
        setIsLoadingMore(true);

        const container = messagesContainerRef.current;
        const scrollHeightBefore = container?.scrollHeight || 0;

        try {
            const params: Record<string, any> = { groupId, pageSize: 32 };
            if (nextTokenValue) {
                params.nextToken = nextTokenValue;
            }

            const response = await axios.get(`/GroupMessages/GetGroupChatHistory`, {
                params,
                headers: { Authorization: `Bearer ${token}` },
            });

            const { messages: newMessages, nextToken: newNextToken } = response.data;
            if (newMessages.length === 0) {
                setAllMessagesLoaded(true);
            } else {
                setMessages((prev : Message[]) => {
                    const existingIds = new Set(prev.map((m : Message) => m.id));
                    const filtered = newMessages.filter((m : Message) => !existingIds.has(m.id));
                    return [...filtered, ...prev];
                });
                setNextTokenValue(newNextToken);
            }
        } catch (error) {
            console.error("Error fetching more messages:", error);
        } finally {
            setIsLoadingMore(false);
        }

        // Preserve scroll position
        requestAnimationFrame(() => {
            if (container) {
                const scrollHeightAfter = container.scrollHeight;
                const scrollDifference = scrollHeightAfter - scrollHeightBefore;
                container.scrollTop = scrollDifference;
            }
        });
    };

    /** ---- TIMESTAMP UTILITY (similar to Messages.tsx) ---- **/
    const shouldShowTimestamp = (currentIndex: number): boolean => {
        if (currentIndex === messages.length - 1) return true;
        const currentMessage = messages[currentIndex];
        const nextMessage = messages[currentIndex + 1];

        // If different sender or >=2hr gap => show timestamp
        if (
            currentMessage.senderId !== nextMessage.senderId ||
            Math.abs(new Date(nextMessage.timestamp).getTime() - new Date(currentMessage.timestamp).getTime()) >= 2 * 60 * 60 * 1000
        ) {
            return true;
        }
        return false;
    };

    /** ---- MENU & INFO PANEL ---- **/
    const toggleMenu = () => setShowMenu(!showMenu);
    const handleToggleGroupInfoVisibility = () => {
        setShowGroupInfo((prev) => !prev);
        setShowMenu(false);
    };

    const handleEditGroup = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setShowEditGroupModal(true);
        setShowMenu(false);
    };

    const handleLeaveGroup = async (groupIdToLeave: number) => {
        try {
            await axios.post(
                "/Groups/LeaveGroup",
                { groupId: groupIdToLeave },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(`Successfully left group ${groupIdToLeave}`);
            // Possibly navigate away from the group
            // navigate("/dashboard/groups");
            setShowMenu(false);
        } catch (error) {
            console.error("Error leaving group:", error);
        }
    };

    /** ---- REPORTING ---- **/
    const handleReportUser = () => {
        setShowReportPopup(true);
        setShowMenu(false);
    };

    const handleSendReport = async () => {
        if (!reportDescription.trim()) return;
        try {
            const formData = new FormData();
            formData.append('ReportedUserId', userId || '');
            formData.append('Description', reportDescription);
            reportFiles.forEach((file) => formData.append('Screenshots', file));

            await axios.post('/Report/SendReport', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            setSnackbarTitle('Report Sent');
            setSnackbarMessage(`You have sent a report regarding: ${groupInfo?.groupName}`);
            setSnackbarVisible(true);

            setReportDescription('');
            setReportFiles([]);
            setShowReportPopup(false);
        } catch (error) {
            console.error('Error sending report: ', error);
            alert('Failed to send report. Please try again later.');
        }
    };

    const handleCloseReportPopup = () => {
        setShowReportPopup(false);
        setReportDescription('');
        setReportFiles([]);
    };

    /** ---- ADD MEMBERS ---- **/
    const handleOpenAddMembersModal = () => setShowAddMembersModal(true);
    const handleCloseAddMembersModal = () => setShowAddMembersModal(false);

    /** ---- VIEW PROFILE ---- **/
    const handleUserSelect = (clickedUserId: string) => setSelectedUserId(clickedUserId);
    const handleCloseProfile = () => setSelectedUserId(null);

    /**
     * ---- MESSAGE DELETION (Desktop + Mobile) ----
     * (Mirrors the approach in Messages.tsx)
     */
    const LONG_PRESS_DELAY = 600; // ms

    // Desktop: Right-click => show delete
    const handleMessageContextMenu = (e: MouseEvent<HTMLDivElement>, messageId: number) => {
        // If we're in mobile mode that uses long-press, skip
        if (isMobileDeleteMessage) return;
        e.preventDefault();

        setSelectedMessageForDelete((prev) => (prev === messageId ? null : messageId));
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
    };

    // Mobile: Press & hold => show delete
    const handleTouchStart = (messageId: number) => {
        if (!isMobileDeleteMessage) return;
        console.log(messageId)
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
        }
        longPressTimerRef.current = setTimeout(() => {
            setSelectedMessageForDelete(messageId);
        }, LONG_PRESS_DELAY);
    };

    const handleTouchEnd = () => {
        if (!isMobileDeleteMessage) return;
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    // Confirm deletion
    const openDeleteConfirmation = (messageId: number) => {
        console.log(messageId);
        setSelectedMessageForDelete(messageId);
        setIsDialogOpen(true);
    };
    const closeDialog = () => {
        setIsDialogOpen(false);
        setSelectedMessageForDelete(null);
    };

    const handleDeleteMessage = async (messageId: number | null) => {
        if (selectedMessageForDelete === null) return;
        closeDialog()
        try {
            // Example endpoint for group messages
            await axios.delete('/GroupMessages/DeleteMessage', {
                data: { messageId },
                headers: { Authorization: `Bearer ${token}` },
            });

            setMessages((prev) => prev.filter((m) => m.id !== messageId));
            setSelectedMessageForDelete(null);
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    // Hide the delete context menu if clicked outside
    useEffect(() => {
        const handleGlobalClick = (e: globalThis.MouseEvent) => {
            if (selectedMessageForDelete === null) return;
            const target = e.target as HTMLElement;
            // If clicked on the button itself, do nothing
            if (target.closest('.delete-message-btn-group')) return;
            setSelectedMessageForDelete(null);
        };
        document.addEventListener('click', handleGlobalClick);
        return () => {
            document.removeEventListener('click', handleGlobalClick);
        };
    }, [selectedMessageForDelete]);

    // Close top-right menu if user clicks outside
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (showMenu && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showMenu]);

    return (
        <div className="group-message-page">
            <div className="group-message-container">

                {/* HEADER */}
                <div className="contact-header" onClick={handleToggleGroupInfoVisibility}>
                    {isMobile && (
                        <FaArrowLeft
                            className="back-arrow"
                            onClick={() => navigate("/dashboard/groups")}
                        />
                    )}
                    <div className="contact-info">
                        <span className="contact-name">{groupInfo?.groupName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className="add-members-icon dark:text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddMembersModal();
                            }}
                        >
                            <FaUserPlus size={18} />
                        </button>

                        <div
                            className="messages-menu-icon"
                            onClick={(event) => {
                                event.stopPropagation();
                                toggleMenu();
                            }}
                        >
                            {showMenu && (
                                <div
                                    className="messages-dropdown-menu"
                                    ref={dropdownRef}
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    {isGroupCreator && (
                                        <button
                                            className="flex items-center gap-2 text-sm font-medium"
                                            onClick={handleEditGroup}
                                        >
                                            <FaPenSquare />
                                            <div>Edit Group</div>
                                        </button>
                                    )}
                                        <button
                                            className="flex gap-2 items-center font-medium text-black dark:text-white text-sm"
                                            onClick={handleReportUser}
                                        >
                                            <FaFlag />
                                            <div>Report Group</div>
                                        </button>
                                    <button
                                        className="flex items-center gap-2 text-sm font-medium"
                                        onClick={handleToggleGroupInfoVisibility}
                                    >
                                        <FaInfo />
                                        <div>{showGroupInfo ? "Hide Info" : "Show Info"}</div>
                                    </button>
                                    <button
                                        className="flex items-center gap-2 font-medium text-sm"
                                        onClick={() => handleLeaveGroup(groupId)}
                                    >
                                        <MdExitToApp />
                                        Leave Group
                                    </button>
                                </div>
                            )}
                            <FaEllipsisV />
                        </div>
                    </div>
                </div>

                {/* MESSAGE LIST */}
                <div className="group-message-list" ref={messagesContainerRef}>
                    {isMobile && showGroupInfo ? (
                        <GroupInfo groupId={groupId} />
                    ) : (
                        <>
                            {messages.map((message, index) => {
                                const previousMessage = messages[index - 1];
                                const showSenderInfo =
                                    !previousMessage || previousMessage.senderId !== message.senderId;
                                const isCurrentUser = message.senderId === userId;
                                const showTime = shouldShowTimestamp(index);

                                return (
                                    <div
                                        key={message.id}
                                        className={`group-message-item relative ${
                                            isCurrentUser ? "group-message-own" : ""
                                        }`}
                                        onContextMenu={
                                            // Only attach context menu if it's the user's own message
                                            isCurrentUser
                                                ? (e) => handleMessageContextMenu(e, message.id)
                                                : undefined
                                        }
                                        onTouchStart={() => handleTouchStart(message.id)}
                                        onTouchEnd={handleTouchEnd}
                                    >
                                        {/* If different user, show their info */}
                                        {showSenderInfo && !isCurrentUser && (
                                            <div
                                                className="cursor-pointer group-message-sender-info"
                                                onClick={() => handleUserSelect(message.senderId)}
                                            >
                                                <img
                                                    className="group-message-sender-avatar"
                                                    src={message.senderProfilePictureUrl ?? ""}
                                                    alt={message.senderFirstName}
                                                />
                                                <span className="group-message-sender-name">
                                                    {message.senderFirstName}
                                                </span>
                                            </div>
                                        )}

                                        <div
                                            className={
                                                isCurrentUser
                                                    ? "group-message-content-own"
                                                    : "group-message-content-other"
                                            }
                                        >
                                            {/* Confirmation dialog (only if this msg is selected) */}
                                            {isDialogOpen && (
                                                <ConfirmationDialog
                                                    message="Are you sure you want to delete this message?"
                                                    onConfirm={() => {
                                                        void handleDeleteMessage(selectedMessageForDelete);
                                                    }}
                                                    onCancel={closeDialog}
                                                />
                                            )}

                                            {/* Desktop right-click or mobile long-press delete button */}
                                            {selectedMessageForDelete === message.id && (
                                                isMobileDeleteMessage ? (
                                                        <button
                                                            className="delete-message-btn-group p-2 flex items-center gap-2"
                                                            style={{
                                                                position: 'absolute',
                                                                right: 0,
                                                                bottom: '-2rem',
                                                                zIndex: 2
                                                            }}
                                                            onClick={() => openDeleteConfirmation(message.id)}
                                                        >
                                                            <FaTrash size={17}/> Delete
                                                        </button>
                                                    ):(
                                                        contextMenuPosition && (
                                                            < button
                                                                className = "delete-message-btn-group p-2 flex items-center gap-2"
                                                                style={{
                                                                    left: contextMenuPosition.x - 174,
                                                                    top: contextMenuPosition.y - 10,
                                                                }}
                                                                onClick={() => openDeleteConfirmation(message.id)}
                                                            >
                                                                <FaTrash size={17} />
                                                                Delete Message
                                                            </button>
                                                        )
                                                    )
                                            )}

                                            <p>{message.content}</p>

                                            {/* Attachments */}
                                            {message.attachments?.map((attachment) => {
                                                const isImage = isImageFileName(attachment.fileName);
                                                if (isImage) {
                                                    return (
                                                        <div key={attachment.id} className="message-attachment">
                                                            <img
                                                                src={attachment.fileUrl}
                                                                alt={attachment.fileName}
                                                                className="message-image"
                                                            />
                                                        </div>
                                                    );
                                                } else {
                                                    const ext = getFileExtension(attachment.fileName);
                                                    return (
                                                        <div key={attachment.id} className="message-attachment">
                                                            <a
                                                                href={attachment.fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                download
                                                                className="attachment-link"
                                                            >
                                                                <div className="attachment-preview">
                                                                    {getFileIcon(ext)}
                                                                    <span className="attachment-filename">
                                                                        {attachment.fileName.length > 15
                                                                            ? attachment.fileName.substring(0, 15) + "..."
                                                                            : attachment.fileName}
                                                                    </span>
                                                                </div>
                                                            </a>
                                                        </div>
                                                    );
                                                }
                                            })}
                                        </div>

                                        {showTime && (
                                            <div className="group-message-timestamp">
                                                {new Date(message.timestamp).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {isLoadingMore && (
                                <div className="loading-more-messages">
                                    {/* e.g. "Loading older messages..." */}
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* INPUT BOX (unless user is viewing group info on mobile) */}
                {(!isMobile || !showGroupInfo) && (
                    <GroupMessageInput groupId={groupId} showModal={showModal} />
                )}

                {/* Edit Group Modal */}
                {showEditGroupModal && groupInfo && (
                    <EditGroupModal
                        groupInfo={groupInfo}
                        onClose={() => setShowEditGroupModal(false)}
                        onGroupUpdated={() => void fetchGroupDetails()}
                    />
                )}
            </div>

            {/* Right-side group info panel on desktop */}
            {!isMobile && showGroupInfo && <GroupInfo groupId={groupId} />}

            {/* View a user's profile */}
            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile} />
            )}

            {/* Add members modal */}
            <AddMembersModal
                show={showAddMembersModal}
                onClose={handleCloseAddMembersModal}
                groupId={groupId}
                groupName={groupInfo?.groupName}
                groupPurpose={groupInfo?.groupPurpose}
            />

            {/* Report group popup modal */}
            {showReportPopup && (
                <div className="report-popup-overlay" onClick={handleCloseReportPopup}>
                    <div className="report-popup-content bg-white border-2 border-gray-300 text-gray-600 dark:text-white" onClick={(e) => e.stopPropagation()}>
                            <h2 className="report-popup-title">Report Group</h2>
                            <p className="text-xs">{reportDescription.length} / 100</p>
                        <textarea
                            className="report-textarea text-black resize-none border-2 border-gray-300"
                            rows={4}
                            maxLength={100}
                            value={reportDescription}
                            onChange={(e) => setReportDescription(e.target.value)}
                            placeholder="Describe the issue..."
                        />
                        <label className="screenshot-label">
                            Attach Screenshots (optional)
                            <input
                                className="report-file-input"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setReportFiles(Array.from(e.target.files));
                                    }
                                }}
                            />
                        </label>
                        <div className="report-btn-group">
                            <button
                                className="text-sm font-medium dark:text-gray-200 rounded-lg"
                                onClick={handleCloseReportPopup}
                            >
                                Cancel
                            </button>
                            <button
                                className={`bg-emerald-400 text-white font-medium px-3 rounded-lg py-2 ${
                                    !reportDescription.trim() ? 'disabled-btn' : ''
                                }`}
                                onClick={handleSendReport}
                                disabled={!reportDescription.trim()}
                            >
                                Send Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Snackbar for notifications */}
            {snackbarVisible && !isSmallScreen && (
                <Snackbar
                    key={snackbarTitle + snackbarMessage}
                    title={snackbarTitle}
                    message={snackbarMessage}
                    duration={4000}
                    onClose={() => setSnackbarVisible(false)}
                />
            )}
        </div>
    );
};

export default GroupMessage;
