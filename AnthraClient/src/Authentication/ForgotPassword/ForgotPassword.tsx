import React, { useState } from 'react';
import axios from 'axios';
import './ForgotPassword.css';

interface ForgotPasswordProps {
    onBack: () => void;
    onResetRequested: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onResetRequested }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        try {
            await axios.post('http://localhost:5001/api/Auth/ForgotPassword', { email });
            setMessage('Password reset code sent to your email.');
            onResetRequested();
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                const errorData = err.response.data;
                setError(errorData.message || 'Error sending password reset email.');
            } else {
                setError('Error sending password reset email.');
            }
        }
    };

    return (
        <div className="forgot-password-page">
            <button className="back-button" onClick={onBack}>
                Back
            </button>
            <div className="forgot-password-container">
                <h2>Forgotten Password</h2>
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button type="submit" className="submit-button">Send Reset Code</button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
