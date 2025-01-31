import React, {useContext, useState, useRef} from 'react';
import './Notifications.css';
import {
    FaBell,
    FaRegBell
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { FcCheckmark } from "react-icons/fc";
import { NotificationContext } from '../../context/NotificationsContext';

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

const Notifications: React.FC = () => {
    const notificationContext = useContext(NotificationContext);
    const [showDropdown, setShowDropdown] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();


    if (!notificationContext) {
        throw new Error('Notifications must be used within a NotificationProvider');
    }

    const { notifications, markAsRead, markAllAsRead } = notificationContext;

    const handleBellClick = () => {
        setShowDropdown(!showDropdown);
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
            setShowDropdown(false);
        }
    };

    React.useEffect(() => {
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
        await markAsRead(notification.id);

        // Redirect based on notification type
        if (notification.type === 'Message') {
            navigate(`/dashboard/messages/${notification.senderId}`);
        } else if (notification.type === 'GroupMessage') {
            navigate(`/dashboard/groups/${notification.groupId}`);
        } else if (notification.type === 'ConnectionRequest') {
            navigate(`/dashboard/connections`);
        }
        setShowDropdown(false);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        setShowDropdown(false);
    };

    return (
        <div className="notifications" ref={bellRef}>
            <div className="bell-icon" onClick={handleBellClick}>
                <FaBell />
                {notifications.some((n) => !n.isRead) && <span className="badge"></span>}
            </div>
            {showDropdown && (
                <div className="notifications-dropdown">
                    <div className="p-2 border-b border-gray-300 flex justify-between">
                        <p className="flex items-center dark:text-white">
                            <FaRegBell />
                        </p>
                        <button
                            className="font-semibold dark:text-white dark:bg-transparent text-sm flex items-center gap-2 rounded-md bg-slate-100 hover:bg-slate-200 p-1"
                            onClick={handleMarkAllAsRead}
                        >
                            <FcCheckmark size={15} /> Mark all as read
                        </button>
                    </div>
                    {notifications.length === 0 ? (
                        <div className="notification-item text-sm text-center font-semibold">
                            No notifications
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`notification-item ${notification.isRead ? '' : 'unread'}`}
                                onClick={() => markAsReadAndRedirect(notification)}
                            >
                                {notification.type === "Message" && (
                                    <div className="notification-content">
                                        <p>{notification.content}</p>
                                        {notification.messageCount < 10 ? (
                                            <p className="notification-message-count">
                                                {notification.messageCount}
                                            </p>
                                        ) : (
                                            <p className="notification-message-count">9+</p>
                                        )}
                                    </div>
                                )}
                                {notification.type !== "Message" && (
                                    <div className="notification-content">
                                        {notification.content}
                                    </div>
                                )}
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
