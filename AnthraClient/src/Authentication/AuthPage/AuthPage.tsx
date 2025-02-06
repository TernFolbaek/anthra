import './AuthPage.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import ForgotPassword from '../ForgotPassword/ForgotPassword';
import ResetPassword from '../ResetPassword/ResetPassword';
import EmailVerification from '../EmailVerification/EmailVerification';
import {FaCheck, FaHouseUser, FaTimes} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface AuthPageProps {
    onBackClick: () => void;
    onAuthSuccess: (profileCreated: boolean) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onBackClick, onAuthSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(true);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);

    // Form fields
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');

    // UI and validation states
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showEmailVerification, setShowEmailVerification] = useState(false);
    const [userId, setUserId] = useState('');
    const navigate = useNavigate();

    // Password validation states
    const [isPasswordLengthValid, setIsPasswordLengthValid] = useState(false);
    const [hasUppercase, setHasUppercase] = useState(false);
    const [hasDigit, setHasDigit] = useState(false);
    const [hasSpecialChar, setHasSpecialChar] = useState(false);

    // Track whether user has begun typing in fields (for showing validations)
    const [hasTypedPassword, setHasTypedPassword] = useState(false);

    // Check if the screen is mobile
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

    const switchAuthMode = () => {
        setIsSignUp(!isSignUp);
        setEmail('');
        setConfirmEmail('');
        setPassword('');
        setMessage(null);
        setError(null);
        setHasTypedPassword(false);
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            const tokenId = credentialResponse.credential;
            try {
                const backendResponse = await axios.post(
                    '/Auth/GoogleLogin',
                    { tokenId },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                const { token, userId, fullName } = backendResponse.data;
                localStorage.setItem('token', token);
                localStorage.setItem('userId', userId);
                localStorage.setItem('fullName', fullName);

                // Load the user profile
                const profileResponse = await axios.get('/Profile/GetProfile', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const userProfile = profileResponse.data;
                localStorage.setItem('userProfilePicture', userProfile.profilePictureUrl);
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

    const handleForgotPasswordSuccess = () => {
        setShowForgotPassword(false);
        setShowResetPassword(true);
    };

    const handleResetPasswordSuccess = () => {
        setShowResetPassword(false);
        setIsSignUp(false);
    };

    const handleEmailVerified = () => {
        setShowEmailVerification(false);
        onAuthSuccess(false);
    };

    const validatePassword = (password: string): void => {
        setIsPasswordLengthValid(password.length >= 6);
    };

    useEffect(() => {
        if (isSignUp) {
            validatePassword(password);
        }
    }, [email,password, isSignUp]);

    // Handle sign-up / login
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        // If signing up, check all validations first
        if (isSignUp) {

            // 2) Check password validations
            if (!isPasswordLengthValid ) {
                setError('Password does not meet the required criteria.');
                return;
            }
            // 3) Check if email matches confirm email
            if (email !== confirmEmail) {
                setError('Email and Confirm Email do not match.');
                return;
            }
        }

        const endpoint = isSignUp ? '/Auth/Register' : '/Auth/Login';
        const payload = isSignUp
            ? { email, password }
            : { email, password };

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

                // Load user profile
                const profileResponse = await axios.get('/Profile/GetProfile', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const userProfile = profileResponse.data;
                localStorage.setItem('userProfilePicture', userProfile.profilePictureUrl);
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

    // Handle mobile 'back' hardware button
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            event.preventDefault();
            onBackClick();
        };

        if (isMobile) {
            window.addEventListener('popstate', handlePopState);
        }
        return () => {
            if (isMobile) {
                window.removeEventListener('popstate', handlePopState);
            }
        };
    }, [isMobile, onBackClick]);

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
            <ResetPassword onBack={() => setShowResetPassword(false)} onResetSuccess={handleResetPasswordSuccess} />
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

    // Small helper component for password tips
    const PasswordValidation = ({ isMobile }: { isMobile: boolean }) => (
        hasTypedPassword && (
            <div className={`validation-wrapper ${isMobile ? 'mobile-validation' : ''}`}>
                <p
                    className={`validation-item text-xs font-semibold ${
                        isPasswordLengthValid ? 'text-green-400' : 'text-red-400'
                    }`}
                >
                    {isPasswordLengthValid ? <FaCheck className="valid-icon" /> : <FaTimes className="invalid-icon" />}
                    At least 6 characters
                </p>
            </div>
        )
    );

    return (
        <div className="auth-page">
            <button
                className=" font-semibold text-sm text-gray-300 absolute top-4 left-4"
                onClick={goBack}
            >
                <FaHouseUser size={24}/>
            </button>
            <div className="auth-content">
                <div className="auth-container">
                    <h2 className="auth-container-h2 text-gray-100">{isSignUp ? 'Sign Up' : 'Log In'}</h2>

                    {message && <p className="success-message">{message}</p>}
                    {error && <p className="text-sm font-medium text-white">{error}</p>}

                    <form onSubmit={handleSubmit}>
                        {isSignUp ? (
                            <>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="text-white auth-input px-3 py-2 focus:ring-emerald-50 border border-gray-600 focus:ring-2 rounded-lg bg-gray-700/50"
                                />
                                <input
                                    type="email"
                                    placeholder="Confirm Email"
                                    required
                                    value={confirmEmail}
                                    onChange={(e) => setConfirmEmail(e.target.value)}
                                    className="text-white auth-input px-3 py-2 focus:ring-emerald-50 border border-gray-600 focus:ring-2 rounded-lg bg-gray-700/50"
                                />
                            </>
                        ) : (
                            <input
                                type="text"
                                placeholder="Email"
                                required
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                }}
                                className="text-white auth-input px-3 py-2 focus:ring-emerald-50 border border-gray-600 focus:ring-2 rounded-lg bg-gray-700/50"
                            />
                        )}

                        {/* Mobile-First Password Validation Tips (when user starts typing) */}
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

                        <button
                            type="submit"
                            className="text-white bg-emerald-500 w-full px-3 py-2 rounded-lg font-semibold hover:bg-emerald-400 transform hover:scale-105"
                        >
                            {isSignUp ? 'Sign Up' : 'Log In'}
                        </button>

                        {/* Forgot Password Link (login only) */}
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

                    {/* Social login (Google, etc.) */}
                    <div className="social-login">
                        <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleFailure} />
                    </div>

                    {/* Toggle sign-up / login */}
                    <p className="auth-container-p text-gray-400">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button className="switch-button hover:underline text-emerald-400" onClick={switchAuthMode}>
                            {isSignUp ? 'Log In' : 'Sign Up'}
                        </button>
                    </p>

                    {/* Desktop Validation Tips */}
                    {!isMobile && isSignUp && (
                        <div className="validation-container">
                            {(hasTypedPassword) && <div className="w-full border-t border-gray-300 mb-2"></div>}
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
