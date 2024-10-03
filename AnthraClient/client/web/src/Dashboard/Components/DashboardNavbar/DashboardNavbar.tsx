import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './DashboardNavbar.css';

const DashboardNavbar: React.FC = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        <nav className="dashboard-navbar">
            <div className="dashboard-navbar__container">
                <div className="dashboard-navbar__logo">
                    <h1>Anthra</h1>
                </div>
                <ul className="dashboard-navbar__links">
                    <li>
                        <NavLink
                            to="/explore"
                            className={({ isActive }) =>
                                `dashboard-navbar__link ${isActive ? 'dashboard-navbar__link--active' : ''}`
                            }
                        >
                            Explore
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/requests"
                            className={({ isActive }) =>
                                `dashboard-navbar__link ${isActive ? 'dashboard-navbar__link--active' : ''}`
                            }
                        >
                            Requests
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/messages"
                            className={({ isActive }) =>
                                `dashboard-navbar__link ${isActive ? 'dashboard-navbar__link--active' : ''}`
                            }
                        >
                            Messages
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/profile"
                            className={({ isActive }) =>
                                `dashboard-navbar__link ${isActive ? 'dashboard-navbar__link--active' : ''}`
                            }
                        >
                            Your Profile
                        </NavLink>
                    </li>
                </ul>
                <div className="dashboard-navbar__burger" onClick={toggleMenu}>
                    <span className={`dashboard-navbar__burger-bar ${menuOpen ? 'open' : ''}`}></span>
                    <span className={`dashboard-navbar__burger-bar ${menuOpen ? 'open' : ''}`}></span>
                    <span className={`dashboard-navbar__burger-bar ${menuOpen ? 'open' : ''}`}></span>
                </div>
            </div>
            {menuOpen && (
                <ul className="dashboard-navbar__mobile-menu">
                    <li>
                        <NavLink
                            to="/explore"
                            className="dashboard-navbar__mobile-link"
                            onClick={toggleMenu}
                        >
                            Explore
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/requests"
                            className="dashboard-navbar__mobile-link"
                            onClick={toggleMenu}
                        >
                            Requests
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/messages"
                            className="dashboard-navbar__mobile-link"
                            onClick={toggleMenu}
                        >
                            Messages
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/profile"
                            className="dashboard-navbar__mobile-link"
                            onClick={toggleMenu}
                        >
                            Your Profile
                        </NavLink>
                    </li>
                </ul>
            )}
        </nav>
    );
};

export default DashboardNavbar;
