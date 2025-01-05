import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Home from './LandingPage/components/Home/Home';
import HowItWorks from './LandingPage/components/HowItWorks/HowItWorks';
import Features from './LandingPage/components/Features/Features';
import FAQ from './LandingPage/components/FAQ/FAQ';
import Contact from './LandingPage/components/Contact/Contact';
import AuthPage from './Authentication/AuthPage/AuthPage';
import CreateProfile from './CreateProfile/CreateProfile';
import Navbar from './LandingPage/components/Navbar/Navbar';
import Main from './Dashboard/Main';
import { LanguageProvider } from './LanguageContext';
import DevelopmentTools from './DevelopmentTools';
import PrivacyPolicy from './Privacy/PrivacyPolicy';

const App = () => {
    const [showAuthPage, setShowAuthPage] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [profileCreated, setProfileCreated] = useState(false);
    const navigate = useNavigate();

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
            axios.get('https://api.anthra.dk/api/Profile/GetProfile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
                .then(response => {
                    const userProfile = response.data;
                    setIsAuthenticated(true);
                    setProfileCreated(userProfile.createdProfile);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userId');
                    setIsAuthenticated(false);
                });
        }
    }, []);

    const handleAuthSuccess = (userProfileCreated: boolean) => {
        setIsAuthenticated(true);
        setProfileCreated(userProfileCreated);
    };

    const handleCreateProfileBackClick = () => {
        setIsAuthenticated(false);
        setShowAuthPage(false);
        setProfileCreated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
    };

    const handleGetStartedClick = () => {
        setShowAuthPage(true);
    };

    const handleBackClick = () => {
        setShowAuthPage(false);
    };

    // Listen to history changes and navigate back to home page if needed
    useEffect(() => {
        const handlePopState = () => {
            if (!isAuthenticated) {
                navigate('/');  // Redirect to the home page on back button click
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isAuthenticated, navigate]);

    return (
        <LanguageProvider>
            <Router>
                <div className="App">
                    <Routes>
                        <Route
                            path="/privacy-policy"
                            element={<PrivacyPolicy />}
                        />
                        <Route
                            path="/"
                            element={
                                isAuthenticated ? (
                                    profileCreated ? (
                                        <Main />
                                    ) : (
                                        <CreateProfile onBackClick={handleCreateProfileBackClick} onProfileCreated={() => setProfileCreated(true)} />
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
