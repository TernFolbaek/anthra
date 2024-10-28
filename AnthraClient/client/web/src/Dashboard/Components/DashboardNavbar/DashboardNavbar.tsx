import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import './DashboardNavbar.css';
import Notifications from '../Notifications/Notifications';

const DashboardNavbar: React.FC = () => {


    return (
        <nav className="dashboard-navbar">
            <div className="dashboard-navbar__container">
                <div className="dashboard-navbar__logo">
                    <h1>Anthra</h1>
                </div>
                <div className="flex gap-2">
                    <Notifications />
                    <div className="dashboard-navbar__profile-icon">
                        <NavLink to="/profile">
                            <FaUser className="profile-icon"/>
                        </NavLink>
                    </div>
                </div>

            </div>
        </nav>
    );
};

export default DashboardNavbar;
