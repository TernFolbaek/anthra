import './AuthPage.css';
import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {GoogleLogin, CredentialResponse} from '@react-oauth/google';
import {useRive, useStateMachineInput} from '@rive-app/react-canvas';
import ForgotPassword from '../ForgotPassword/ForgotPassword';
import ResetPassword from '../ResetPassword/ResetPassword';

interface AuthPageProps {
    onBackClick: () => void;
    onAuthSuccess: (profileCreated: boolean) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({onBackClick, onAuthSuccess}) => {
    const [isSignUp, setIsSignUp] = useState(true);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const switchAuthMode = () => {
        setIsSignUp(!isSignUp);
        setUsername('');
        setEmail('');
        setPassword('');
        setMessage(null);
        setError(null);
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            const tokenId = credentialResponse.credential;

            try {
                const backendResponse = await axios.post(
                    'http://localhost:5001/api/Auth/GoogleLogin',
                    {tokenId},
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }
                );
                const {token, userId, fullName} = backendResponse.data;
                localStorage.setItem('token', token);
                localStorage.setItem('userId', userId);
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const endpoint = isSignUp
            ? 'http://localhost:5001/api/Auth/Register'
            : 'http://localhost:5001/api/Auth/Login';

        const payload = isSignUp
            ? {username, email, password}
            : {username, password};

        try {
            const response = await axios.post(endpoint, payload);
            const {userId, token, fullName} = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);
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
            triggerSuccess();
            onAuthSuccess(userProfile.createdProfile);
        } catch (err: any) {
            triggerFail();
            if (err.response && err.response.data) {
                const errorData = err.response.data;
                setError(
                    errorData.Message ||
                    Object.values(errorData.errors || {}).join(' ') ||
                    'An error occurred'
                );
            } else {
                setError('An error occurred. Please try again.');
            }
            setMessage(null);
        }
    };

    const STATE_MACHINE_NAME = 'State Machine 1';
    const {rive, RiveComponent} = useRive({
        src: '/rive/520-990-teddy-login-screen.riv',
        autoplay: true,
        stateMachines: STATE_MACHINE_NAME,
    });
    useEffect(() => {
        setLook();
    }, [username]);

    const stateSuccess = useStateMachineInput(rive, STATE_MACHINE_NAME, 'success');
    const stateFail = useStateMachineInput(rive, STATE_MACHINE_NAME, 'fail');
    const stateHandUp = useStateMachineInput(rive, STATE_MACHINE_NAME, 'hands_up');
    const stateCheck = useStateMachineInput(rive, STATE_MACHINE_NAME, 'Check');
    const stateLook = useStateMachineInput(rive, STATE_MACHINE_NAME, 'Look');

    const triggerSuccess = () => {
        stateSuccess && stateSuccess.fire();
    };
    const triggerFail = () => {
        stateFail && stateFail.fire();
    };

    const setHangUp = (hangUp: any) => {
        stateHandUp && (stateHandUp.value = hangUp);
    };

    const setLook = () => {
        if (!stateLook || !stateCheck || !setHangUp) {
            return;
        }
        setHangUp(false);
        setCheck(true);
        let nbChars = 0;
        if (username) {
            nbChars = username.split('').length;
        }
        let ratio = nbChars / parseFloat('41');
        let lookToSet = ratio * 100 - 25;
        stateLook.value = Math.round(lookToSet);
    };
    const setCheck = (check: any) => {
        if (stateCheck) {
            stateCheck.value = check;
        }
    };

    const handleForgotPasswordSuccess = () => {
        setShowForgotPassword(false);
        setShowResetPassword(true);
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

    return (
        <div className="auth-page">
            <button className="back-button" onClick={goBack}>
                Back
            </button>
            <div>
                <RiveComponent className="teddy-bear-rive"/>
            </div>
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
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    {isSignUp && (
                        <input
                            type="email"
                            placeholder="Email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    )}
                    <input
                        type="password"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setHangUp(true);
                        }}
                    />
                    <button type="submit" className="submit-button">
                        {isSignUp ? 'Sign Up' : 'Log In'}
                    </button>
                    {!isSignUp && (
                        <p className="auth-container-p">
                            <button
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
            </div>
        </div>
    );
};

export default AuthPage;
