// App.tsx
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './LandingPage/components/Navbar/Navbar';
import { LanguageProvider } from './LanguageContext';
import axios from 'axios';
import apiUrl from './config';

// Lazy imports (same as your code)
const Home = lazy(() => import('./LandingPage/components/Home/Home'));
const HowItWorks = lazy(() => import('./LandingPage/components/HowItWorks/HowItWorks'));
const Features = lazy(() => import('./LandingPage/components/Features/Features'));
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
    localStorage.setItem('isDark', 'true')
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

        if (!token || !userId) {
            // Not logged in at all
            setIsAuthenticated(false);
            setLoading(false);
            return;
        }

        // We have a token and userId; let's verify them on the server
        axios
            .get('/Profile/GetProfile', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
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
        return ;
    }
    return (
        <LanguageProvider>
            <Router>
                <div className="App">
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
