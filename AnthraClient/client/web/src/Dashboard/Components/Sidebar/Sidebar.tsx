import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
    return (
        <div className="sidebar">
            <NavLink to="/explore"   className={({ isActive }) => (isActive ? 'active-link' : undefined)}
            >
                Explore Page
            </NavLink>
            <NavLink to="/connections"   className={({ isActive }) => (isActive ? 'active-link' : undefined)}>
                Connections
            </NavLink>
            <NavLink to="/messages"   className={({ isActive }) => (isActive ? 'active-link' : undefined)}
            >
                Messages
            </NavLink>
            <NavLink to="/settings"   className={({ isActive }) => (isActive ? 'active-link' : undefined)}
            >
                Settings
            </NavLink>
        </div>
    );
};

export default Sidebar;
