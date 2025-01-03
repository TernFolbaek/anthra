import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ResetPassword.css';

interface ResetPasswordProps {
    onBack: () => void;
    onResetSuccess: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onBack, onResetSuccess }) => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [formValid, setFormValid] = useState(false);

    useEffect(() => {
        const isFormValid =
            email.trim() !== '' &&
            code.trim() !== '' &&
            newPassword.trim() !== '' &&
            confirmPassword.trim() !== '' &&
            newPassword === confirmPassword;
        setFormValid(isFormValid);
    }, [email, code, newPassword, confirmPassword]);

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
            setTimeout(() => {
                onResetSuccess();
            }, 2000);
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                const errorData = err.response.data;
                setError(errorData.message || 'Error resetting password.');
            } else {
                setError('Error resetting password.');
            }
        }
    };

    return (
        <div className="reset-password-page">
            <button className="back-button" onClick={onBack}>
                Back
            </button>
            <div className="reset-password-container">
                <h2>Reset Password</h2>
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Reset Code"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="New Password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={!formValid}
                    >
                        Reset Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
