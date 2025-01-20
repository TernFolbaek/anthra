import React, {useContext, useEffect, useRef, useState} from 'react';
import './Messages.css';
import * as signalR from '@microsoft/signalr';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MessageConnectionProfile from './MessageConnectionProfile/MessageConnectionProfile';
import {
    FaEllipsisV, FaArrowLeft, FaUserMinus, FaInfo,
    FaFilePdf, FaFileWord, FaFileExcel, FaFileAlt, FaFlag
} from 'react-icons/fa';
import MessageInput from "./MessageInput";
import ViewGroupProfile from "../ViewGroupProfile/ViewGroupProfile";
import GroupInvitationMessage from "./GroupInvitationMessage";
import ReferralCardMessage from "./ReferralCardMessage";
import { Message, InvitationActionType, UserProfile } from '../types/types';
import {NotificationContext} from "../../context/NotificationsContext";

/**
 * Telegram Bot Info:
 *   token:  7954138299:AAGPne8Z1-KpG9LpHCFD9FoEMtXItCOMUPc
 *   chatId: 7731233891
 */

interface Attachment {
    id: number;
    fileName: string;
    fileUrl: string;
}

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

const Messages: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

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

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1300);
    const [showBackArrow, setShowBackArrow] = useState(window.innerWidth <= 900);

    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [groupInfoCache, setGroupInfoCache] = useState<{ [key: number]: any }>({});

    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
    const [nextTokenValue, setNextTokenValue] = useState<string | null>(null);
    const [firstLoad, setFirstLoad] = useState(true);

    // Notification context
    const notificationContext = useContext(NotificationContext);
    if (!notificationContext) {
        throw new Error("NotificationContext is undefined. Make sure you're inside a NotificationProvider.");
    }
    const { removeNotificationsBySenderId } = notificationContext;

    // For reporting user
    const [showReportPopup, setShowReportPopup] = useState(false);
    const [reportDescription, setReportDescription] = useState('');
    const [reportFiles, setReportFiles] = useState<File[]>([]);

    /**
     * Resize listeners
     */
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1300);
            setShowBackArrow(window.innerWidth <= 900);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    /**
     * Load initial conversation or redirect to first conversation
     */
    useEffect(() => {
        if (!userId) {
            axios
                .get(`/Messages/GetConversations`, {
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
                    `/Messages/GetChatHistory`,
                    {
                        params: {
                            userId: currentUserId,
                            contactId: userId,
                            pageSize: 30,
                        },
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                const data = response.data;
                setMessages(data.messages);
                setNextTokenValue(data.nextToken);

                if (data.messages.length < 30) {
                    setAllMessagesLoaded(true);
                }
            } catch (error: any) {
                console.error('Error fetching messages:', error.response?.data || error.message);
            } finally{
                setIsLoading(false);
            }
        };

        const fetchContactProfile = async () => {
            try {
                const response = await axios.get(
                    `/Profile/GetProfileById`,
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
     * SignalR Connection setup
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
     * Close dropdown on outside click
     */
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
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
     * Listen for updated messages or new messages
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
        }
        return () => {
            if (connection) {
                connection.off('UpdateMessage');
                connection.off('ReceiveMessage');
            }
        };
    }, [connection]);

    /**
     * Infinite scroll - load older messages
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
     * Scroll whenever container resizes (images, etc.)
     */
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const handleMessageRendered = () => {
        if (firstLoad) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    /**
     * Group invitation
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
     * Identify chat group ID
     */
    const getChatGroupId = (userA: string, userB: string) => {
        return userA < userB ? `${userA}-${userB}` : `${userB}-${userA}`;
    };

    /**
     * Show or hide timestamps
     */
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

    /**
     * Dropdown menu & profile toggles
     */
    const toggleMenu = () => setShowMenu(!showMenu);
    const handleToggleProfileVisibility = () => {
        setShowProfile(p => !p);
        setShowMenu(false);
    };

    const handleRemoveConnection = async () => {
        try {
            await axios.post(
                '/Connections/RemoveConnection',
                { userId: currentUserId, connectionId: userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (userId) {
                removeNotificationsBySenderId(userId);
            }
            navigate('/dashboard/messages');
        } catch (error) {
            console.error('Error removing connection:', error);
        }
        setShowMenu(false);
    };

    /**
     * Reporting a user
     */
    const handleReportUser = () => {
        setShowReportPopup(true);
        setShowMenu(false);
    };

    const handleSendReport = async () => {
        // Extra safety
        if (!reportDescription.trim()) return;

        try {
            const formData = new FormData();
            formData.append('ReportedUserId', userId || '');
            formData.append('Description', reportDescription);

            reportFiles.forEach((file) => {
                formData.append('Screenshots', file);
            });

            await axios.post('/Report/SendReport', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            alert('Your report has been sent successfully. Thank you!');
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

    /**
     * Group profile
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
     * Rendering
     */
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
                                            onClick={handleRemoveConnection}
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
                            {isLoading ? (
                                <div className="">
                                    <div className="card-container"></div>
                                    <div className="message-page-subset">
                                    </div>
                                </div>

                            ) : (
                                !userId ? (
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
                                                    >
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
                                                {shouldShowTimestamp(index) && (
                                                    <div className="message-timestamp">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )
                            )}
                            {isLoadingMore && (
                                <div className="loading-more-messages">
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Show input if we have a userId and either we're on desktop or the profile isn't open */}
                {userId && (!isMobile || !showProfile) && (
                    <MessageInput userId={userId} />
                )}

                {/* Show group info if selected */}
                {selectedGroupId && (
                    <ViewGroupProfile groupId={selectedGroupId} onClose={handleCloseGroupProfile} />
                )}
            </div>

            {/* Show side-by-side profile if not mobile */}
            {!isMobile && userId && showProfile && (
                <MessageConnectionProfile userId={userId} />
            )}

            {/* Report Popup Modal */}
            {showReportPopup && (
                <div className="report-popup-overlay" onClick={handleCloseReportPopup}>
                    <div className="report-popup-content" onClick={(e) => e.stopPropagation()}>
                        <h2 className="report-popup-title">Report User</h2>
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
                                    if(e.target.files){
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
                                className={`bg-emerald-400 text-white font-medium px-3 rounded-lg py-2 ${!reportDescription.trim() ? 'disabled-btn' : ''}`}
                                onClick={handleSendReport}
                                disabled={!reportDescription.trim()}
                            >
                                Send Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;
