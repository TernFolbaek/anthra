import './AuthPage.css';
import React, { useState } from 'react';
import axios from 'axios';

interface AuthPageProps {
    onBackClick: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onBackClick }) => {
    const [isSignUp, setIsSignUp] = useState(true);
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

    const goBack = () => {
        onBackClick();
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const   endpoint = isSignUp
            ? 'http://localhost:5001/api/Auth/Register'
            : 'http://localhost:5001/api/Auth/Login';

        const payload = isSignUp
            ? { username, email, password }
            : { email, password };

        try {
            const response = await axios.post(endpoint, payload);

            setMessage(response.data.message || 'Success!');
            setError(null);
        } catch (err: any) {
            if (err.response && err.response.data) {
                // Backend returned an error
                const errorData = err.response.data;
                setError(
                    errorData.Message ||
                    Object.values(errorData.errors || {}).join(' ') ||
                    'An error occurred'
                );
            } else {
                // Network or other error
                setError('An error occurred. Please try again.');
            }
            setMessage(null);
        }
    };

    return (
        <div className="auth-page">
            <button className="back-button" onClick={goBack}>
                Back
            </button>
            <div className="auth-container">
                <h2>{isSignUp ? 'Sign Up' : 'Log In'}</h2>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>
                    {isSignUp && (
                        <input
                            type="text"
                            placeholder="Username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="submit-button">
                        {isSignUp ? 'Sign Up' : 'Log In'}
                    </button>
                </form>
                <p>
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