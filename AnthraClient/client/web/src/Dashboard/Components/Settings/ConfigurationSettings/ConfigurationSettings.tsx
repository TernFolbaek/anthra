import React, { useState, useEffect } from 'react';
import './ConfigurationSettings.css';

const ConfigurationSettings: React.FC = () => {
    // Parse the value from localStorage and default to false if it's null
    const storedDarkMode = localStorage.getItem('isDark') === 'true';
    const [darkMode, setDarkMode] = useState(storedDarkMode);

    const toggleDarkMode = () => {
        setDarkMode((prevMode) => {
            const newMode = !prevMode;
            // Update localStorage when the mode changes
            localStorage.setItem('isDark', newMode.toString());
            document.body.classList.toggle('dark-mode', newMode);
            return newMode;
        });
    };

    useEffect(() => {
        // Ensure the body class reflects the current dark mode setting on load
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [darkMode]);

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
