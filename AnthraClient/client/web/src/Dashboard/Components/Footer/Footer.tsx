// Components/Footer/Footer.tsx
import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    FaHome,
    FaUserFriends,
    FaEnvelope,
    FaCog,
    FaBars,
    FaTimes,
    FaUser,
    FaUsers,
} from 'react-icons/fa';
import './Footer.css';
import { NotificationContext } from '../../context/NotificationsContext'; // Ensure correct path

const Footer: React.FC = () => {
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

    // Optional: Close menu on route change
    useEffect(() => {
        closeMenu();
    }, [location.pathname]);

    // Optional: Mark notifications as read when navigating via footer links
    useEffect(() => {
        // Determine the current path and mark relevant notifications as read
        const path = location.pathname;

        if (path.startsWith('/messages')) {
            // Mark all message notifications as read
            const messageNotifications = notifications.filter(n => n.type === 'Message' && !n.isRead);
            messageNotifications.forEach(n => markAsRead(n.id));
        }

        if (path.startsWith('/groups')) {
            // Optionally, mark all group notifications as read
            markAllAsRead(); // Or use markGroupNotificationsAsRead if you want to be specific
        }

        if (path.startsWith('/connections')) {
            // Mark all connection request notifications as read
            const connectionNotifications = notifications.filter(n => n.type === 'ConnectionRequest' && !n.isRead);
            connectionNotifications.forEach(n => markAsRead(n.id));
        }

    }, [location.pathname, notifications, markAsRead, markAllAsRead]);

    return (
        <div className="footer">
            <NavLink to="/groups" className="footer-link" onClick={closeMenu}>
                <div className="tooltip-container">
                    <FaUsers className="footer-icon" />
                    {unreadGroups > 0 && (
                        <span className="badge-icon">
                            {unreadGroups < 10 ? unreadGroups : '9+'}
                        </span>
                    )}
                    <span className="tooltip">Groups</span>
                </div>
            </NavLink>
            <NavLink to="/connections" className="footer-link" onClick={closeMenu}>
                <div className="tooltip-container" style={{ position: 'relative' }}>
                    <FaUserFriends className="footer-icon" />
                    {unreadConnections > 0 && (
                        <span className="badge-icon">
                            {unreadConnections < 10 ? unreadConnections : '9+'}
                        </span>
                    )}
                    <span className="tooltip">Connections</span>
                </div>
            </NavLink>
            <NavLink to="/explore" className="footer-link" onClick={closeMenu}>
                <div className="tooltip-container">
                    <FaHome className="footer-icon" />
                    <span className="tooltip">Explore</span>
                </div>
            </NavLink>
            <NavLink to="/messages" className="footer-link" onClick={closeMenu}>
                <div className="tooltip-container" style={{ position: 'relative' }}>
                    <FaEnvelope className="footer-icon" />
                    {unreadMessages > 0 && (
                        <span className="badge-icon">
                            {unreadMessages < 10 ? unreadMessages : '9+'}
                        </span>
                    )}
                    <span className="tooltip">Messages</span>
                </div>
            </NavLink>
            <button className="footer-link" onClick={toggleMenu}>
                <FaBars className="footer-icon" />
                <span className="tooltip">Menu</span>
            </button>

            {menuOpen && (
                <div className="footer-menu-overlay" onClick={closeMenu}>
                    <div className="footer-menu" onClick={(e) => e.stopPropagation()}>
                        <button className="close-button" onClick={closeMenu}>
                            <FaTimes size={20} />
                        </button>
                        <NavLink to="/profile" onClick={closeMenu}>
                            <div className="text-base flex gap-2 items-center">
                                <FaUser /> Profile
                            </div>
                        </NavLink>

                        <NavLink to="/settings" className="footer-link" onClick={closeMenu}>
                            <div className="text-base flex gap-2 items-center">
                                <FaCog /> Settings
                            </div>
                        </NavLink>
                    </div>
                </div>
            )}
        </div>
    );

};

export default Footer;
