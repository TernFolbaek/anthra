import React, {
    useContext,
    useEffect,
    useRef,
    useState,
    MouseEvent,
} from 'react';
import './Messages.css';
import * as signalR from '@microsoft/signalr';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import MessageConnectionProfile from './MessageConnectionProfile/MessageConnectionProfile';
import {
    FaEllipsisV, FaArrowLeft, FaUserMinus, FaInfo,
    FaFilePdf, FaFileWord, FaFileExcel, FaFileAlt, FaFlag, FaTrash
} from 'react-icons/fa';
import MessageInput from "./MessageInput";
import ViewGroupProfile from "../ViewGroupProfile/ViewGroupProfile";
import GroupInvitationMessage from "./GroupInvitationMessage";
import ReferralCardMessage from "./ReferralCardMessage";
import { Message, InvitationActionType, UserProfile } from '../types/types';
import { NotificationContext } from "../../context/NotificationsContext";
import ConfirmationDialog from "../../Helpers/Dialogs/ConfirmationDialog/ConfirmationDialog";
import ReportUserComponent from "../ReportUser/ReportUser";
import {Conversation} from "../../Layouts/MessagesLayout/MessagesLayout";

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

/**
 * Format a date according to these rules:
 * - Today HH:MM
 * - Yesterday HH:MM
 * - <Weekday> HH:MM if within the last 3 days
 * - DD/MM HH:MM if older than 3 days
 */
