import React, { useState, useEffect } from 'react';
import './ConfigurationSettings.css';

const ConfigurationSettings: React.FC = () => {
    const storedDarkMode = localStorage.getItem('isDark') === 'true';
    const [darkMode, setDarkMode] = useState(storedDarkMode);

    const toggleDarkMode = () => {
        setDarkMode((prevMode) => {
            const newMode = !prevMode;
            // Update localStorage
            localStorage.setItem('isDark', newMode.toString());
            // Toggle the 'dark' class on the html element
            document.body.classList.toggle('dark', newMode);
            return newMode;
        });
    };

    useEffect(() => {
        // Ensure the html class reflects the current dark mode setting on load
        if (darkMode) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [darkMode]);

    return (
        <div className="configuration-settings">
            <div className="toggle-group">
                <label className="dark:text-red-500">Dark Mode:</label>
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
