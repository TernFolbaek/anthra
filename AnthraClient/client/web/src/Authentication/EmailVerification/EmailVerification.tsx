import React, { useState, useRef } from 'react';
import axios from 'axios';
import './EmailVerification.css';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

interface EmailVerificationProps {
    userId: string;
    onVerified: () => void;
    onBack: () => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ userId, onVerified, onBack }) => {
    const [verificationCode, setVerificationCode] = useState<string[]>(['', '', '', '', '', '']);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const STATE_MACHINE_NAME = 'State Machine 1';
    const { rive, RiveComponent } = useRive({
        src: '/rive/520-990-teddy-login-screen.riv',
        autoplay: true,
        stateMachines: STATE_MACHINE_NAME,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value;

        if (!/^\d?$/.test(value)) {
            return;
        }

        const newVerificationCode = [...verificationCode];
        newVerificationCode[index] = value;
        setVerificationCode(newVerificationCode);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && verificationCode[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyEmail = async () => {
        const code = verificationCode.join('');
        try {
            const response = await axios.post('http://localhost:5001/api/Auth/VerifyEmail', {
                userId,
                code
            });

            const { token, userId: verifiedUserId, fullName } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('userId', verifiedUserId);
            localStorage.setItem('fullName', fullName);

            const profileResponse = await axios.get(
                'http://localhost:5001/api/Profile/GetProfile',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }
            );
            const userProfile = profileResponse.data;
            localStorage.setItem('userProfilePicture', `${profileResponse.data.profilePictureUrl}`);

            onVerified();
        } catch (err: any) {
            setError('Verification failed. Please try again.');
        }
    };

    const handleResendVerificationCode = async () => {
        try {
            await axios.post('http://localhost:5001/api/Auth/ResendVerificationCode', {
                userId
            });
            setMessage('Verification code resent.');
        } catch (err: any) {
            setError('Failed to resend verification code.');
        }
    };

    return (
        <div className="verification-page">
            <button className="back-button" onClick={onBack}>
                Back
            </button>
            <div>
                <RiveComponent className="teddy-bear-rive" />
            </div>
            <div className="verification-container">
                <h2>Verify Email Address</h2>
                <p>Please enter the verification code sent to your email.</p>
                <div className="otp-container">
                    {verificationCode.map((value, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength={1}
                            value={value}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            ref={(el) => (inputRefs.current[index] = el)}
                            autoFocus={index === 0}
                            className="otp-input"
                        />
                    ))}
                </div>
                <button onClick={handleVerifyEmail} className="submit-button">Verify</button>
                <button onClick={handleResendVerificationCode} className="submit-button">Resend Code</button>
                {error && <p className="error-message">{error}</p>}
                {message && <p className="success-message">{message}</p>}
            </div>
        </div>
    );
};

export default EmailVerification;
