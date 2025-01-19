import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './GroupMessage.css';
import { useNavigate } from 'react-router-dom';
import {
    FaEllipsisV, FaArrowLeft, FaPenSquare, FaInfo, FaUserPlus,
    FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFlag
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

interface GroupInfo {
    adminName: string;
    groupName: string;
    creatorId: string;
    groupId: number;
    groupDescription: string;
    groupMembersDesired: string;
    isPublic: boolean;
    groupPurpose: string;
}

// Helpers to identify images / get file icon
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
    // Main state for messages (in chronological order)
    const [messages, setMessages] = useState<Message[]>([]);

    // Group info details (fetched once per groupId)
    const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
    const isGroupCreator = groupInfo?.creatorId === localStorage.getItem("userId");

    // For mobile vs desktop layout
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1300);

    // UI toggles
    const [showMenu, setShowMenu] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [showEditGroupModal, setShowEditGroupModal] = useState(false);
    const [showReportPopup, setShowReportPopup] = useState(false);
    const [reportDescription, setReportDescription] = useState('');
    const [reportFiles, setReportFiles] = useState<File[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [showAddMembersModal, setShowAddMembersModal] = useState(false);

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

    // SignalR connection
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const [isConnectionStarted, setIsConnectionStarted] = useState(false);
    const previousGroupIdRef = useRef<number | undefined>(undefined);

    // Refs for the messages container & “end” anchor
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Basic user info
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    /** Handle resize to set isMobile */
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1300);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    /**
     * 1) Whenever groupId changes, reset states & fetch initial data
     */
    useEffect(() => {
        if (!groupId) return;
        setAllMessagesLoaded(false);
        setMessages([]);
        setNextTokenValue(null);
        setFirstLoad(true);

        fetchGroupDetails();
        fetchInitialMessages();
    }, [groupId]);

    /**
     * 2) Build SignalR connection once
     */
    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("https://api.anthra.dk/chatHub", {
                accessTokenFactory: () => token || "",
            })
            .withAutomaticReconnect()
            .build();

        connectionRef.current = connection;
        connection
            .start()
            .then(() => {
                setIsConnectionStarted(true);
            })
            .catch((error) => console.error("SignalR Connection failed:", error));

        return () => {
            connectionRef.current?.stop();
        };
    }, [token]);

    /**
     * 3) Once the SignalR connection is started, join the current group
     */
    useEffect(() => {
        if (isConnectionStarted && connectionRef.current) {
            const connection = connectionRef.current;

            // If we were in a previous group, leave it
            if (previousGroupIdRef.current && previousGroupIdRef.current !== groupId) {
                connection.invoke("LeaveGroup", `Group_${previousGroupIdRef.current}`);
            }

            // Join the new group
            if (groupId) {
                connection.invoke("JoinGroup", `Group_${groupId}`);
                previousGroupIdRef.current = groupId;
            }

            // Remove any existing handlers to avoid duplication
            connection.off("ReceiveGroupMessage");

            // Listen for new messages from the hub
            connection.on("ReceiveGroupMessage", (message: Message) => {
                // Only add if it belongs to the current group
                if (message.groupId === groupId) {
                    setMessages(prev => [...prev, message]);
                }
            });

            return () => {
                connection.off("ReceiveGroupMessage");
            };
        }
    }, [groupId, isConnectionStarted]);

    /**
     * 4) Infinite scrolling: if user scrolls to top, fetch older messages
     */
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (container.scrollTop === 0 && !isLoadingMore && !allMessagesLoaded) {
                console.log("fetching more")
                fetchMoreMessages();
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => {
            container.removeEventListener("scroll", handleScroll);
        };
    }, [isLoadingMore, allMessagesLoaded]);

    /**
     * 5) Auto-scroll to the bottom on first load
     */
    useEffect(() => {
        if (firstLoad && messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, firstLoad]);

    // ------------------ API CALLS ------------------

    /** Fetch group info */
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

    /** Initial fetch of the newest chunk (pageSize=30) */
    const fetchInitialMessages = async () => {
        try {
            const response = await axios.get(`/GroupMessages/GetGroupChatHistory`, {
                params: {
                    groupId,
                    pageSize: 20
                },
                headers: { Authorization: `Bearer ${token}` },
            });

            // The endpoint returns { messages, nextToken }
            const data = response.data;
            setMessages(data.messages);
            setNextTokenValue(data.nextToken);

            if (data.messages.length < 20) {
                setAllMessagesLoaded(true);
            }
        } catch (error) {
            console.error("Error fetching initial messages:", error);
        }
    };

    const fetchMoreMessages = async () => {
        if (!groupId || isLoadingMore || allMessagesLoaded) return;
        console.log("fetching more");
        setFirstLoad(false);
        setIsLoadingMore(true);

        const container = messagesContainerRef.current;
        if (!container) return;

        // Capture scroll positions before fetching
        const scrollHeightBefore = container.scrollHeight;
        const scrollTopBefore = container.scrollTop;

        try {
            const params: Record<string, any> = {
                groupId,
                pageSize: 30,
            };
            if (nextTokenValue) {
                params.nextToken = nextTokenValue;
            }

            const response = await axios.get(`/GroupMessages/GetGroupChatHistory`, {
                params,
                headers: { Authorization: `Bearer ${token}` },
            });

            const { messages: newMessages, nextToken: newNextToken } = response.data;
            console.log('newMessages IDs:', newMessages.map((msg: { id: any; }) => msg.id));

            if (newMessages.length === 0) {
                setAllMessagesLoaded(true);
            } else {
                setMessages((prev: Message[]) => {
                    const existingIds = new Set(prev.map((m: Message) => m.id));
                    const filtered = newMessages.filter((m: Message) => !existingIds.has(m.id));
                    return [...filtered, ...prev];
                });
                setNextTokenValue(newNextToken);
            }
        } catch (error) {
            console.error("Error fetching more messages:", error);
        } finally {

            setIsLoadingMore(false);
        }

        // Use requestAnimationFrame to ensure the DOM updates are done
        requestAnimationFrame(() => {
            if (!container) return;

            const scrollHeightAfter = container.scrollHeight;
            // Calculate how much the container grew after adding older messages
            const scrollDifference = scrollHeightAfter - scrollHeightBefore;

            // Keep the user visually at the same place they were before loading
            container.scrollTop = scrollTopBefore + scrollDifference;
        });
    };


    // ------------------ UI UTILITIES ------------------

    /** Show a timestamp if it's the last message, or user/time changed significantly */
    const shouldShowTimestamp = (currentIndex: number): boolean => {
        if (currentIndex === messages.length - 1) return true;
        const currentMessage = messages[currentIndex];
        const nextMessage = messages[currentIndex + 1];

        // if next message is by a different user, or if time gap >= 2 hours
        if (
            currentMessage.senderId !== nextMessage.senderId ||
            Math.abs(
                new Date(nextMessage.timestamp).getTime() - new Date(currentMessage.timestamp).getTime()
            ) >= 2 * 60 * 60 * 1000
        ) {
            return true;
        }
        return false;
    };

    /** Toggle the top-right menu */
    const toggleMenu = () => setShowMenu(!showMenu);

    /** Show/hide group info side panel */
    const handleToggleGroupInfoVisibility = () => {
        setShowGroupInfo((prev) => !prev);
        setShowMenu(false);
    };

    /** Open the Edit Group modal (creator-only) */
    const handleEditGroup = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setShowEditGroupModal(true);
        setShowMenu(false);
    };

    /** Leave the group and possibly navigate away */
    const handleLeaveGroup = async (groupIdToLeave: number) => {
        try {
            await axios.post(
                "/Groups/LeaveGroup",
                { groupId: groupIdToLeave },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(`Successfully left group ${groupIdToLeave}`);
            setShowMenu(false);
            // Possibly navigate away or refresh the groups list
            // Example: navigate("/dashboard/groups");
        } catch (error) {
            console.error("Error leaving group:", error);
        }
    };

    // ------------------ REPORTING ------------------
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

    // ------------------ ADD/VIEW MEMBERS ------------------
    const handleOpenAddMembersModal = () => {
        setShowAddMembersModal(true);
    };
    const handleCloseAddMembersModal = () => {
        setShowAddMembersModal(false);
    };

    // ------------------ VIEW PROFILE ------------------
    const handleUserSelect = (clickedUserId: string) => {
        setSelectedUserId(clickedUserId);
    };
    const handleCloseProfile = () => {
        setSelectedUserId(null);
    };

    // ------------------ MENU OUTSIDE CLICK ------------------
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                showMenu &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showMenu]);

    // --------------------------------------------------------

    return (
        <div className="group-message-page">
            <div className="group-message-container">
                {/* Header with group name, menu, etc. */}
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
                        {isGroupCreator && (
                            <button
                                className="add-members-icon dark:text-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAddMembersModal();
                                }}
                            >
                                <FaUserPlus size={18} />
                            </button>
                        )}
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
                                            <FaPenSquare/>
                                            <div>Edit Group</div>
                                        </button>
                                    )}
                                    {isGroupCreator && (
                                        <button
                                            className="flex gap-2 items-center font-medium text-black dark:text-white text-sm"
                                            onClick={handleReportUser}
                                        >
                                            <FaFlag/>
                                            <div>Report Group</div>
                                        </button>
                                    )}
                                    <button
                                        className="flex items-center gap-2 text-sm font-medium"
                                        onClick={handleToggleGroupInfoVisibility}
                                    >
                                        <FaInfo/>
                                        <div>{showGroupInfo ? "Hide Info" : "Show Info"}</div>
                                    </button>
                                    <button
                                        className="flex items-center gap-2 font-medium text-sm"
                                        onClick={() => handleLeaveGroup(groupId)}
                                    >
                                        <MdExitToApp/>
                                        Leave Group
                                    </button>
                                </div>
                            )}
                            <FaEllipsisV />
                        </div>
                    </div>
                </div>

                {/* The scrollable messages container */}
                <div className="group-message-list" ref={messagesContainerRef}>
                    {isMobile && showGroupInfo ? (
                        /* If on mobile and user toggled group info, show it full-screen */
                        <GroupInfo groupId={groupId} />
                    ) : (
                        <>
                            {messages.map((message, index) => {
                                // If previous message is from a different sender, we show the sender info
                                const previousMessage = messages[index - 1];
                                const showSenderInfo =
                                    !previousMessage || previousMessage.senderId !== message.senderId;
                                const isCurrentUser = message.senderId === userId;
                                const showTime = shouldShowTimestamp(index);

                                return (
                                    <div
                                        key={message.id}
                                        className={`group-message-item ${isCurrentUser ? "group-message-own" : ""}`}
                                    >
                                        {/* Show sender's name/pic if it's a different user than previous message */}
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
                                            <p>{message.content}</p>

                                            {/* Display attachments if any */}
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

                            {/* Show a 'loading' indicator if we are fetching more */}
                            {isLoadingMore && (
                                <div className="loading-more-messages">
                                    {/* e.g. a spinner or 'Loading older messages...' */}
                                </div>
                            )}

                            {/* Anchor to scroll to the latest message */}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* The input box, if not hidden by mobile groupInfo toggle */}
                {(!isMobile || !showGroupInfo) && (
                    <GroupMessageInput groupId={groupId} showModal={showModal} />
                )}

                {/* Edit Group Modal */}
                {showEditGroupModal && groupInfo && (
                    <EditGroupModal
                        groupInfo={groupInfo}
                        onClose={() => setShowEditGroupModal(false)}
                        onGroupUpdated={fetchGroupDetails}
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
                    <div className="report-popup-content" onClick={(e) => e.stopPropagation()}>
                        <h2 className="report-popup-title">Report Group</h2>
                        <textarea
                            className="report-textarea"
                            rows={4}
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
                                className="report-cancel-btn rounded-lg"
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
