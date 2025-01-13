import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './GroupMessage.css';
import { useNavigate } from 'react-router-dom';
import {
    FaEllipsisV, FaArrowLeft, FaPenSquare, FaInfo, FaUserPlus,
    FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel
} from 'react-icons/fa';
import * as signalR from '@microsoft/signalr';
import GroupInfo from '../GroupInfo/GroupInfo';
import GroupMessageInput from "./GroupMessageInput";
import EditGroupModal from "../EditGroupModal/EditGroupModal";
import { MdExitToApp } from "react-icons/md";
import ViewProfile from "../../ViewProfile/ViewProfile";
import AddMembersModal from "../AddMembersModal/AddMembersModal";

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
    senderProfilePictureUrl: string;
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

// HELPERS to decide if an attachment is an image and/or to get a file icon
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
    const [messages, setMessages] = useState<Message[]>([]);
    const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const previousGroupIdRef = useRef<number | undefined>(undefined);

    const [showMenu, setShowMenu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1300);
    const navigate = useNavigate();
    const [isConnectionStarted, setIsConnectionStarted] = useState(false);
    const [showEditGroupModal, setShowEditGroupModal] = useState(false);

    // If the current user is the group creator
    const isGroupCreator = groupInfo?.creatorId === userId;

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [showAddMembersModal, setShowAddMembersModal] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1300);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch group details + messages
    useEffect(() => {
        fetchGroupDetails();
        fetchMessages();
    }, [groupId]);

    // SignalR Connection Setup
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
            .catch((error) => console.error("Connection failed: ", error));

        return () => {
            if (connectionRef.current) {
                connectionRef.current.stop();
            }
        };
    }, []);

    useEffect(() => {
        if (isConnectionStarted && connectionRef.current) {
            const connection = connectionRef.current;

            // Leave the previous group if necessary
            if (previousGroupIdRef.current && previousGroupIdRef.current !== groupId) {
                connection.invoke("LeaveGroup", `Group_${previousGroupIdRef.current}`);
            }

            // Join the new group
            if (groupId) {
                connection.invoke("JoinGroup", `Group_${groupId}`);
                previousGroupIdRef.current = groupId;
            } else {
                console.error("Group ID is undefined");
            }

            // Remove previous event handler to prevent stacking
            connection.off("ReceiveGroupMessage");

            // Set up a new event handler for the new group
            connection.on("ReceiveGroupMessage", (message: Message) => {
                if (message.groupId === groupId) {
                    setMessages((prevMessages) => [...prevMessages, message]);
                }
            });

            // Clean up when the component unmounts or when groupId changes
            return () => {
                connection.off("ReceiveGroupMessage");
            };
        }
    }, [groupId, isConnectionStarted]);

    // Dropdown menu outside click
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

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

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

    const fetchMessages = async () => {
        try {
            const response = await axios.get(
                "/GroupMessages/GetGroupChatHistory",
                {
                    params: { groupId },
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setMessages(response.data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const shouldShowTimestamp = (currentIndex: number): boolean => {
        if (currentIndex === messages.length - 1) {
            return true;
        }
        const currentMessage = messages[currentIndex];
        const nextMessage = messages[currentIndex + 1];

        const currentSender = currentMessage.senderId;
        const nextSender = nextMessage.senderId;

        const currentTime = new Date(currentMessage.timestamp);
        const nextTime = new Date(nextMessage.timestamp);

        const timeDiffHours = Math.abs(nextTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

        if (currentSender !== nextSender || timeDiffHours >= 2) {
            return true;
        }
        return false;
    };

    // Menu toggles
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

    const handleLeaveGroup = async (groupId: number) => {
        try {
            await axios.post(
                "/Groups/LeaveGroup",
                { groupId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log(`Successfully left group ${groupId}`);
            setShowMenu(false);
            // Possibly navigate away or refresh groups
        } catch (error) {
            console.error("Error leaving group:", error);
        }
    };

    // View user profile
    const handleUserSelect = (userId: string) => {
        setSelectedUserId(userId);
    };
    const handleCloseProfile = () => {
        setSelectedUserId(null);
    };

    // Add members
    const handleOpenAddMembersModal = () => {
        setShowAddMembersModal(true);
    };
    const handleCloseAddMembersModal = () => {
        setShowAddMembersModal(false);
    };

    return (
        <div className="group-message-page">
            <div className="group-message-container">
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
                                            <FaPenSquare />
                                            <div>Edit Group</div>
                                        </button>
                                    )}
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

                <div className="group-message-list">
                    {isMobile && showGroupInfo ? (
                        <GroupInfo groupId={groupId} />
                    ) : (
                        <>
                            {messages.map((message, index) => {
                                const previousMessage = messages[index - 1];
                                const showSenderInfo =
                                    !previousMessage || previousMessage.senderId !== message.senderId;
                                const isCurrentUser = message.senderId === userId;
                                const isLastMessage = shouldShowTimestamp(index);

                                return (
                                    <div
                                        key={message.id}
                                        className={`group-message-item ${
                                            isCurrentUser ? "group-message-own" : ""
                                        }`}
                                    >
                                        {showSenderInfo && !isCurrentUser && (
                                            <div
                                                className="cursor-pointer group-message-sender-info"
                                                onClick={() => handleUserSelect(message.senderId)}
                                            >
                                                <img
                                                    className="group-message-sender-avatar"
                                                    src={`${message.senderProfilePictureUrl}`}
                                                    alt={message.senderFirstName}
                                                />
                                                <span className="group-message-sender-name">
                          {message.senderFirstName}
                        </span>
                                            </div>
                                        )}
                                        <div
                                            className={`${
                                                isCurrentUser
                                                    ? "group-message-content-own"
                                                    : "group-message-content-other"
                                            } ${isLastMessage ? "last-message" : ""}`}
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
                                                    // Show an icon + filename, with a clickable link
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
                                        {isLastMessage && (
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
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {(!isMobile || !showGroupInfo) && (
                    <>
                        <GroupMessageInput groupId={groupId} showModal={showModal} />
                    </>
                )}
                {showEditGroupModal && groupInfo && (
                    <EditGroupModal
                        groupInfo={groupInfo}
                        onClose={() => setShowEditGroupModal(false)}
                        onGroupUpdated={fetchGroupDetails}
                    />
                )}
            </div>

            {!isMobile && showGroupInfo && <GroupInfo groupId={groupId} />}
            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile} />
            )}
            <AddMembersModal
                show={showAddMembersModal}
                onClose={handleCloseAddMembersModal}
                groupId={groupId}
                groupName={groupInfo?.groupName}
                groupPurpose={groupInfo?.groupPurpose}
            />
        </div>
    );
};

export default GroupMessage;
