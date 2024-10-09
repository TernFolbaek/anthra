// src/Components/Footer/Footer.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaUserFriends, FaEnvelope, FaCog } from 'react-icons/fa'; // Import icons
import './Footer.css';

const Footer: React.FC = () => {
    return (
        <div className="footer">
            <NavLink to="/explore" className="footer-link">
                <FaHome />
            </NavLink>
            <NavLink to="/connections" className="footer-link">
                <FaUserFriends />
            </NavLink>
            <NavLink to="/messages" className="footer-link">
                <FaEnvelope />
            </NavLink>
            <NavLink to="/settings" className="footer-link">
                <FaCog />
            </NavLink>
        </div>
    );
};

export default Footer;
