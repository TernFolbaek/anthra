// src/context/NotificationsContext.tsx
import React, {
    createContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
    useRef,
} from 'react';
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

export const NotificationContext = createContext<NotificationContextProps | undefined>(
    undefined
);

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const token = localStorage.getItem('token');
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const isConnectionSetup = useRef<boolean>(false); // Ref to track if connection setup is done

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await axios.get('https://api.anthra.dk/api/Notifications/GetNotifications', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setNotifications(response.data);
        } catch (error) {
            console.error('Failed to fetch notifications.', error);
        }
    }, [token]);

    useEffect(() => {
        if (!token) {
            console.warn('No token found. Skipping SignalR connection.');
            return;
        }

        fetchNotifications();

        // Prevent multiple connections in Strict Mode by checking if setup is already done
        if (isConnectionSetup.current) {
            return;
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl('https://api.anthra.dk/notificationHub', {
                accessTokenFactory: () => token || '',
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        connectionRef.current = connection;

        const startConnection = async () => {
            try {
                await connection.start();
                setIsConnected(true);
                console.log('SignalR connection established.');

                // Listen for new notifications
                connection.on('ReceiveNotification', (notification: Notification) => {
                    setNotifications((prev) => [notification, ...prev]);
                });

                // Listen for notification updates (e.g., marking as read)
                connection.on('UpdateNotification', (notification: Notification) => {
                    setNotifications((prevNotifications) =>
                        prevNotifications.map((n) => (n.id === notification.id ? notification : n))
                    );
                });

                // Optionally, listen for batch updates if your backend supports it
                connection.on('UpdateNotifications', (updatedNotifications: Notification[]) => {
                    setNotifications((prev) => {
                        // Update or add notifications based on the updated list
                        const updatedIds = updatedNotifications.map((n) => n.id);
                        const newNotifications = [
                            ...prev.filter((n) => !updatedIds.includes(n.id)),
                            ...updatedNotifications,
                        ];
                        return newNotifications;
                    });
                });
            } catch (err) {
                console.error('Failed to start the connection:', err);
            }
        };

        startConnection();

        // Handle connection closed
        connection.onclose((error) => {
            setIsConnected(false);
            if (error) {
                console.error('SignalR connection closed with error:', error);
            } else {
                console.log('SignalR connection closed.');
            }
        });

        // Handle reconnection attempts
        connection.onreconnecting((error) => {
            setIsConnected(false);
            console.warn('SignalR connection lost due to error:', error);
        });

        connection.onreconnected((connectionId) => {
            setIsConnected(true);
            console.log('SignalR reconnected. Connection ID:', connectionId);
        });

        isConnectionSetup.current = true; // Mark that the connection has been set up

        return () => {
            // **Do not stop the connection in cleanup** to prevent it from being stopped during negotiation
            // If you have multiple consumers, consider reference counting or other logic to manage the connection
        };
    }, [token, fetchNotifications]);

    const markAsRead = useCallback(
        async (notificationId: number) => {
            try {
                await axios.post(
                    `https://api.anthra.dk/api/Notifications/MarkAsRead/${notificationId}`,
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
        },
        [token]
    );

    const markGroupNotificationsAsRead = useCallback(
        async (groupId: number) => {
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
        },
        [notifications, markAsRead]
    );

    const markAllAsRead = useCallback(async () => {
        try {
            await axios.post(
                `https://api.anthra.dk/api/Notifications/MarkAllAsRead`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
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
