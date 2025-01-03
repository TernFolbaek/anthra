import React from 'react';
import './DashboardNavbar.css';
import Notifications from '../Notifications/Notifications';

const DashboardNavbar: React.FC = () => {


    return (
        <div className="dashboard-navbar">
            <Notifications />
        </div>
    );
};

export default DashboardNavbar;
