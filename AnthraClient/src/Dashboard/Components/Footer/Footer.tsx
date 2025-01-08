import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    FaUserFriends,
    FaEnvelope,
    FaUser,
    FaUsers,
} from 'react-icons/fa';
import './Footer.css';
import { NotificationContext } from '../../context/NotificationsContext';
import {FaMagnifyingGlass} from "react-icons/fa6";

interface FooterProps {
    onSettingsClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ onSettingsClick }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const notificationContext = useContext(NotificationContext);
    const location = useLocation(); // To detect route changes

    if (!notificationContext) {
        throw new Error('Footer must be used within a NotificationProvider');
    }

    const { notifications, markAllAsRead, markGroupNotificationsAsRead, markAsRead } = notificationContext;

    // Calculate unread counts
    const unreadMessages = notifications.filter(n => !n.isRead && n.type === 'Message').length;
    const unreadGroups = notifications.filter(n => !n.isRead && n.type === 'GroupMessage').length;
    const unreadConnections = notifications.filter(n => !n.isRead && n.type === 'ConnectionRequest').length;

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, [menuOpen]);

    // Close menu on route change
    useEffect(() => {
        closeMenu();
    }, [location.pathname]);

    // Mark notifications as read based on current path
    useEffect(() => {
        const path = location.pathname;

        if (path.startsWith('/messages')) {
            const messageNotifications = notifications.filter(n => n.type === 'Message' && !n.isRead);
            messageNotifications.forEach(n => markAsRead(n.id));
        }

        if (path.startsWith('/groups')) {
            // Optionally, mark all group notifications as read
            markAllAsRead();
            // or use: markGroupNotificationsAsRead();
        }

        if (path.startsWith('/connections')) {
            const connectionNotifications = notifications.filter(n => n.type === 'ConnectionRequest' && !n.isRead);
            connectionNotifications.forEach(n => markAsRead(n.id));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    return (
        <div className="footer">
            {/* Notice the className now includes a function that checks isActive */}
            <NavLink
                to="/dashboard/groups"
                className={({isActive}) => `footer-link ${isActive ? 'active-footer-link' : ''}`}
            >
                <div className="tooltip-container">
                    <FaUsers className="footer-icon"/>
                    {unreadGroups > 0 && (
                        <span className="badge-icon">
                            {unreadGroups < 10 ? unreadGroups : '9+'}
                        </span>
                    )}
                    <span className="tooltip">Groups</span>
                </div>
            </NavLink>

            <NavLink
                to="/dashboard/connections"
                className={({isActive}) => `footer-link ${isActive ? 'active-footer-link' : ''}`}
            >
                <div className="tooltip-container" style={{position: 'relative'}}>
                    <FaUserFriends className="footer-icon"/>
                    {unreadConnections > 0 && (
                        <span className="badge-icon">
                            {unreadConnections < 10 ? unreadConnections : '9+'}
                        </span>
                    )}
                    <span className="tooltip">Connections</span>
                </div>
            </NavLink>

            <NavLink
                to="/dashboard/explore"
                className={({isActive}) => `footer-link ${isActive ? 'active-footer-link' : ''}`}
            >
                <div className="tooltip-container">
                    <FaMagnifyingGlass className="footer-icon"/>
                    <span className="tooltip">Explore</span>
                </div>
            </NavLink>

            <NavLink
                to="/dashboard/messages"
                className={({isActive}) => `footer-link ${isActive ? 'active-footer-link' : ''}`}
            >
                <div className="tooltip-container" style={{position: 'relative'}}>
                    <FaEnvelope className="footer-icon"/>
                    {unreadMessages > 0 && (
                        <span className="badge-icon">
                            {unreadMessages < 10 ? unreadMessages : '9+'}
                        </span>
                    )}
                    <span className="tooltip">Messages</span>
                </div>
            </NavLink>

            <NavLink
                to="/dashboard/profile"
                className={({isActive}) => `footer-link ${isActive ? 'active-footer-link' : ''}`}
            >
                <div className="tooltip-container">
                    <FaUser size={20} className="footer-icon"/>
                    <span className="tooltip">Profile</span>
                </div>
            </NavLink>


        </div>
    );
};

export default Footer;
