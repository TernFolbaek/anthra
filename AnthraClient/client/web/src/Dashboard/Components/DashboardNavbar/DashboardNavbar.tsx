// src/Components/DashboardNavbar/DashboardNavbar.tsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './DashboardNavbar.css';

const DashboardNavbar: React.FC = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };


    // Navbar links
    const navbarLinks = [
        { to: '/explore', label: 'Explore' },
        { to: '/requests', label: 'Requests' },
        { to: '/messages', label: 'Messages' },
        { to: '/profile', label: 'Your Profile' },
    ];

    // Sidebar links
    const sidebarLinks = [
        { to: '/connections', label: 'Connections' },
        { to: '/settings', label: 'Settings' },
        { to: '/groups', label: 'Groups' },
        { to: '/facilities', label: 'Facilities' },
    ];


    return (
        <nav className="dashboard-navbar">
            <div className="dashboard-navbar__container">
                <div className="dashboard-navbar__logo">
                    <h1>Anthra</h1>
                </div>
                <ul className="dashboard-navbar__links">
                    {navbarLinks.map((link) => (
                        <li key={link.to}>
                            <NavLink
                                to={link.to}
                                className={({ isActive }) =>
                                    `dashboard-navbar__link ${isActive ? 'dashboard-navbar__link--active' : ''}`
                                }
                            >
                                {link.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
                <div className="dashboard-navbar__burger" onClick={toggleMenu}>
                    <span className={`dashboard-navbar__burger-bar ${menuOpen ? 'open' : ''}`}></span>
                    <span className={`dashboard-navbar__burger-bar ${menuOpen ? 'open' : ''}`}></span>
                    <span className={`dashboard-navbar__burger-bar ${menuOpen ? 'open' : ''}`}></span>
                </div>
            </div>
            {menuOpen && (
                <ul className="dashboard-navbar__mobile-menu">
                    {navbarLinks.concat(sidebarLinks).map((link) => (
                        <li  className="dashboard-navbar__mobile-link" key={link.to} >
                            <NavLink
                                to={link.to}
                                onClick={toggleMenu}
                            >
                                {link.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            )}
        </nav>
    );
};

export default DashboardNavbar;
