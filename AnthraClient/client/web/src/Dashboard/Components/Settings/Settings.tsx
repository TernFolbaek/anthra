// src/Components/Settings/Settings.tsx
import React, {useState, useEffect, useRef} from 'react';
import './Settings.css';
import {FaUser, FaCog, FaSlidersH, FaTimes} from 'react-icons/fa';
import ProfileSettings from './HelpSettings/HelpSettings';
import AdvancedSettings from './AdvancedSettings/AdvancedSettings';
import ConfigurationSettings from './ConfigurationSettings/ConfigurationSettings';

interface SettingsProps {
    onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({onClose}) => {
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
            return (<div className="flex flex-col">
                    <p className="font-semibold p-2 pb-0 text-left">Filters:</p>
                    <AdvancedSettings/>
                    <hr className="border-0 h-px bg-gray-300 my-4"/>
                    <p className="font-semibold p-2 text-left">Configuration:</p>
                    <ConfigurationSettings/>
                    <hr className="border-0 h-px bg-gray-300 my-4"/>
                    <p className="font-semibold p-2 text-left">Profile:</p>
                    <ProfileSettings/>
                </div>
            )
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
                    <div className="settings-header dark:text-white">
                        <p className="text-xl font-semibold items-center gap-2 flex"><FaCog size={17}/>Settings</p>
                        <button className="close-button" onClick={initiateClose} aria-label="Close Settings">
                            <FaTimes size={20}/>
                        </button>
                    </div>

                    <div className="settings-content p-2">{renderContent()}</div>
                </div>
            </div>
        );
    }
;

export default Settings;
