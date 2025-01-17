import './AuthPage.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import ForgotPassword from '../ForgotPassword/ForgotPassword';
import ResetPassword from '../ResetPassword/ResetPassword';
import EmailVerification from '../EmailVerification/EmailVerification';
import { FaCheck, FaTimes } from 'react-icons/fa';
import {useNavigate} from "react-router-dom";

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
    const navigate = useNavigate();
    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [isPasswordLengthValid, setIsPasswordLengthValid] = useState(false);
    const [hasUppercase, setHasUppercase] = useState(false);
    const [hasDigit, setHasDigit] = useState(false);
    const [hasSpecialChar, setHasSpecialChar] = useState(false);

    const [hasTypedUsername, setHasTypedUsername] = useState(false);
    const [hasTypedPassword, setHasTypedPassword] = useState(false);

    // State to check if the screen is mobile
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

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
                    '/Auth/GoogleLogin',
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
                    '/Profile/GetProfile',
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        }
                    }
                );
                const userProfile = profileResponse.data;
                localStorage.setItem('userProfilePicture', profileResponse.data.profilePictureUrl);
                onAuthSuccess(userProfile.createdProfile);
                navigate('/create-profile');
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
            ? '/Auth/Register'
            : '/Auth/Login';

        const payload = isSignUp
            ? { username, email, password }
            : { username, password };

        try {
            const response = await axios.post(endpoint, payload, { withCredentials: true });

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
                    '/Profile/GetProfile',
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        }
                    }
                );
                const userProfile = profileResponse.data;
                localStorage.setItem('userProfilePicture', profileResponse.data.profilePictureUrl);
                onAuthSuccess(userProfile.createdProfile);
                navigate('/create-profile');
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
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            event.preventDefault();
            onBackClick();
        };

        // Only add the event listener on mobile
        if (isMobile) {
            window.addEventListener('popstate', handlePopState);
        }

        return () => {
            if (isMobile) {
                window.removeEventListener('popstate', handlePopState);
            }
        };
    }, [isMobile, onBackClick]);

    const handleForgotPasswordSuccess = () => {
        setShowForgotPassword(false);
        setShowResetPassword(true);
    };

    const handleEmailVerified = () => {
        setShowEmailVerification(false);
        onAuthSuccess(false);
    };

    // Update isMobile state on window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    const UsernameValidation = ({ isMobile }: { isMobile: boolean }) => (
        hasTypedUsername && (
            <div className={`validation-wrapper ${isMobile ? 'mobile-validation' : ''}`}>
                <p className={`validation-item text-xs font-semibold ${isUsernameValid ? 'text-green-400' : 'text-red-400'}`}>
                    {isUsernameValid ? <FaCheck className="valid-icon" /> : <FaTimes className="invalid-icon" />}
                    Username is at least 5 characters
                </p>
            </div>
        )
    );

    const PasswordValidation = ({ isMobile }: { isMobile: boolean }) => (
        hasTypedPassword && (
            <div className={`validation-wrapper ${isMobile ? 'mobile-validation' : ''}`}>
                <p className={`validation-item text-xs font-semibold ${isPasswordLengthValid ? 'text-green-400' : 'text-red-400'}`}>
                    {isPasswordLengthValid ? <FaCheck className="valid-icon" /> : <FaTimes className="invalid-icon" />}
                    At least 6 characters
                </p>
                <p className={`validation-item text-xs font-semibold ${hasUppercase ? 'text-green-400' : 'text-red-400'}`}>
                    {hasUppercase ? <FaCheck className="valid-icon" /> : <FaTimes className="invalid-icon" />}
                    One uppercase letter
                </p>
                <p className={`validation-item text-xs font-semibold ${hasDigit ? 'text-green-400' : 'text-red-400'}`}>
                    {hasDigit ? <FaCheck className="valid-icon" /> : <FaTimes className="invalid-icon" />}
                    One digit
                </p>
                <p className={`validation-item text-xs font-semibold ${hasSpecialChar ? 'text-green-400' : 'text-red-400'}`}>
                    {hasSpecialChar ? <FaCheck className="valid-icon" /> : <FaTimes className="invalid-icon" />}
                    One special character
                </p>
            </div>
        )
    );

    return (
        <div className="auth-page">
            <button className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 font-semibold text-sm text-gray-300 absolute top-4 left-4" onClick={goBack}>
                Back
            </button>
            <div className="auth-content">
                <div className="auth-container">
                    <h2 className="auth-container-h2 text-gray-100">{isSignUp ? 'Sign Up' : 'Log In'}</h2>

                    {message && <p className="success-message">{message}</p>}
                    {error && <p className="text-sm font-medium text-white">{error}</p>}

                    <form onSubmit={handleSubmit}>
                        {isMobile && isSignUp && <UsernameValidation isMobile={isMobile} />}
                        <input
                            type="text"
                            placeholder="E-mail"
                            required
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                if (!hasTypedUsername) setHasTypedUsername(true);
                            }}
                            className="text-white auth-input px-3 py-2 focus:ring-emerald-50 border border-gray-600 focus:ring-2 rounded-lg bg-gray-700/50"
                        />

                        {isSignUp && (
                            <input
                                type="email"
                                placeholder="Email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="text-white auth-input px-3 py-2 focus:ring-emerald-50 border border-gray-600 focus:ring-2 rounded-lg bg-gray-700/50"
                            />
                        )}

                        {isMobile && isSignUp && <PasswordValidation isMobile={isMobile} />}
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (!hasTypedPassword) setHasTypedPassword(true);
                            }}
                            className="text-white auth-input px-3 py-2 focus:ring-emerald-50 border border-gray-600 focus:ring-2 rounded-lg bg-gray-700/50"
                        />

                        <button type="submit" className="text-gray-900 bg-emerald-500 w-full px-3 py-2 rounded-lg font-semibold hover:bg-emerald-400 transform hover:scale-105">
                            {isSignUp ? 'Sign Up' : 'Log In'}
                        </button>

                        {!isSignUp && (
                            <p className="auth-container-p">
                                <button
                                    type="button"
                                    className="forgot-password-button hover:underline text-gray-400"
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

                    <p className="auth-container-p text-gray-400">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button className="switch-button hover:underline text-emerald-400" onClick={switchAuthMode}>
                            {isSignUp ? 'Log In' : 'Sign Up'}
                        </button>
                    </p>

                    {/* Desktop Validation Display */}
                    {!isMobile && isSignUp && (
                        <div className="validation-container">
                            {(hasTypedPassword || hasTypedUsername) && (
                                <div className="w-full border-t border-gray-300 mb-2"></div>
                            )}
                            <UsernameValidation isMobile={isMobile} />
                            <PasswordValidation isMobile={isMobile} />
                        </div>
                    )}
                </div>
                <img src="/authimage.png" alt="Authentication Illustration" className="auth-image" />
            </div>
        </div>
    );
};

export default AuthPage;
