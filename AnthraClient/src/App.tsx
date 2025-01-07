// App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './LandingPage/components/Home/Home';
import HowItWorks from './LandingPage/components/HowItWorks/HowItWorks';
import Features from './LandingPage/components/Features/Features';
import FAQ from './LandingPage/components/FAQ/FAQ';
import Contact from './LandingPage/components/Contact/Contact';
import AuthPage from './Authentication/AuthPage/AuthPage';
import CreateProfile from './CreateProfile/CreateProfile';
import './App.css';
import Navbar from './LandingPage/components/Navbar/Navbar';
import Main from './Dashboard/Main';
import { LanguageProvider } from './LanguageContext';
import DevelopmentTools from './DevelopmentTools';
import axios from 'axios';
import PrivacyPolicy from './Privacy/PrivacyPolicy';

const App = () => {
    const [showAuthPage, setShowAuthPage] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [profileCreated, setProfileCreated] = useState(false);

    useEffect(() => {
        const flag = localStorage.getItem('isDark');
        if (flag === 'true') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (token && userId) {
            axios
                .get('https://api.anthra.dk/api/Profile/GetProfile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                .then(response => {
                    const userProfile = response.data;
                    setIsAuthenticated(true);
                    setProfileCreated(userProfile.createdProfile);
                })
                .catch(error => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userId');
                    setIsAuthenticated(false);
                });
        }
    }, []);

    const handleCreateProfileBackClick = () => {
        setIsAuthenticated(false);
        setShowAuthPage(false);
        setProfileCreated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('fullName');
        localStorage.removeItem('userProfilePicture');
    };

    const handleGetStartedClick = () => {
        setShowAuthPage(true);
    };

    const handleBackClick = () => {
        setShowAuthPage(false);
    };

    const handleAuthSuccess = (userProfileCreated: boolean) => {
        setIsAuthenticated(true);
        setProfileCreated(userProfileCreated);
    };

    const handleProfileCreated = () => {
        setProfileCreated(true);
    };

    return (
        <LanguageProvider>
            <Router>
                <div className="App">
                    <Routes>
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route
                            path="/create-profile/*"
                            element={
                                isAuthenticated ? (
                                    profileCreated ? (
                                        <Navigate to="/dashboard" replace />
                                    ) : (
                                        <CreateProfile
                                            onBackClick={handleCreateProfileBackClick}
                                            onProfileCreated={handleProfileCreated}
                                        />
                                    )
                                ) : (
                                    <Navigate to="/" replace />
                                )
                            }
                        />
                        <Route
                            path="/dashboard/*"
                            element={
                                isAuthenticated ? (
                                    profileCreated ? (
                                        <Main />
                                    ) : (
                                        <CreateProfile
                                            onBackClick={handleCreateProfileBackClick}
                                            onProfileCreated={handleProfileCreated}
                                        />
                                    )
                                ) : (
                                    showAuthPage ? (
                                        <AuthPage onBackClick={handleBackClick} onAuthSuccess={handleAuthSuccess} />
                                    ) : (
                                        <div>
                                            <Navbar onGetStartedClick={handleGetStartedClick} />
                                            <div id="home">
                                                <Home onGetStartedClick={handleGetStartedClick} />
                                            </div>
                                            <div id="features">
                                                <Features />
                                            </div>
                                            <div id="how-it-works">
                                                <HowItWorks />
                                            </div>
                                            <div id="faq">
                                                <FAQ />
                                            </div>
                                            <div id="contact">
                                                <Contact />
                                            </div>
                                            {process.env.NODE_ENV === 'development' && <DevelopmentTools />}
                                        </div>
                                    )
                                )
                            }
                        />
                        <Route
                            path="/"
                            element={
                                isAuthenticated ? (
                                    profileCreated ? (
                                        <Main />
                                    ) : (
                                        <Navigate to="/create-profile" replace />
                                    )
                                ) : (
                                    showAuthPage ? (
                                        <AuthPage onBackClick={handleBackClick} onAuthSuccess={handleAuthSuccess} />
                                    ) : (
                                        <div>
                                            <Navbar onGetStartedClick={handleGetStartedClick} />
                                            <div id="home">
                                                <Home onGetStartedClick={handleGetStartedClick} />
                                            </div>
                                            <div id="features">
                                                <Features />
                                            </div>
                                            <div id="how-it-works">
                                                <HowItWorks />
                                            </div>
                                            <div id="faq">
                                                <FAQ />
                                            </div>
                                            <div id="contact">
                                                <Contact />
                                            </div>
                                            {process.env.NODE_ENV === 'development' && <DevelopmentTools />}
                                        </div>
                                    )
                                )
                            }
                        />
                    </Routes>
                </div>
            </Router>
        </LanguageProvider>
    );
};

export default App;
