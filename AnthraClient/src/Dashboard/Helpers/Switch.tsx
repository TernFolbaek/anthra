import React, { useState } from 'react';
import './Switch.css';

interface Props {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const Switch: React.FC<Props> = ({ label, checked, onChange }) => {
    const handleToggle = () => {
        onChange(!checked);
    };

    return (
        <div className="switch-container">
            <label className="switch">
                <input type="checkbox" checked={checked} onChange={handleToggle} />
                <span className="slider"></span>
            </label>
            <span className="switch-label">{label}</span>
        </div>
    );
};

export default Switch;
