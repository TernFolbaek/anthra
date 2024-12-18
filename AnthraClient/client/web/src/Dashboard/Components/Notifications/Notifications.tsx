// Notifications.tsx
import React, {useState, useEffect, useRef} from 'react';
import axios from 'axios';
import './Notifications.css';
import {
    FaBell,
    FaRegBell
} from 'react-icons/fa';
import * as signalR from '@microsoft/signalr';
import {useNavigate} from 'react-router-dom';
import {FcCheckmark} from "react-icons/fc";

interface Notification {
    id: number;
    type: string;
    content: string;
    timestamp: string;
    isRead: boolean;
    senderId?: string;
    senderName?: string;
    groupId?: number;
    messageCount: number;
}

interface NotificationsProps {
    onCountsUpdate?: (messageCount: number, groupCount: number, connectionCount: number) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ onCountsUpdate }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        const connection = new signalR.HubConnectionBuilder()
            .withUrl('http://localhost:5001/notificationHub', {
                accessTokenFactory: () => token || '',
            })
            .withAutomaticReconnect()
            .build();

        connection.start().catch((err) => console.error('Connection failed: ', err));

        connection.on('ReceiveNotification', (notification: Notification) => {
            setNotifications((prev) => [notification, ...prev]);
        });

        connection.on('UpdateNotification', (notification: Notification) => {
            setNotifications((prevNotifications) => {
                return prevNotifications.map((n) =>
                    n.id === notification.id ? notification : n
                );
            });
        });

        return () => {
            connection.stop();
        };
    }, [token]);

    useEffect(() => {
        updateCounts();
    }, [notifications]);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/Notifications/GetNotifications', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setNotifications(response.data);
        } catch (error) {
            console.error('Failed to fetch notifications.', error);
        }
    };

    const handleBellClick = () => {
        setShowDropdown(!showDropdown);
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
            setShowDropdown(false);
        }
    };

    useEffect(() => {
        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const markAsReadAndRedirect = async (notification: Notification) => {
        try {
            await axios.post(
                `http://localhost:5001/api/Notifications/MarkAsRead/${notification.id}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id)
            );

            // Redirect based on notification type
            if (notification.type === 'Message') {
                navigate(`/messages/${notification.senderId}`);
            } else if (notification.type === 'GroupMessage') {
                navigate(`/groups/${notification.groupId}`);
            } else if (notification.type === 'ConnectionRequest') {
                navigate(`/connections`);
            }
            setShowDropdown(false);

        } catch (error) {
            console.error('Failed to mark notification as read.', error);
        }
    };

    const updateCounts = () => {
        // Count unread by type
        const unreadMessages = notifications.filter(n => !n.isRead && n.type === 'Message').length;
        const unreadGroups = notifications.filter(n => !n.isRead && n.type === 'GroupMessage').length;
        const unreadConnections = notifications.filter(n => !n.isRead && n.type === 'ConnectionRequest').length;
        onCountsUpdate && onCountsUpdate(unreadMessages, unreadGroups, unreadConnections);
    };

    return (
        <div className="notifications" ref={bellRef}>
            <div className="bell-icon" onClick={handleBellClick}>
                <FaBell/>
                {notifications.some((n) => !n.isRead) && <span className="badge"></span>}
            </div>
            {showDropdown && (
                <div className="notifications-dropdown">
                    <div className="p-2 border-b border-gray-300 flex justify-between">
                        <p className="flex items-center"><FaRegBell/></p>
                        <button className="text-sm flex items-center gap-2 rounded-md bg-slate-100 hover:bg-slate-200 p-1 ">
                            <FcCheckmark/> Mark all as read
                        </button>
                    </div>
                    {notifications.length === 0 ? (
                        <div className="notification-item text-sm text-center font-semibold">No notifications</div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`notification-item ${notification.isRead ? '' : 'unread'}`}
                                onClick={() => markAsReadAndRedirect(notification)}
                            >
                                {notification.type === "Message" &&
                                    <div className="notification-content">
                                        <p>{notification.content}</p>
                                        {notification.messageCount < 10 ?
                                            <p className="notification-message-count">{notification.messageCount}</p>
                                            :
                                            <p className="notification-message-count">9+</p>
                                        }
                                    </div>
                                }
                                {notification.type !== "Message" &&
                                    <div className="notification-content">
                                        {notification.content}
                                    </div>
                                }
                                <div className="notification-timestamp">
                                    {new Date(notification.timestamp).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Notifications;
