import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    FaSearch,
    FaUsers,
    FaFacebookMessenger,
    FaCog,
    FaBuilding,
    FaHandHoldingHeart,
    FaUserFriends,
} from 'react-icons/fa';
import './Sidebar.css';
import Notifications from "../Notifications/Notifications";
const Sidebar: React.FC = () => {
    const userProfilePictureSrc = localStorage.getItem('userProfilePicture') || undefined;

    return (
        <div className="sidebar">
            <div>
                <NavLink
                    to="/explore"
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                    data-title="Explore"
                >
                    <FaSearch className="sidebar-icon" />
                </NavLink>
                <NavLink
                    to="/messages"
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                    data-title="Messages"
                >
                    <FaFacebookMessenger className="sidebar-icon" />
                </NavLink>
                <NavLink
                    to="/connections"
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                    data-title="Connections"
                >
                    <FaUserFriends className="sidebar-icon" />
                </NavLink>
                <NavLink
                    to="/groups"
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                    data-title="Groups"
                >
                    <FaUsers className="sidebar-icon" />
                </NavLink>
                <NavLink
                    to="/facilities"
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                    data-title="Facilities"
                >
                    <FaBuilding className="sidebar-icon" />
                </NavLink>
                <NavLink
                    to="/requests"
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                    data-title="Requests"
                >
                    <FaHandHoldingHeart className="sidebar-icon" />
                </NavLink>
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                    data-title="Settings"
                >
                    <FaCog className="sidebar-icon" />
                </NavLink>
            </div>
            <div className="flex flex-col items-center gap-2">
                <Notifications/>
                <NavLink to="/profile">
                    <img
                        src={userProfilePictureSrc}
                        alt="profile picture"
                        className="sidebar-profile-picture"
                    />
                </NavLink>
            </div>

        </div>
    );
};


export default Sidebar;
