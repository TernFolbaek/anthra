import React, { useState, useEffect } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import './ConfigurationSettings.css';

const ConfigurationSettings: React.FC = () => {
    const storedDarkMode = localStorage.getItem('isDark') === 'true';
    const [darkMode, setDarkMode] = useState(storedDarkMode);

    const toggleDarkMode = () => {
        setDarkMode((prevMode) => {
            const newMode = !prevMode;
            localStorage.setItem('isDark', newMode.toString());
            document.body.classList.toggle('dark', newMode);
            return newMode;
        });
    };

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [darkMode]);

    return (
        <div className="configuration-settings">
            <div className="toggle-group">
                <span className="mode-icon">
                    {darkMode ? <FaMoon size={15} /> : <FaSun size={15} />}
                </span>
                <div className="toggle-switch" onClick={toggleDarkMode}>
                    <input
                        type="checkbox"
                        id="darkModeToggle"
                        checked={darkMode}
                        onChange={toggleDarkMode}
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="darkModeToggle" className="bg-emerald-400 toggle-label">
                        <span className={`toggle-thumb ${darkMode ? 'dark' : 'light'}`}></span>
                    </label>
                </div>
                <span className="mode-icon">
                    {darkMode ? <FaSun size={15} /> : <FaMoon size={15} />}
                </span>
            </div>
        </div>
    );
};

export default ConfigurationSettings;
