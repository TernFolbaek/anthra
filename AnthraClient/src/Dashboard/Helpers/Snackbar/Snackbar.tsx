import React, { useState, useEffect } from 'react';
import './Snackbar.css';

interface SnackbarProps {
    title: string;
    message: string;
    duration?: number;
    onClose?: () => void;
}

const Snackbar: React.FC<SnackbarProps> = ({ title, message, duration = 3000, onClose }) => {
    const [show, setShow] = useState<boolean>(true);
    const [animationKey, setAnimationKey] = useState<number>(0);

    useEffect(() => {
        setShow(true);
        setAnimationKey(prev => prev + 1);

        const timer = setTimeout(() => {
            setShow(false);
            if (onClose) onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose, title, message]);

    if (!show) return null;

    return (
        <div className="snackbar-container" onClick={()=>setShow(false)}>
            <div className="snackbar">
                <div className="snackbar-content">
                    <div className="snackbar-title">{title}</div>
                    <div className="snackbar-message">{message}</div>
                </div>
                <div
                    key={animationKey} // Use animationKey to reset animation
                    className="snackbar-progress bg-sky-300 dark:bg-emerald-400"
                    style={{ animationDuration: `${duration}ms` }}
                ></div>
            </div>
        </div>
    );
};

export default Snackbar;
