// Notifications.tsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Notifications.css';
import {
FaBell
} from 'react-icons/fa';
import * as signalR from '@microsoft/signalr';
import { useNavigate } from 'react-router-dom';

interface Notification {
    id: number;
    type: string;
    content: string;
    timestamp: string;
    isRead: boolean;
    senderId?: string;
    senderName?: string;
    groupId?: number; // Added GroupId
}

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    const token = localStorage.getItem('token');

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

        return () => {
            connection.stop();
        };
    }, []);

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


// Inside the component
    const navigate = useNavigate();

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
            // Remove the notification from the list
            setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id)
            );
            // Redirect based on notification type
            if (notification.type === 'Message') {
                // Redirect to direct message with SenderId
                navigate(`/messages/${notification.senderId}`);
            } else if (notification.type === 'GroupMessage') {
                // Redirect to group chat
                navigate(`/group-messages/${notification.groupId}`);
            } else if (notification.type === 'ConnectionRequest') {
                // Redirect to connection requests page
                navigate(`/requests`);
            }
            setShowDropdown(false);

        } catch (error) {
            console.error('Failed to mark notification as read.', error);
        }
    };


    return (
        <div className="notifications" ref={bellRef}>
            <div className="bell-icon" onClick={handleBellClick}>
                <FaBell />
                {notifications.some((n) => !n.isRead) && <span className="badge"></span>}
            </div>
            {showDropdown && (
                <div className="notifications-dropdown">
                    {notifications.length === 0 ? (
                        <div className="notification-item">No notifications.</div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`notification-item ${notification.isRead ? '' : 'unread'}`}
                                onClick={() => markAsReadAndRedirect(notification)}
                            >
                                <div className="notification-content">
                                    {notification.content}
                                </div>
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
