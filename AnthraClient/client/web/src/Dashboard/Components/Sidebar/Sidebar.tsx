import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
    return (
        <div className="sidebar">
            <NavLink
                to="/explore"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                data-title="Explore"
            >
                Explore Page
            </NavLink>
            <NavLink
                to="/connections"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                data-title="Connections"
            >
                Connections
            </NavLink>
            <NavLink
                to="/messages"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                data-title="MessageList"
            >
                Messages
            </NavLink>
            <NavLink
                to="/settings"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                data-title="Settings"
            >
                Settings
            </NavLink>
            <NavLink
                to="/groups"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                data-title="Groups"
            >
                Groups
            </NavLink>
            <NavLink
                to="/facilities"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
                data-title="Facilities"
            >
                Facilities
            </NavLink>
        </div>
    );
};

export default Sidebar;
