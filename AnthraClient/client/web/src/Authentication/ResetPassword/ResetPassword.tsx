import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../AuthPage/AuthPage.css';
import './ResetPassword.css';

import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

interface ResetPasswordProps {
    onBack: () => void;
    onResetSuccess: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onBack, onResetSuccess }) => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const STATE_MACHINE_NAME = 'State Machine 1';
    const { rive, RiveComponent } = useRive({
        src: '520-990-teddy-login-screen.riv',
        autoplay: true,
        stateMachines: STATE_MACHINE_NAME,
    });

    const stateLook = useStateMachineInput(rive, STATE_MACHINE_NAME, 'Look');
    const stateCheck = useStateMachineInput(rive, STATE_MACHINE_NAME, 'Check');
    const stateHandUp = useStateMachineInput(rive, STATE_MACHINE_NAME, 'hands_up');

    useEffect(() => {
        setLook();
    }, [email]);

    const setLook = () => {
        if (!stateLook || !stateCheck || !setHangUp) {
            return;
        }
        setHangUp(false);
        setCheck(true);
        let nbChars = email.length;
        let ratio = nbChars / parseFloat('41');
        let lookToSet = ratio * 100 - 25;
        stateLook.value = Math.round(lookToSet);
    };

    const setHangUp = (hangUp: boolean) => {
        stateHandUp && (stateHandUp.value = hangUp);
    };

    const setCheck = (check: boolean) => {
        if (stateCheck) {
            stateCheck.value = check;
        }
    };

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
            setError('Error resetting password.');
        }
    };

    return (
        <div className="auth-page">
            <button className="back-button" onClick={onBack}>
                Back
            </button>
            <div>
                <RiveComponent className="teddy-bear-rive" />
            </div>
            <div className="auth-container">
                <h2>Reset Password</h2>
                {message && <p className="reset-success-message">{message}</p>}
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
        </div>
    );
};

export default ResetPassword;
