import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../AuthPage/AuthPage.css';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

interface ForgotPasswordProps {
    onBack: () => void;
    onResetRequested: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onResetRequested }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const STATE_MACHINE_NAME = 'State Machine 1';
    const { rive, RiveComponent } = useRive({
        src: '/rive/520-990-teddy-login-screen.riv',
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
            await axios.post('http://localhost:5001/api/Auth/ForgotPassword', { email });
            setMessage('Password reset code sent to your email.');
            onResetRequested();
        } catch (err: any) {
            setError('Error sending password reset email.');
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
                <h2 className="font-bold mb-2">Forgot Password</h2>
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
