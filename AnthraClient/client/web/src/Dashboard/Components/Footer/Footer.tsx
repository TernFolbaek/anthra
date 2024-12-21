import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    FaHome,
    FaUserFriends,
    FaEnvelope,
    FaCog,
    FaBars,
    FaTimes, FaUser, FaUsers,
} from 'react-icons/fa';
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

    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, [menuOpen]);

    return (
        <div className="footer">
            <NavLink to="/groups" className="footer-link" onClick={closeMenu}>
                    <FaUsers/>
            </NavLink>
            <NavLink to="/connections" className="footer-link">
                <FaUserFriends />
            </NavLink>
            <NavLink to="/explore" className="footer-link">
                <FaHome />
            </NavLink>
            <NavLink to="/messages" className="footer-link">
                <FaEnvelope />
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
                        <NavLink to="/profile" onClick={closeMenu}>
                        <div className="text-base flex gap-2 items-center">
                                <FaUser/> Profile
                            </div>
                        </NavLink>

                        <NavLink to="/settings" className="footer-link">
                            <div className="text-base flex gap-2 items-center">
                                <FaCog/> Settings
                            </div>
                        </NavLink>
                    </div>
                </div>
                )}
        </div>
    );
};

export default Footer;
