import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './LandingPage/components/Navbar/Navbar';
import { LanguageProvider } from './LanguageContext';
import axios from 'axios';
import apiUrl from './config';

// Lazy imports
const Home = lazy(() => import('./LandingPage/components/Home/Home'));
const HowItWorks = lazy(() => import('./LandingPage/components/HowItWorks/HowItWorks'));
const FAQ = lazy(() => import('./LandingPage/components/FAQ/FAQ'));
const Contact = lazy(() => import('./LandingPage/components/Contact/Contact'));
const AuthPage = lazy(() => import('./Authentication/AuthPage/AuthPage'));
const CreateProfile = lazy(() => import('./CreateProfile/CreateProfile'));
const Main = lazy(() => import('./Dashboard/Main'));
const DevelopmentTools = lazy(() => import('./DevelopmentTools'));
const PrivacyPolicy = lazy(() => import('./Privacy/PrivacyPolicy'));

axios.defaults.withCredentials = true;
axios.defaults.baseURL = apiUrl;

const App: React.FC = () => {
    const [showAuthPage, setShowAuthPage] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [profileCreated, setProfileCreated] = useState(false);
    const [loading, setLoading] = useState(true);

    // State to control the mobile disclaimer modal
    const [showMobileDisclaimer, setShowMobileDisclaimer] = useState(false);

    // Set dark mode flag and update body class accordingly
    localStorage.setItem('isDark', 'true');
    useEffect(() => {
        const flag = localStorage.getItem('isDark');
        if (flag === 'true') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, []);

    // Verify the token and user on load
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
            // Not logged in
            setIsAuthenticated(false);
            setLoading(false);
            return;
        }

        axios
            .get('/Profile/GetProfile', {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => {
                const userProfile = response.data;
                setIsAuthenticated(true);
                setProfileCreated(userProfile.createdProfile);
            })
            .catch(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                setIsAuthenticated(false);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // Check for mobile devices and if no flag exists, show the disclaimer.
    useEffect(() => {
        const isMobile = window.innerWidth < 768; // adjust threshold as needed
        if (isMobile) {
            const isFirstLoadMobile = localStorage.getItem('isFirstLoadMobile');
            if (!isFirstLoadMobile) {
                setShowMobileDisclaimer(true);
            }
        }
    }, []);

    // Handler for closing the mobile disclaimer
    const handleCloseMobileDisclaimer = () => {
        setShowMobileDisclaimer(false);
        // Store a flag so the disclaimer won't show again on mobile
        localStorage.setItem('isFirstLoadMobile', 'dismissed');
    };

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

    if (loading) {
        return null;
    }

    return (
        <LanguageProvider>
            <Router>
                <div className="App">
                    {/* Mobile Disclaimer Modal */}
                    {showMobileDisclaimer && (
                        <div
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 1000,
                            }}
                        >
                            <div
                                className="tw-full rounded-xl h-1/3 dark-background-generic z-100 m-2 p-3 flex flex-col items-center justify-around"
                            >
                                <p className="text-lg text-gray-200 font-medium text-center font-mono">
                                    This application is visually designed for desktop use, however our team is working on
                                    making it as comfortable as possible on mobile as well :)
                                </p>
                                <button
                                    onClick={handleCloseMobileDisclaimer}
                                    className="text-center px-3 py-1 text-gray-100 dark-background-light-generic rounded font-mono"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    <Suspense fallback={<div></div>}>
                        <Routes>
                            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                            <Route
                                path="/create-profile/*"
                                element={
                                    isAuthenticated ? (
                                        profileCreated ? (
                                            <Navigate to="/dashboard" />
                                        ) : (
                                            <CreateProfile
                                                onBackClick={handleCreateProfileBackClick}
                                                onProfileCreated={handleProfileCreated}
                                            />
                                        )
                                    ) : (
                                        <Navigate to="/" />
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
                                    ) : showAuthPage ? (
                                        <AuthPage onBackClick={handleBackClick} onAuthSuccess={handleAuthSuccess} />
                                    ) : (
                                        <div>
                                            <Navbar onGetStartedClick={handleGetStartedClick} />
                                            <div id="home">
                                                <Home onGetStartedClick={handleGetStartedClick} />
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
                                }
                            />

                            <Route
                                path="/"
                                element={
                                    showAuthPage ? (
                                        <AuthPage onBackClick={handleBackClick} onAuthSuccess={handleAuthSuccess} />
                                    ) : (
                                        <div>
                                            <Navbar onGetStartedClick={handleGetStartedClick} />
                                            <div id="home">
                                                <Home onGetStartedClick={handleGetStartedClick} />
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
                                }
                            />
                        </Routes>
                    </Suspense>
                </div>
            </Router>
        </LanguageProvider>
    );
};

export default App;
