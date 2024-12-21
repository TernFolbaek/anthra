// src/context/NotificationsContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';

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

interface NotificationContextProps {
    notifications: Notification[];
    markAsRead: (notificationId: number) => Promise<void>;
    markGroupNotificationsAsRead: (groupId: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
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

        // Listen for new notifications
        connection.on('ReceiveNotification', (notification: Notification) => {
            setNotifications((prev) => [notification, ...prev]);
        });

        // Listen for notification updates (e.g., marking as read)
        connection.on('UpdateNotification', (notification: Notification) => {
            setNotifications((prevNotifications) => {
                return prevNotifications.map((n) =>
                    n.id === notification.id ? notification : n
                );
            });
        });

        // Optionally, listen for batch updates if your backend supports it
        connection.on('UpdateNotifications', (updatedNotifications: Notification[]) => {
            setNotifications((prev) => {
                // Update or add notifications based on the updated list
                const updatedIds = updatedNotifications.map(n => n.id);
                const newNotifications = [...prev.filter(n => !updatedIds.includes(n.id)), ...updatedNotifications];
                return newNotifications;
            });
        });

        return () => {
            connection.stop();
        };
    }, [token]);

    const fetchNotifications = useCallback(async () => {
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
    }, [token]);

    const markAsRead = useCallback(async (notificationId: number) => {
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
                prev.map((n) =>
                    n.id === notificationId ? { ...n, isRead: true } : n
                )
            );
        } catch (error) {
            console.error('Failed to mark notification as read.', error);
        }
    }, [token]);

    const markGroupNotificationsAsRead = useCallback(async (groupId: number) => {
        try {
            // Identify all unread notifications related to the group
            const groupNotifications = notifications.filter(
                (n) => n.groupId === groupId && !n.isRead
            );

            // Create an array of promises to mark each notification as read
            const markPromises = groupNotifications.map((n) => markAsRead(n.id));

            // Execute all promises concurrently
            await Promise.all(markPromises);
        } catch (error) {
            console.error('Failed to mark group notifications as read.', error);
        }
    }, [notifications, markAsRead]);

    const markAllAsRead = useCallback(async () => {
        try {
            await axios.post(
                `http://localhost:5001/api/Notifications/MarkAllAsRead`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
            );
        } catch (error) {
            console.error('Failed to mark all notifications as read.', error);
        }
    }, [token]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                markAsRead,
                markGroupNotificationsAsRead,
                markAllAsRead,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};
