// ResetPassword.tsx
import React, { useState } from 'react';
import axios from 'axios';

interface ResetPasswordProps {
    onBack: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        try {
            await axios.post('http://localhost:5001/api/Auth/ResetPassword', {
                email,
                code,
                newPassword,
            });
            setMessage('Password has been reset successfully.');
        } catch (err: any) {
            setError('Error resetting password.');
        }
    };

    return (
        <div className="reset-password-container">
            <button className="back-button" onClick={onBack}>
                Back
            </button>
            <h2>Reset Password</h2>
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
                <input
                    type="text"
                    placeholder="Enter the code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Enter new password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <button type="submit" className="submit-button">Reset Password</button>
            </form>
        </div>
    );
};

export default ResetPassword;
