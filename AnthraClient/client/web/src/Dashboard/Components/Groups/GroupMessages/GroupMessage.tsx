// Components/Groups/GroupMessages/GroupMessage.tsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './GroupMessage.css';
import { useNavigate } from 'react-router-dom';
import {
    FaArrowRight,
    FaEllipsisV,
    FaPaperclip,
    FaRegTimesCircle,
    FaArrowLeft,
} from 'react-icons/fa';
import * as signalR from '@microsoft/signalr';
import GroupInfo from '../GroupInfo/GroupInfo';

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
}

const GroupMessage: React.FC<GroupMessageProps> = ({ groupId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [groupName, setGroupName] = useState('');
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const previousGroupIdRef = useRef<number | undefined>(undefined);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

    const [showMenu, setShowMenu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 900);
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

        connection.on('ReceiveGroupMessage', (message: Message) => {
            if (message.groupId === groupId) {
                setMessages((prevMessages) => [...prevMessages, message]);
                scrollToBottom();
            }
        });

        connection
            .start()
            .then(() => {
                console.log('SignalR connection established.');
                if (groupId) {
                    connection.invoke('JoinGroup', `Group_${groupId}`);
                    previousGroupIdRef.current = groupId;
                }
            })
            .catch((error) => console.error('Connection failed: ', error));

        return () => {
            if (connectionRef.current) {
                connectionRef.current.off('ReceiveGroupMessage');
                connectionRef.current.stop();
            }
        };
    }, []);

    useEffect(() => {
        const joinGroup = async () => {
            if (
                connectionRef.current &&
                connectionRef.current.state === signalR.HubConnectionState.Connected
            ) {
                if (previousGroupIdRef.current && previousGroupIdRef.current !== groupId) {
                    await connectionRef.current.invoke('LeaveGroup', `Group_${previousGroupIdRef.current}`);
                }

                if (groupId) {
                    await connectionRef.current.invoke('JoinGroup', `Group_${groupId}`);
                    previousGroupIdRef.current = groupId;
                } else {
                    console.error('Group ID is undefined');
                }
            }
        };

        joinGroup();
    }, [groupId]);

    useEffect(() => {
        // Autofocus input when user starts typing
        const handleKeyDown = (event: KeyboardEvent) => {
            if (inputRef.current && !inputRef.current.contains(document.activeElement)) {
                inputRef.current.focus();
            }
            if (event.key === 'Enter') {
                sendMessage();
            }
            // Scroll to bottom when user starts typing
            scrollToBottom();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const fetchGroupDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5001/api/Groups/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setGroupName(response.data.name);
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
            scrollToBottom();
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async () => {
        if (!groupId || !userId) {
            console.error('Group ID or user ID is undefined');
            return;
        }

        if (newMessage.trim() === '' && !selectedFile) return;

        const formData = new FormData();
        formData.append('SenderId', userId);
        formData.append('Content', newMessage);
        formData.append('GroupId', groupId.toString());

        if (selectedFile) {
            formData.append('File', selectedFile);
        }

        try {
            await axios.post('http://localhost:5001/api/GroupMessages/SendGroupMessage', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            setNewMessage('');
            setSelectedFile(null);
            if (selectedImagePreview) {
                URL.revokeObjectURL(selectedImagePreview);
                setSelectedImagePreview(null);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            setSelectedFile(file);

            // Check if the file is an image
            if (file.type.startsWith('image/')) {
                const imageUrl = URL.createObjectURL(file);
                setSelectedImagePreview(imageUrl);
            } else {
                setSelectedImagePreview(null);
            }
        }
    };

    const handleRemoveSelectedFile = () => {
        if (selectedImagePreview) {
            URL.revokeObjectURL(selectedImagePreview);
        }
        setSelectedFile(null);
        setSelectedImagePreview(null);
    };

    return (
        <div className="group-message-page">
            <div className="group-message-container">
                <div className="contact-header">
                    {isMobile && (
                        <FaArrowLeft
                            className="back-arrow"
                            onClick={() => navigate('/groups')}
                        />
                    )}
                    <div className="contact-info">
                        <span className="contact-name">{groupName}</span>
                    </div>
                    <div className="menu-icon" onClick={toggleMenu}>
                        {showMenu && (
                            <div className="messages-dropdown-menu" ref={dropdownRef}>
                                <button onClick={handleToggleGroupInfoVisibility}>
                                    {showGroupInfo ? 'Hide Group Info' : 'Show Group Info'}
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
                        {selectedFile && (
                            <div className="selected-file-preview">
                                {selectedImagePreview ? (
                                    <div className="image-preview-container">
                                        <img
                                            src={selectedImagePreview}
                                            alt="Selected"
                                            className="image-preview"
                                        />
                                        <FaRegTimesCircle onClick={handleRemoveSelectedFile} />
                                    </div>
                                ) : (
                                    <div className="file-preview-container">
                                        <span>{selectedFile.name}</span>
                                        <FaRegTimesCircle onClick={handleRemoveSelectedFile} />
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="group-message-input-container">
                            <FaPaperclip
                                className="paperclip-icon"
                                onClick={() => fileInputRef.current?.click()}
                            />
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <input
                                type="text"
                                className="group-message-input"
                                ref={inputRef}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <FaArrowRight onClick={sendMessage} className="group-message-send-button" />
                        </div>
                    </>
                )}
            </div>
            {!isMobile && showGroupInfo && <GroupInfo groupId={groupId} />}
        </div>
    );
};

export default GroupMessage;
