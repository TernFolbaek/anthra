import React, { useState } from 'react';
import './Settings.css';
import { FaUser, FaCog, FaSlidersH } from 'react-icons/fa';
import ProfileSettings from './ProfileSettings/ProfileSettings';
import AdvancedSettings from './AdvancedSettings/AdvancedSettings';
import ConfigurationSettings from './ConfigurationSettings/ConfigurationSettings';

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('profile');

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileSettings />;
            case 'advanced':
                return <AdvancedSettings />;
            case 'configuration':
                return <ConfigurationSettings />;
            default:
                return null;
        }
    };

    return (
        <div className="settings-card">
            <div className="settings-navbar">
                <div
                    className={`settings-tab-left settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    <FaUser size={24} />
                    <span>Profile</span>
                </div>
                <div
                    className={`settings-tab ${activeTab === 'advanced' ? 'active' : ''}`}
                    onClick={() => setActiveTab('advanced')}
                >
                    <FaSlidersH size={24} />
                    <span>Advanced</span>
                </div>
                <div
                    className={`settings-tab-right settings-tab ${activeTab === 'configuration' ? 'active' : ''}`}
                    onClick={() => setActiveTab('configuration')}
                >
                    <FaCog size={24} />
                    <span>Configuration</span>
                </div>
            </div>
            <div className="settings-content">{renderContent()}</div>
        </div>
    );
};

export default Settings;
