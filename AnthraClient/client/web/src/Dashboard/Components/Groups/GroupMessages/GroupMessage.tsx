import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './GroupMessage.css';
import { useNavigate } from 'react-router-dom';
import { FaEllipsisV, FaArrowLeft } from 'react-icons/fa';
import * as signalR from '@microsoft/signalr';
import GroupInfo from '../GroupInfo/GroupInfo';
import GroupMessageInput from "./GroupMessageInput";
import EditGroupModal from "../EditGroupModal/EditGroupModal";

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
}

const GroupMessage: React.FC<GroupMessageProps> = ({ groupId, showModal }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
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
    const isGroupCreator = groupInfo?.creatorId === userId;

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1300);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchGroupDetails();
        fetchMessages();
    }, [groupId]);

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl('http://localhost:5001/chatHub', {
                accessTokenFactory: () => token || '',
            })
            .withAutomaticReconnect()
            .build();

        connectionRef.current = connection;

        connection
            .start()
            .then(() => {
                setIsConnectionStarted(true);
            })
            .catch((error) => console.error('Connection failed: ', error));

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
                connection.invoke('LeaveGroup', `Group_${previousGroupIdRef.current}`);
            }

            // Join the new group
            if (groupId) {
                connection.invoke('JoinGroup', `Group_${groupId}`);
                previousGroupIdRef.current = groupId;
            } else {
                console.error('Group ID is undefined');
            }

            // Remove previous event handler to prevent stacking
            connection.off('ReceiveGroupMessage');

            // Set up a new event handler for the new group
            connection.on('ReceiveGroupMessage', (message: Message) => {
                if (message.groupId === groupId) {
                    setMessages((prevMessages) => [...prevMessages, message]);
                }
            });

            // Clean up when the component unmounts or when groupId changes
            return () => {
                connection.off('ReceiveGroupMessage');
            };
        }
    }, [groupId, isConnectionStarted]);

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

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const fetchGroupDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5001/api/Groups/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setGroupInfo(response.data);
        } catch (error) {
            console.error('Error fetching group details:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await axios.get(
                'http://localhost:5001/api/GroupMessages/GetGroupChatHistory',
                {
                    params: { groupId },
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
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

        const timeDiff =
            Math.abs(nextTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

        if (currentSender !== nextSender || timeDiff >= 2) {
            return true;
        }

        return false;
    };

    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    const handleToggleGroupInfoVisibility = () => {
        setShowGroupInfo((prev) => !prev);
        setShowMenu(false);
    };

    const handleEditGroup = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setShowEditGroupModal(true);
        setShowMenu(false);
    };


    return (
        <div className="group-message-page">
            <div className="group-message-container">
                <div className="contact-header" onClick={handleToggleGroupInfoVisibility}>
                    {isMobile && (
                        <FaArrowLeft
                            className="back-arrow"
                            onClick={() => navigate('/groups')}
                        />
                    )}
                    <div className="contact-info">
                        <span className="contact-name">{groupInfo?.groupName}</span>
                    </div>
                    <div
                        className="messages-menu-icon"
                        onClick={(event) => {
                            event.stopPropagation();
                            toggleMenu();
                        }}
                    >
                        {showMenu && (
                            <div className="messages-dropdown-menu">
                                {isGroupCreator && (
                                    <button onClick={handleEditGroup}>
                                        Edit Group
                                    </button>
                                )}
                                <button onClick={handleToggleGroupInfoVisibility}>
                                    {showGroupInfo ? 'Hide Info' : 'Show Info'}
                                </button>
                            </div>
                        )}
                        <FaEllipsisV />
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
                                            isCurrentUser ? 'group-message-own' : ''
                                        }`}
                                    >
                                        {showSenderInfo && !isCurrentUser && (
                                            <div className={`group-message-sender-info`}>
                                                <img
                                                    className="group-message-sender-avatar"
                                                    src={`http://localhost:5001/${message.senderProfilePictureUrl}`}
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
                                                    ? 'group-message-content-own'
                                                    : 'group-message-content-other'
                                            } ${isLastMessage ? 'last-message' : ''}`}
                                        >
                                            <p>{message.content}</p>
                                            {/* Display attachments if any */}
                                            {message.attachments &&
                                                message.attachments.map((attachment) => (
                                                    <div key={attachment.id} className="message-attachment">
                                                        {attachment.fileName
                                                            .toLowerCase()
                                                            .match(/\.(jpeg|jpg|gif|png|bmp|webp)$/) ? (
                                                            <img
                                                                src={`http://localhost:5001/${attachment.fileUrl}`}
                                                                alt={attachment.fileName}
                                                                className="message-image"
                                                            />
                                                        ) : (
                                                            <a
                                                                href={`http://localhost:5001/${attachment.fileUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {attachment.fileName}
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                        {isLastMessage && (
                                            <div className="group-message-timestamp">
                                                {new Date(message.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
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
        </div>
    );
};

export default GroupMessage;
