// Sidebar.tsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    FaSearch,
    FaUsers,
    FaCog,
    FaUserFriends,
} from 'react-icons/fa';
import { MdMessage } from "react-icons/md";
import './Sidebar.css';
import Notifications from "../Notifications/Notifications";

const Sidebar: React.FC = () => {
    const userProfilePictureSrc = localStorage.getItem('userProfilePicture') || undefined;

    // State for counts
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [unreadGroups, setUnreadGroups] = useState(0);
    const [unreadConnections, setUnreadConnections] = useState(0);

    const handleCountsUpdate = (messageCount: number, groupCount: number, connectionCount: number) => {
        setUnreadMessages(messageCount);
        setUnreadGroups(groupCount);
        setUnreadConnections(connectionCount);
    };

    return (
        <div className="sidebar">
            <div>
                <NavLink
                    to="/explore"
                    className={({isActive}) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                >
                    <div className="tooltip-container">
                        <FaSearch className="sidebar-icon"/>
                        <span className="tooltip">Explore</span>
                    </div>
                </NavLink>

                <NavLink
                    to="/messages"
                    className={({isActive}) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                >
                    <div className="tooltip-container" style={{ position: 'relative' }}>
                        <MdMessage className="sidebar-icon"/>
                        {unreadMessages > 0 && (
                            <span className="badge-icon">
                                {unreadMessages < 10 ? unreadMessages : '9+'}
                            </span>
                        )}
                        <span className="tooltip">Messages</span>
                    </div>
                </NavLink>

                <NavLink
                    to="/connections"
                    className={({isActive}) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                >
                    <div className="tooltip-container" style={{ position: 'relative' }}>
                        <FaUserFriends className="sidebar-icon"/>
                        {unreadConnections > 0 && (
                            <span className="badge-icon">
                                {unreadConnections < 10 ? unreadConnections : '9+'}
                            </span>
                        )}
                        <span className="tooltip">Connections</span>
                    </div>
                </NavLink>

                <NavLink
                    to="/groups"
                    className={({isActive}) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                >
                    <div className="tooltip-container" style={{ position: 'relative' }}>
                        <FaUsers className="sidebar-icon"/>
                        {unreadGroups > 0 && (
                            <span className="badge-icon">
                                {unreadGroups < 10 ? unreadGroups : '9+'}
                            </span>
                        )}
                        <span className="tooltip">Groups</span>
                    </div>
                </NavLink>

                <NavLink
                    to="/settings"
                    className={({isActive}) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                >
                    <div className="tooltip-container">
                        <FaCog className="sidebar-icon"/>
                        <span className="tooltip">Settings</span>
                    </div>
                </NavLink>
            </div>
            <div className="flex flex-col items-center gap-2">
                <Notifications onCountsUpdate={handleCountsUpdate}/>
                <NavLink to="/profile">
                    <img
                        src={userProfilePictureSrc}
                        alt="profile"
                        className="sidebar-profile-picture"
                    />
                </NavLink>
            </div>

        </div>
    );
};

export default Sidebar;
