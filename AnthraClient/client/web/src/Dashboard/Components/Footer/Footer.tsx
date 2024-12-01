// src/Components/Footer/Footer.tsx
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    FaHome,
    FaUserFriends,
    FaEnvelope,
    FaCog,
    FaBars,
    FaTimes, FaUser, FaHandHoldingHeart, FaUsers,
} from 'react-icons/fa'; // Import FaTimes for close icon
import './Footer.css';
import Notifications from "../Notifications/Notifications";
const Footer: React.FC = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    // Prevent background scrolling when menu is open
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, [menuOpen]);

    return (
        <div className="footer">
            <div>
                <Notifications />
            </div>
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
            <button className="footer-link" onClick={toggleMenu}>
                <FaBars />
            </button>

            {menuOpen && (
                <div className="footer-menu-overlay" onClick={closeMenu}>
                    <div className="footer-menu" onClick={(e) => e.stopPropagation()}>
                        <button className="close-button" onClick={closeMenu}>
                            <FaTimes size={20}/>
                        </button>
                        {/* Render additional links here */}
                        <NavLink to="/requests" onClick={closeMenu}>
                            <div className="flex gap-2 items-center">
                                <FaHandHoldingHeart/> Requests
                            </div>
                        </NavLink>
                        <NavLink to="/profile" onClick={closeMenu}>
                        <div className="flex gap-2 items-center">
                                <FaUser/> Profile
                            </div>
                        </NavLink>
                        <NavLink to="/groups" onClick={closeMenu}>
                            <div className="flex gap-2 items-center">
                                <FaUsers/> Groups
                            </div>
                        </NavLink>
                    </div>
                </div>
                )}
        </div>
    );
};

export default Footer;
