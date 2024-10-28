// Notifications.tsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Notifications.css';
import { CiBellOn } from "react-icons/ci";
import * as signalR from '@microsoft/signalr';

interface Notification {
    id: number;
    type: string;
    content: string;
    timestamp: string;
    isRead: boolean;
    senderId?: string;
    senderName?: string;
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

    const markAsRead = async (notificationId: number) => {
        try {
            await axios.post(
                `http://localhost:5001/api/Notifications/MarkAsRead/${notificationId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
            );
        } catch (error) {
            console.error('Failed to mark notification as read.', error);
        }
    };

    return (
        <div className="notifications" ref={bellRef}>
            <div className="bell-icon" onClick={handleBellClick}>
                <CiBellOn />
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
                                onClick={() => markAsRead(notification.id)}
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
