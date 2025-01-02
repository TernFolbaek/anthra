// src/Components/Settings/Settings.tsx
import React, { useState, useEffect, useRef } from 'react';
import './Settings.css';
import { FaUser, FaCog, FaSlidersH, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ProfileSettings from './HelpSettings/HelpSettings';
import AdvancedSettings from './AdvancedSettings/AdvancedSettings';
import ConfigurationSettings from './ConfigurationSettings/ConfigurationSettings';

interface SettingsProps {
    onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const [configExpanded, setConfigExpanded] = useState(false);
    const [profileExpanded, setProfileExpanded] = useState(false);
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

    const toggleFilters = () => {
        setFiltersExpanded(prev => !prev);
    };

    const toggleConfiguration = () => {
        setConfigExpanded(prev => !prev);
    };

    const toggleProfile = () => {
        setProfileExpanded(prev => !prev);
    };

    const renderContent = () => {
        return (
            <div className="settings-dropdown-container">
                {/* Filters Section */}
                <div className="settings-dropdown-section">
                    <div className="settings-dropdown-header" onClick={toggleFilters}>
                        <p className="settings-dropdown-title">Filters:</p>
                        <span className="settings-dropdown-icon">
                            {filtersExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                    </div>
                    {filtersExpanded && (
                        <div className="settings-dropdown-content">
                            <AdvancedSettings />
                        </div>
                    )}
                </div>
                <hr className="settings-divider" />

                {/* Configuration Section */}
                <div className="settings-dropdown-section">
                    <div className="settings-dropdown-header" onClick={toggleConfiguration}>
                        <p className="settings-dropdown-title">Configuration:</p>
                        <span className="settings-dropdown-icon">
                            {configExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                    </div>
                    {configExpanded && (
                        <div className="settings-dropdown-content">
                            <ConfigurationSettings />
                        </div>
                    )}
                </div>
                <hr className="settings-divider" />

                {/* Profile Section */}
                <div className="settings-dropdown-section">
                    <div className="settings-dropdown-header" onClick={toggleProfile}>
                        <p className="settings-dropdown-title">Profile:</p>
                        <span className="settings-dropdown-icon">
                            {profileExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                    </div>
                    {profileExpanded && (
                        <div className="settings-dropdown-content">
                            <ProfileSettings />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div
            className={`settings-overlay ${isClosing ? 'settings-closing' : ''}`}
            onClick={initiateClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            ref={overlayRef}
        >
            <div
                className={`settings-card ${isClosing ? 'settings-closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="settings-header dark:text-white">
                    <p className="settings-title">
                        <FaCog size={17} /> Settings
                    </p>
                    <button className="settings-close-button" onClick={initiateClose} aria-label="Close Settings">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="settings-content p-2">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Settings;
