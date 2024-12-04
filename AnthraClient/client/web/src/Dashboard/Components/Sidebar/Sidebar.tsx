import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    FaSearch,
    FaUsers,
    FaCog,
    FaHandHoldingHeart,
    FaUserFriends,
} from 'react-icons/fa';
import { MdMessage } from "react-icons/md";
import './Sidebar.css';
import Notifications from "../Notifications/Notifications";
const Sidebar: React.FC = () => {
    const userProfilePictureSrc = localStorage.getItem('userProfilePicture') || undefined;

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
                    <div className="tooltip-container">
                        <MdMessage className="sidebar-icon"/>
                        <span className="tooltip">Messages</span>
                    </div>
                </NavLink>
                <NavLink
                    to="/connections"
                    className={({isActive}) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                >
                    <div className="tooltip-container">
                        <FaUserFriends className="sidebar-icon"/>
                        <span className="tooltip">Connections</span>
                    </div>
                </NavLink>
                <NavLink
                    to="/groups"
                    className={({isActive}) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                >
                    <div className="tooltip-container">
                        <FaUsers className="sidebar-icon"/>
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
                <Notifications/>
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
