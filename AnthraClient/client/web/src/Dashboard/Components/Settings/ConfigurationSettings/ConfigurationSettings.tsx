import React, { useState, useEffect } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import './ConfigurationSettings.css';

const ConfigurationSettings: React.FC = () => {
    const storedDarkMode = localStorage.getItem('isDark') === 'true';
    const [darkMode, setDarkMode] = useState(storedDarkMode);

    const toggleDarkMode = () => {
        setDarkMode((prevMode) => {
            const newMode = !prevMode;
            // Update localStorage
            localStorage.setItem('isDark', newMode.toString());
            // Toggle the 'dark' class on the body element
            document.body.classList.toggle('dark', newMode);
            return newMode;
        });
    };

    useEffect(() => {
        // Ensure the body class reflects the current dark mode setting on load
        if (darkMode) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [darkMode]);

    return (
        <div className="configuration-settings">
            <div className="toggle-group">
                {/* Icon representing the current mode */}
                <span className="mode-icon">
                    {darkMode ? <FaMoon size={20} /> : <FaSun size={20} />}
                </span>
                <div className="toggle-switch" onClick={toggleDarkMode}>
                    <input
                        type="checkbox"
                        id="darkModeToggle"
                        checked={darkMode}
                        onChange={toggleDarkMode}
                        style={{ display: 'none' }} // Hide the default checkbox
                    />
                    <label htmlFor="darkModeToggle" className="toggle-label">
                        <span className={`toggle-thumb ${darkMode ? 'dark' : 'light'}`}></span>
                    </label>
                </div>
                {/* Optional: Show the opposite mode icon */}
                <span className="mode-icon">
                    {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
                </span>
            </div>
        </div>
    );
};

export default ConfigurationSettings;
