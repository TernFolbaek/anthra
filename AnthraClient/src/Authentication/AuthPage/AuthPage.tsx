// AuthPage.tsx
import './AuthPage.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import ForgotPassword from '../ForgotPassword/ForgotPassword';
import ResetPassword from '../ResetPassword/ResetPassword';
import EmailVerification from '../EmailVerification/EmailVerification';
import { FaCheck, FaTimes } from 'react-icons/fa'; // Import check and times icons

interface AuthPageProps {
    onBackClick: () => void;
    onAuthSuccess: (profileCreated: boolean) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onBackClick, onAuthSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(true);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showEmailVerification, setShowEmailVerification] = useState(false);
    const [userId, setUserId] = useState('');

    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [isPasswordLengthValid, setIsPasswordLengthValid] = useState(false);
    const [hasUppercase, setHasUppercase] = useState(false);
    const [hasDigit, setHasDigit] = useState(false);
    const [hasSpecialChar, setHasSpecialChar] = useState(false);

    const [hasTypedUsername, setHasTypedUsername] = useState(false);
    const [hasTypedPassword, setHasTypedPassword] = useState(false);

    const switchAuthMode = () => {
        setIsSignUp(!isSignUp);
        setUsername('');
        setEmail('');
        setPassword('');
        setMessage(null);
        setError(null);
        setHasTypedUsername(false);
        setHasTypedPassword(false);
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            const tokenId = credentialResponse.credential;

            try {
                const backendResponse = await axios.post(
                    'http://localhost:8080/api/Auth/GoogleLogin',
                    { tokenId },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }
                );
                const { token, userId, fullName } = backendResponse.data;
                localStorage.setItem('token', token);
                localStorage.setItem('userId', userId);
                localStorage.setItem('fullName', fullName);

                const profileResponse = await axios.get(
                    'http://localhost:8080/api/Profile/GetProfile',
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        }
                    }
                );
                const userProfile = profileResponse.data;
                localStorage.setItem('userProfilePicture', `${profileResponse.data.profilePictureUrl}`);
                onAuthSuccess(userProfile.createdProfile);
            } catch (error) {
                setError('Google login failed.');
            }
        } else {
            setError('Google login failed.');
        }
    };

    const handleGoogleFailure = () => {
        setError('Google login failed.');
    };

    const goBack = () => {
        onBackClick();
    };

    const handleResetPasswordSuccess = () => {
        setShowResetPassword(false);
        setIsSignUp(false);
    };

    const validateUsername = (username: string): boolean => {
        return username.length >= 5;
    };

    const validatePassword = (password: string): void => {
        setIsPasswordLengthValid(password.length >= 6);
        setHasUppercase(/[A-Z]/.test(password));
        setHasDigit(/\d/.test(password));
        setHasSpecialChar(/[^A-Za-z0-9]/.test(password));
    };

    useEffect(() => {
        if (isSignUp) {
            setIsUsernameValid(validateUsername(username));
            validatePassword(password);
        }
    }, [username, password, isSignUp]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isSignUp && !isUsernameValid) {
            setError("Username must be at least 5 characters long.");
            return;
        }

        if (isSignUp && (!isPasswordLengthValid || !hasUppercase || !hasDigit || !hasSpecialChar)) {
            setError("Password does not meet the required criteria.");
            return;
        }

        const endpoint = isSignUp
            ? 'https://api.anthra.dk/api/Auth/Register'
            : 'https://api.anthra.dk/api/Auth/Login';

        const payload = isSignUp
            ? { username, email, password }
            : { username, password };

        try {
            const response = await axios.post(endpoint, payload);

            if (isSignUp) {
                const { userId, Message } = response.data;
                setUserId(userId);
                setShowEmailVerification(true);
                setMessage(Message);
            } else {
                const { userId, token, fullName } = response.data;
                localStorage.setItem('token', token);
                localStorage.setItem('userId', userId);
                localStorage.setItem('fullName', fullName);

                const profileResponse = await axios.get(
                    'https://api.anthra/api/Profile/GetProfile',
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        }
                    }
                );
                const userProfile = profileResponse.data;
                localStorage.setItem('userProfilePicture', `${profileResponse.data.profilePictureUrl}`);
                onAuthSuccess(userProfile.createdProfile);
            }
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                const errorData = err.response.data;

                if (errorData === 'Email not verified.') {
                    setError('Please verify your email before logging in.');
                } else if (errorData.errors) {
                    setError(errorData.errors[0]);
                } else {
                    setError('An error occurred. Please try again.');
                }
            } else {
                setError('An error occurred. Please try again.');
            }
            setMessage(null);
        }
    };
    const handleForgotPasswordSuccess = () => {
        setShowForgotPassword(false);
        setShowResetPassword(true);
    };


    const handleEmailVerified = () => {
        setShowEmailVerification(false);
        onAuthSuccess(false); // Assuming profile is not created yet
    };

    if (showForgotPassword) {
        return (
            <ForgotPassword
                onBack={() => setShowForgotPassword(false)}
                onResetRequested={handleForgotPasswordSuccess}
            />
        );
    }

    if (showResetPassword) {
        return (
            <ResetPassword onBack={() => setShowResetPassword(false)}
                           onResetSuccess={handleResetPasswordSuccess}
            />
        );
    }

    if (showEmailVerification) {
        return (
            <EmailVerification
                userId={userId}
                onVerified={handleEmailVerified}
                onBack={() => setShowEmailVerification(false)}
            />
        );
    }

    return (
        <div className="auth-page">
            <button className="back-button" onClick={goBack}>
                Back
            </button>
            <div className="auth-content">
                <div className="auth-container">
                    <h2 className="auth-container-h2">{isSignUp ? 'Sign Up' : 'Log In'}</h2>

                    {message && <p className="success-message">{message}</p>}
                    {error && <p className="error-message">{error}</p>}

                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Username"
                            required
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                if (!hasTypedUsername) setHasTypedUsername(true);
                            }}
                            className="auth-input"
                        />
                        {isSignUp && (
                            <input
                                type="email"
                                placeholder="Email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="auth-input"
                            />
                        )}
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (!hasTypedPassword) setHasTypedPassword(true);
                            }}
                            className="auth-input"
                        />
                        <button type="submit" className="submit-button">
                            {isSignUp ? 'Sign Up' : 'Log In'}
                        </button>
                        {!isSignUp && (
                            <p className="auth-container-p">
                                <button
                                    type="button"
                                    className="forgot-password-button"
                                    onClick={() => setShowForgotPassword(true)}
                                >
                                    Forgot Password?
                                </button>
                            </p>
                        )}
                    </form>
                    <div className="social-login">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleFailure}
                        />
                    </div>

                    <p className="auth-container-p">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button className="switch-button" onClick={switchAuthMode}>
                            {isSignUp ? 'Log In' : 'Sign Up'}
                        </button>
                    </p>

                    {/* Validation Checkboxes */}
                    {isSignUp && (
                        <div className="validation-container">
                            {hasTypedPassword || hasTypedUsername && (
                                <div className="w-full border-t border-gray-300 mb-2"></div>
                            )}
                            {/* Username Validation */}
                            {hasTypedUsername && (
                                <p className={`validation-item font-semibold ${isUsernameValid ? 'text-green-400' : 'text-red-400'}`}>
                                    {isUsernameValid ? <FaCheck className="valid-icon" /> : <FaTimes className="invalid-icon" />}
                                    Username is at least 5 characters
                                </p>
                            )}
                            {/* Password Validations */}
                            {hasTypedPassword && (
                                <>
                                    <p className={`validation-item font-semibold ${isPasswordLengthValid ? 'text-green-400' : 'text-red-400'}`}>
                                        {isPasswordLengthValid ? <FaCheck className="valid-icon" /> : <FaTimes className="invalid-icon" />}
                                        Password is at least 6 characters
                                    </p>
                                    <p className={`validation-item font-semibold ${hasUppercase ? 'text-green-400' : 'text-red-400'}`}>
                                        {hasUppercase ? <FaCheck className="valid-icon" /> : <FaTimes className="invalid-icon" />}
                                        Password has at least one uppercase letter
                                    </p>
                                    <p className={`validation-item font-semibold ${hasDigit ? 'text-green-400' : 'text-red-400'}`}>
                                        {hasDigit ? <FaCheck className="valid-icon" /> : <FaTimes className="invalid-icon" />}
                                        Password has at least one digit
                                    </p>
                                    <p className={`validation-item font-semibold ${hasSpecialChar ? 'text-green-400' : 'text-red-400'}`}>
                                        {hasSpecialChar ? <FaCheck className="valid-icon" /> : <FaTimes className="invalid-icon" />}
                                        Password has at least one special character
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <img src="/authimage.png" alt="Authentication Illustration" className="auth-image" />
            </div>
        </div>
    );

};

export default AuthPage;
