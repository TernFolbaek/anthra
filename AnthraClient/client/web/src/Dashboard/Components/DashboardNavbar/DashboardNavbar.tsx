import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import './DashboardNavbar.css';

const DashboardNavbar: React.FC = () => {
    // Navbar links
    const navbarLinks = [
        { to: '/explore', label: 'Explore' },
        { to: '/requests', label: 'Requests' },
        { to: '/messages', label: 'Messages' },
        { to: '/profile', label: 'Your Profile' },
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
                <div className="dashboard-navbar__profile-icon">
                    <NavLink to="/profile">
                        <FaUser className="profile-icon" />
                    </NavLink>
                </div>
            </div>
        </nav>
    );
};

export default DashboardNavbar;
