import React from 'react';
import { NavLink } from 'react-router-dom';
import './DashboardNavbar.css';

const DashboardNavbar: React.FC = () => {
    return (
        <div className="navbar">
            <NavLink to="/explore"   className={({ isActive }) => (isActive ? 'active-link' : undefined)}>
                Explore
            </NavLink>
            <NavLink to="/requests"   className={({ isActive }) => (isActive ? 'active-link' : undefined)}>
                Requests
            </NavLink>
            <NavLink to="/messages"   className={({ isActive }) => (isActive ? 'active-link' : undefined)}>
                Messages
            </NavLink>
            <NavLink to="/profile"   className={({ isActive }) => (isActive ? 'active-link' : undefined)}>
                Your Profile
            </NavLink>
        </div>
    );
};

export default DashboardNavbar;
