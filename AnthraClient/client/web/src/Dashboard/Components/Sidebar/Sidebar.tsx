import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaSearch, FaUsers, FaEnvelope, FaCog, FaUsersCog, FaBuilding } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar: React.FC = () => {
    return (
        <div className="sidebar">
            <NavLink
                to="/explore"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                data-title="Explore"
            >
                <FaSearch className="sidebar-icon" />
                Explore Page
            </NavLink>
            <NavLink
                to="/connections"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                data-title="Connections"
            >
                <FaUsers className="sidebar-icon" />
                Connections
            </NavLink>
            <NavLink
                to="/messages"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                data-title="Messages"
            >
                <FaEnvelope className="sidebar-icon" />
                Messages
            </NavLink>
            <NavLink
                to="/settings"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                data-title="Settings"
            >
                <FaCog className="sidebar-icon" />
                Settings
            </NavLink>
            <NavLink
                to="/groups"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                data-title="Groups"
            >
                <FaUsersCog className="sidebar-icon" />
                Groups
            </NavLink>
            <NavLink
                to="/facilities"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                data-title="Facilities"
            >
                <FaBuilding className="sidebar-icon" />
                Facilities
            </NavLink>
        </div>
    );
};

export default Sidebar;
