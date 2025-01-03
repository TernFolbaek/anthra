import React, { useState, useRef } from 'react';
import axios from 'axios';
import './EmailVerification.css';

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

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pasteData = e.clipboardData.getData('Text');
        if (/^\d{6}$/.test(pasteData)) {
            const digits = pasteData.split('');
            setVerificationCode(digits);
            digits.forEach((digit, idx) => {
                if (inputRefs.current[idx]) {
                    inputRefs.current[idx]!.value = digit;
                }
            });
            // Prevent the default paste behavior
            e.preventDefault();
            // Move focus to the last input
            inputRefs.current[5]?.focus();
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
            <div className="verification-container">
                <h2>Verify Your Email</h2>
                <p>Enter the 6-digit code we sent to your email:</p>
                <div className="otp-container">
                    {verificationCode.map((value, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength={1}
                            value={value}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            ref={(el) => (inputRefs.current[index] = el)}
                            autoFocus={index === 0}
                            className="otp-input"
                        />
                    ))}
                </div>
                <button onClick={handleVerifyEmail} className="submit-button">Verify</button>
                <button onClick={handleResendVerificationCode} className="resend-button">Resend Code</button>
                {error && <p className="error-message">{error}</p>}
                {message && <p className="success-message">{message}</p>}
            </div>
        </div>
    );
};

export default EmailVerification;
