import React from 'react';
import './ConfigurationSettings.css';

const ConfigurationSettings: React.FC = () => {
    const [darkMode, setDarkMode] = React.useState(false);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.body.classList.toggle('dark-mode', !darkMode);
    };

    return (
        <div className="configuration-settings">
            <h2>Configuration</h2>
            <div className="toggle-group">
                <label>Dark Mode:</label>
                <div className="toggle-switch">
                    <input
                        type="checkbox"
                        id="darkModeToggle"
                        checked={darkMode}
                        onChange={toggleDarkMode}
                    />
                    <label htmlFor="darkModeToggle"></label>
                </div>
            </div>
        </div>
    );
};

export default ConfigurationSettings;
