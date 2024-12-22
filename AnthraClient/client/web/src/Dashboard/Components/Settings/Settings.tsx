// src/Components/Settings/Settings.tsx
import React, { useState, useEffect, useRef } from 'react';
import './Settings.css';
import { FaUser, FaCog, FaSlidersH, FaTimes } from 'react-icons/fa';
import ProfileSettings from './HelpSettings/HelpSettings';
import AdvancedSettings from './AdvancedSettings/AdvancedSettings';
import ConfigurationSettings from './ConfigurationSettings/ConfigurationSettings';

interface SettingsProps {
    onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [isClosing, setIsClosing] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Close Settings on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                initiateClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Initiate closing animation
    const initiateClose = () => {
        setIsClosing(true);
    };

    // Handle animation end
    useEffect(() => {
        const handleAnimationEnd = (e: AnimationEvent) => {
            if (isClosing) {
                onClose();
            }
        };
        const overlayCurrent = overlayRef.current;
        if (overlayCurrent) {
            overlayCurrent.addEventListener('animationend', handleAnimationEnd);
        }
        return () => {
            if (overlayCurrent) {
                overlayCurrent.removeEventListener('animationend', handleAnimationEnd);
            }
        };
    }, [isClosing, onClose]);

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
        <div
            className={`settings-overlay ${isClosing ? 'closing' : ''}`}
            onClick={initiateClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            ref={overlayRef}
        >
            <div
                className={`settings-card ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="settings-header">
                    <h2 id="settings-title">Settings</h2>
                    <button className="close-button" onClick={initiateClose} aria-label="Close Settings">
                        <FaTimes size={20} />
                    </button>
                </div>
                <div className="settings-navbar">
                    <div
                        className={`settings-tab-left settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <FaUser size={24} />
                        <span className="text-gray-700 font-bold">Help</span>
                    </div>
                    <div
                        className={`settings-tab ${activeTab === 'advanced' ? 'active' : ''}`}
                        onClick={() => setActiveTab('advanced')}
                    >
                        <FaSlidersH size={24} />
                        <span className="text-gray-700 font-bold">Filters</span>
                    </div>
                    <div
                        className={`settings-tab-right settings-tab ${activeTab === 'configuration' ? 'active' : ''}`}
                        onClick={() => setActiveTab('configuration')}
                    >
                        <FaCog size={24} />
                        <span className="text-gray-700 font-bold">Configuration</span>
                    </div>
                </div>
                <div className="settings-content">{renderContent()}</div>
            </div>
        </div>
    );
};

export default Settings;