function getFormattedTimestamp(date: Date): string {
    const now = new Date();
    // Start of today's date (00:00)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateTime = date.getTime();
    const todayTime = startOfToday.getTime();

    const ONE_DAY = 24 * 60 * 60 * 1000;

    // If it's today
    if (dateTime >= todayTime) {
        return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // If it's yesterday
    else if (dateTime >= (todayTime - ONE_DAY)) {
        return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // Within the last 3 days
    else if (dateTime >= (todayTime - 3 * ONE_DAY)) {
        const weekday = date.toLocaleDateString([], { weekday: 'long' });
        return weekday + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // More than 3 days ago
    else {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month} ` + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

/**
 * Decide whether to show timestamp for the current message.
 * We show if:
 * - it's the last message in the list, OR
 * - the sender changes compared to the next message, OR
 * - at least 20 minutes have passed between consecutive messages from the same sender
 */
function shouldShowTimestamp(messages: Message[], currentIndex: number): boolean {
    if (currentIndex === messages.length - 1) {
        return true;
    }

    const currentMessage = messages[currentIndex];
    const nextMessage = messages[currentIndex + 1];

    // If different sender => show
    if (currentMessage.senderId !== nextMessage.senderId) {
        return true;
    }

    // If time difference >= 20 minutes => show
    const currentTime = new Date(currentMessage.timestamp).getTime();
    const nextTime = new Date(nextMessage.timestamp).getTime();
    const diffMins = Math.abs(nextTime - currentTime) / (1000 * 60);

    return diffMins >= 20;
}

const Messages: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
    const [showReportPopup, setShowReportPopup] = useState(false);

    const currentUserId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    const [messages, setMessages] = useState<Message[]>([]);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const [contactProfile, setContactProfile] = useState<UserProfile | null>(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [removeConnectionDialog, setRemoveConnectionDialog] = useState(false);


    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1300);
    const [isMobileDeleteMessage, setIsMobileDeleteMessage] = useState(window.innerWidth <= 500);
    const [showBackArrow, setShowBackArrow] = useState(window.innerWidth <= 900);

    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [groupInfoCache, setGroupInfoCache] = useState<{ [key: number]: any }>({});

    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
    const [nextTokenValue, setNextTokenValue] = useState<string | null>(null);
    const [firstLoad, setFirstLoad] = useState(true);

    const notificationContext = useContext(NotificationContext);
    if (!notificationContext) {
        throw new Error("NotificationContext is undefined. Make sure you're inside a NotificationProvider.");
    }
    const { removeNotificationsBySenderId, removeMessageNotification } = notificationContext;

    const {
        removeConversation,
        conversations,
    } = useOutletContext<{
        removeConversation: (removedUserId: string) => void;
        conversations: Conversation[];
    }>();

    // Which message is selected for deletion
    const [selectedMessageForDelete, setSelectedMessageForDelete] = useState<number | null>(null);

    // For mobile long-press
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const LONG_PRESS_DELAY = 600; // ms (adjust to taste)

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1300);
            setShowBackArrow(window.innerWidth <= 900);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!userId) {
            axios
                .get('/Messages/GetConversations', {
                    params: { userId: currentUserId },
                })
                .then((response) => {
                    const data = response.data;
                    if (data.length > 0) {
                        navigate(`/dashboard/messages/${data[0].userId}`);
                    } else {
                        setMessages([]);
                        console.warn('No conversations found.');
                    }
                })
                .catch((error) => {
                    console.error('Error fetching conversations:', error.response?.data || error.message);
                })
                .finally(() => {
                    setIsLoading(false);
                });
            return;
        }

        const fetchInitialMessages = async () => {
            if (!currentUserId || !userId) return;
            try {
                const response = await axios.get(
                    '/Messages/GetChatHistory',
                    {
                        params: {
                            userId: currentUserId,
                            contactId: userId,
                            pageSize: 30,
                        },
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                removeMessageNotification(userId);
                const data = response.data;
                setMessages(data.messages);
                setNextTokenValue(data.nextToken);

                if (data.messages.length < 30) {
                    setAllMessagesLoaded(true);
                }
            } catch (error: any) {
                console.error('Error fetching messages:', error.response?.data || error.message);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchContactProfile = async () => {
            try {
                const response = await axios.get(
                    '/Profile/GetProfileById',
                    {
                        params: { userId },
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setContactProfile(response.data);
            } catch (error: any) {
                console.error('Error fetching contact profile:', error.response?.data || error.message);
            }
        };

        setAllMessagesLoaded(false);
        fetchInitialMessages();
        fetchContactProfile();
    }, [currentUserId, userId, token, navigate, isMobile]);

    /**
     * SignalR setup
     */
    useEffect(() => {
        let isMounted = true;

        if (userId && token) {
            if (connection) {
                connection.stop();
            }

            const newConnection = new signalR.HubConnectionBuilder()
                .withUrl('https://api.anthra.dk/chatHub', {
                    accessTokenFactory: () => token || '',
                })
                .withAutomaticReconnect()
                .build();

            newConnection
                .start()
                .then(() => {
                    newConnection.invoke('JoinGroup', getChatGroupId(currentUserId!, userId));
                    const handleReceiveMessage = (incomingMessage: Message) => {
                        if (isMounted) {
                            setMessages((prev) => {
                                // Avoid duplicates if the same message is received multiple times
                                if (prev.some((msg) => msg.id === incomingMessage.id)) {
                                    return prev;
                                }
                                return [...prev, incomingMessage];
                            });
                        }
                    };
                    newConnection.on('ReceiveMessage', handleReceiveMessage);
                })
                .catch((error) => console.error('Connection failed: ', error));

            setConnection(newConnection);

            return () => {
                isMounted = false;
                newConnection.off('ReceiveMessage');
                newConnection.stop();
            };
        }

        return () => {
            if (connection) {
                connection.off('ReceiveMessage');
                connection.stop();
            }
        };
    }, [userId, token, currentUserId]);

    /**
     * Close top-right menu if user clicks outside
     */
    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (showMenu && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    /**
     * Listen for updated messages or new messages from SignalR
     */
    useEffect(() => {
        if (connection) {
            connection.on('UpdateMessage', (updatedMessage: Message) => {
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.id === updatedMessage.id
                            ? {
                                ...msg,
                                invitationStatus: updatedMessage.invitationStatus,
                                actionType: updatedMessage.actionType
                            }
                            : msg
                    )
                );
            });

            connection.on('ReceiveMessage', (incomingMessage: Message) => {
                setMessages(prev => [...prev, incomingMessage]);
            });

            connection.on('MessageDeleted', (data) => {
                setMessages(prevMessages => prevMessages.filter((m) => m.id !== data.messageId));
            });
        }
        return () => {
            if (connection) {
                connection.off('UpdateMessage');
                connection.off('ReceiveMessage');
                connection.off('MessageDeleted');
            }
        };
    }, [connection]);

    /**
     * Infinite scroll to load more messages
     */
    const fetchMoreMessages = async () => {
        setFirstLoad(false);
        if (!currentUserId || !userId) return;
        if (isLoadingMore || allMessagesLoaded) return;

        setIsLoadingMore(true);
        const container = messagesContainerRef.current;
        const scrollHeightBefore = container?.scrollHeight || 0;

        try {
            const params: Record<string, string> = {
                userId: currentUserId,
                contactId: userId,
                pageSize: '20'
            };
            if (nextTokenValue) params.nextToken = nextTokenValue;

            const response = await axios.get<{ messages: Message[]; nextToken: string | null }>(
                '/Messages/GetChatHistory',
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                }
            );

            const { messages: newMessages, nextToken: newNextToken } = response.data;

            if (newMessages.length === 0) {
                setAllMessagesLoaded(true);
            } else {
                setMessages(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const filtered = newMessages.filter(m => !existingIds.has(m.id));
                    return [...filtered, ...prev];
                });
                setNextTokenValue(newNextToken);
            }
        } catch (error) {
            console.error('Error fetching more messages:', error);
        }

        setIsLoadingMore(false);

        // Adjust scroll to preserve position
        setTimeout(() => {
            if (container) {
                const scrollHeightAfter = container.scrollHeight;
                const scrollDifference = scrollHeightAfter - scrollHeightBefore;
                container.scrollTop = scrollDifference;
            }
        }, 0);
    };

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (container.scrollTop === 0 && !isLoadingMore && !allMessagesLoaded) {
                fetchMoreMessages();
            }
        };
        container.addEventListener('scroll', handleScroll);
        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [isLoadingMore, allMessagesLoaded, nextTokenValue]);

    /**
     * Auto-scroll to bottom on first load
     */
    const handleMessageRendered = () => {
        if (firstLoad) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        handleMessageRendered();
    }, [messages, handleMessageRendered]);

    /**
     * Group invitation acceptance/decline
     */
    const handleAcceptInvitation = async (groupId: number, messageId: number) => {
        try {
            const response = await axios.post(
                '/Groups/RespondToInvitation',
                { groupId, Accept: true },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const updatedMessage: Message = response.data;
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === updatedMessage.id
                        ? { ...msg, invitationStatus: updatedMessage.invitationStatus, actionType: updatedMessage.actionType }
                        : msg
                )
            );
        } catch (error) {
            console.error('Error accepting group invitation:', error);
        }
    };

    const handleDeclineInvitation = async (groupId: number, messageId: number) => {
        try {
            const response = await axios.post(
                '/Groups/RespondToInvitation',
                { groupId, Accept: false },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const updatedMessage: Message = response.data;
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === updatedMessage.id
                        ? { ...msg, invitationStatus: updatedMessage.invitationStatus, actionType: updatedMessage.actionType }
                        : msg
                )
            );
        } catch (error) {
            console.error('Error declining group invitation:', error);
        }
    };

    /**
     * Helper to determine chat group name
     */
    const getChatGroupId = (userA: string, userB: string) => {
        return userA < userB ? `${userA}-${userB}` : `${userB}-${userA}`;
    };

    /**
     * Toggle or hide top-right menu
     */
    const toggleMenu = () => setShowMenu(!showMenu);
    const handleToggleProfileVisibility = () => {
        setShowProfile(p => !p);
        setShowMenu(false);
    };

    /**
     * Remove connection
     */
    const handleRemoveConnection = async () => {
        setRemoveConnectionDialog(false);
        try {
            await axios.post(
                '/Connections/RemoveConnection',
                { userId: currentUserId, connectionId: userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (userId) {
                removeConversation(userId);
                removeNotificationsBySenderId(userId);
            }
            navigate('/dashboard/messages');
        } catch (error) {
            console.error('Error removing connection:', error);
        }
        setShowMenu(false);
    };

    /**
     * Report user
     */
    const handleReportUser = () => {
        setShowReportPopup(true);
        setShowMenu(false);
    };
    const setShowReportPopupFalse = () => {
        setShowReportPopup(false);
    };

    /**
     * View group profile if user clicks a group link
     */
    const handleUserClick = (groupId: number | null) => {
        setSelectedGroupId(groupId);
    };
    const handleCloseGroupProfile = () => {
        setSelectedGroupId(null);
    };

    /**
     * Referral
     */
    const handleReferralConnect = async (referredUserId: string) => {
        try {
            await axios.post(
                '/Connections/SendRequest',
                { targetUserId: referredUserId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error(error);
        }
    };
    const handleReferralSkip = (referredUserId: string) => {
        // handle skip if needed
    };

    /**
     * Desktop: right-click => show delete
     */
    const handleMessageContextMenu = (e: MouseEvent<HTMLDivElement>, messageId: number) => {
        if (isMobileDeleteMessage) return; // skip on mobile
        e.preventDefault();
        setSelectedMessageForDelete(prev => (prev === messageId ? null : messageId));
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
    };

    /**
     * Mobile: press & hold to show delete
     */
    const handleTouchStart = (msgId: number) => {
        if (!isMobileDeleteMessage) return;
        // Clear any prior timers
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
        }
        // Start a new timer
        longPressTimerRef.current = setTimeout(() => {
            setSelectedMessageForDelete(msgId);
        }, LONG_PRESS_DELAY);
    };

    const handleTouchEnd = () => {
        if (!isMobile) return;
        // If the user lifts their finger before the LONG_PRESS_DELAY,
        // clear the timer => no delete button
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const openDeleteConfirmation = (messageId: number) => {
        setSelectedMessageForDelete(messageId);
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setSelectedMessageForDelete(null);
    };

    /**
     * Delete message
     */
    const handleDeleteMessage = async (messageId: number | null) => {
        if (selectedMessageForDelete === null) return;
        closeDialog();

        try {
            await axios.delete('/Messages/DeleteMessage', {
                data: { messageId },
                headers: { Authorization: `Bearer ${token}` },
            });

            setMessages(prev => prev.filter(m => m.id !== messageId));
            setSelectedMessageForDelete(null);
        } catch (error) {
            console.error("Error deleting message: ", error);
        }
    };

    /**
     * Hide the delete button if user clicks anywhere outside it
     */
    useEffect(() => {
        const handleGlobalClick = (e: globalThis.MouseEvent) => {
            if (selectedMessageForDelete === null) return;
            const target = e.target as HTMLElement;
            if (target.closest('.delete-message-btn')) {
                return;
            }
            setSelectedMessageForDelete(null);
        };

        document.addEventListener('click', handleGlobalClick);
        return () => {
            document.removeEventListener('click', handleGlobalClick);
        };
    }, [selectedMessageForDelete]);

    const openRemoveConnectionDialog = () => {
        setRemoveConnectionDialog(true);
    };

    return (
        <div className="messages-page">
            <div className="message-page-subset">
                {contactProfile && (
                    <div className="contact-header" onClick={handleToggleProfileVisibility}>
                        {showBackArrow && (
                            <FaArrowLeft className="back-arrow" onClick={() => navigate('/dashboard/messages')} />
                        )}
                        <div className="contact-info">
                            <img
                                src={`${contactProfile.profilePictureUrl}`}
                                alt={`${contactProfile.firstName} ${contactProfile.lastName}`}
                                className="contact-avatar"
                            />
                            <span className="contact-name">
                                {contactProfile.firstName} {contactProfile.lastName}
                            </span>
                        </div>
                        <div className="menu-container" ref={dropdownRef}>
                            <div
                                className="messages-menu-icon cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMenu();
                                }}
                            >
                                {showMenu && (
                                    <div className="messages-dropdown-menu">
                                        <button
                                            className="flex items-center gap-2 font-medium text-black dark:text-white text-sm"
                                            onClick={openRemoveConnectionDialog}
                                        >
                                            <FaUserMinus />
                                            <div>Remove Connection</div>
                                        </button>
                                        <button
                                            className="flex gap-2 items-center font-medium text-black dark:text-white text-sm"
                                            onClick={handleToggleProfileVisibility}
                                        >
                                            <FaInfo />
                                            <div>{showProfile ? 'Hide Profile' : 'Show Profile'}</div>
                                        </button>
                                        <button
                                            className="flex gap-2 items-center font-medium text-black dark:text-white text-sm"
                                            onClick={handleReportUser}
                                        >
                                            <FaFlag />
                                            <div>Report User</div>
                                        </button>
                                    </div>
                                )}
                                <FaEllipsisV />
                            </div>
                        </div>
                    </div>
                )}

                <div className="messages-container" ref={messagesContainerRef}>
                    {isMobile && showProfile ? (
                        <MessageConnectionProfile userId={userId!} />
                    ) : (
                        <>
                            {!userId ? (
                                <div className="h-full w-full flex items-center justify-center">
                                    <p className="dark:text-white text-sm font-bold">No Messages</p>
                                </div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isLastMessage = index === messages.length - 1;
                                    const isCurrentUser = msg.receiverId === currentUserId;

                                    return (
                                        <React.Fragment key={msg.id}>
                                            {msg.isReferralCard ? (
                                                <div className="message-wrapper">
                                                    <ReferralCardMessage
                                                        msg={msg}
                                                        isCurrentUser={isCurrentUser}
                                                        onConnect={handleReferralConnect}
                                                        onSkip={handleReferralSkip}
                                                        onRenderComplete={handleMessageRendered}
                                                    />
                                                </div>
                                            ) : msg.isGroupInvitation ? (
                                                <div className="message-wrapper">
                                                    <GroupInvitationMessage
                                                        msg={{
                                                            ...msg,
                                                            actionType: msg.actionType ?? InvitationActionType.None,
                                                            invitationStatus: msg.invitationStatus ?? false,
                                                        }}
                                                        isCurrentUser={isCurrentUser}
                                                        contactProfile={contactProfile}
                                                        handleAcceptInvitation={() => handleAcceptInvitation(msg.groupId!, msg.id)}
                                                        handleDeclineInvitation={() => handleDeclineInvitation(msg.groupId!, msg.id)}
                                                        handleUserClick={handleUserClick}
                                                        groupInfoCache={groupInfoCache}
                                                        setGroupInfoCache={setGroupInfoCache}
                                                        onRenderComplete={handleMessageRendered}
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    className={`message-bubble ${
                                                        isCurrentUser ? 'received' : 'sent'
                                                    } ${isLastMessage ? 'last-message' : ''}`}
                                                    // Desktop: right-click to toggle
                                                    onContextMenu={
                                                        !isCurrentUser
                                                            ? (e) => handleMessageContextMenu(e, msg.id)
                                                            : undefined
                                                    }
                                                    // Mobile: hold down to reveal delete
                                                    onTouchStart={() => handleTouchStart(msg.id)}
                                                    onTouchEnd={handleTouchEnd}
                                                >
                                                    {isDialogOpen && (
                                                        <ConfirmationDialog
                                                            message="Are you sure you want to delete this message?"
                                                            onConfirm={() => {
                                                                void handleDeleteMessage(selectedMessageForDelete);
                                                            }}
                                                            onCancel={closeDialog}
                                                        />
                                                    )}

                                                    {selectedMessageForDelete === msg.id && (
                                                        isMobileDeleteMessage
                                                            ? (
                                                                <button
                                                                    className="delete-message-btn p-2 flex items-center gap-2"
                                                                    style={{ position: 'absolute', right: 0, bottom: '-2rem', zIndex: 2 }}
                                                                    onClick={() => openDeleteConfirmation(msg.id)}
                                                                >
                                                                    <FaTrash size={17} /> Delete
                                                                </button>
                                                            )
                                                            : (
                                                                contextMenuPosition && (
                                                                    <button
                                                                        className="delete-message-btn p-2 flex items-center gap-2"
                                                                        style={{
                                                                            left: contextMenuPosition.x - 170,
                                                                            top: contextMenuPosition.y - 10,
                                                                        }}
                                                                        onClick={() => openDeleteConfirmation(msg.id)}
                                                                    >
                                                                        <FaTrash size={17} /> Delete
                                                                    </button>
                                                                )
                                                            )
                                                    )}

                                                    {/* Attachments */}
                                                    {msg.attachments?.map((attachment) => {
                                                        const ext = getFileExtension(attachment.fileName);
                                                        const isImage = isImageFileName(attachment.fileName);
                                                        const fileHref = attachment.fileUrl;

                                                        return (
                                                            <div
                                                                key={`${attachment.id}-${msg.id}`}
                                                                className="message-attachment"
                                                            >
                                                                {isImage ? (
                                                                    <a
                                                                        href={fileHref}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        <img
                                                                            src={fileHref}
                                                                            alt={attachment.fileName}
                                                                            className="message-image"
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    <a
                                                                        href={fileHref}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        download
                                                                    >
                                                                        <div className="attachment-preview">
                                                                            {getFileIcon(ext)}
                                                                            <span className="attachment-filename">
                                                                                {attachment.fileName.length > 10
                                                                                    ? `${attachment.fileName.substring(0, 10)}...`
                                                                                    : attachment.fileName}
                                                                            </span>
                                                                        </div>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    <p>{msg.content || ""}</p>
                                                </div>
                                            )}

                                            {shouldShowTimestamp(messages, index) && (
                                                <div className="message-timestamp">
                                                    {getFormattedTimestamp(new Date(msg.timestamp))}
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                            {isLoadingMore && (
                                <div className="loading-more-messages">
                                    {/* You can show a spinner or 'Loading...' */}
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {userId && !showProfile && (
                    <MessageInput userId={userId} />
                )}

                {selectedGroupId && (
                    <ViewGroupProfile groupId={selectedGroupId} onClose={handleCloseGroupProfile} />
                )}
            </div>

            {!isMobile && userId && showProfile && (
                <MessageConnectionProfile userId={userId} />
            )}

            {showReportPopup && (
                <ReportUserComponent userId={userId} onShowReportFalse={setShowReportPopupFalse}/>
            )}
            {removeConnectionDialog && (
                <ConfirmationDialog
                    message="Are you sure you want to remove this user?"
                    onConfirm={() => {
                        void handleRemoveConnection();
                    }}
                    onCancel={closeDialog}
                />
            )}

        </div>
    );
};

export default Messages;
