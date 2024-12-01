import React, { useState, useEffect } from 'react';
import './Snackbar.css';

interface SnackbarProps {
    title: string;
    message: string;
    duration?: number; // Duration in milliseconds
    onClose?: () => void;
}

const Snackbar: React.FC<SnackbarProps> = ({ title, message, duration = 3000, onClose }) => {
    const [show, setShow] = useState<boolean>(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false);
            if (onClose) onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!show) return null;

    return (
        <div className="snackbar-container">
            <div className="snackbar">
                <div className="snackbar-content">
                    <div className="snackbar-title">{title}</div>
                    <div className="snackbar-message">{message}</div>
                </div>
                {/* Progress Bar */}
                <div
                    className="snackbar-progress"
                    style={{ animationDuration: `${duration}ms` }}
                ></div>
            </div>
        </div>
    );
};

export default Snackbar;
