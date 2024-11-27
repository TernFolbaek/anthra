import React, {useEffect, useState} from 'react';
import Home from './LandingPage/components/Home/Home';
import HowItWorks from './LandingPage/components/HowItWorks/HowItWorks';
import Features from "./LandingPage/components/Features/Features";
import FAQ from "./LandingPage/components/FAQ/FAQ";
import Contact from "./LandingPage/components/Contact/Contact";
import AuthPage from "./Authentication/AuthPage/AuthPage";
import CreateProfile from './CreateProfile/CreateProfile';
import './App.css';
import Navbar from './LandingPage/components/Navbar/Navbar';
import Main from './Dashboard/Main'; // Placeholder for your main app after logins
import { LanguageProvider } from './LanguageContext';
import DevelopmentTools from "./DevelopmentTools";
import axios from "axios"; // Import the LanguageProvider

const App = () => {
    const [showAuthPage, setShowAuthPage] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [profileCreated, setProfileCreated] = useState(false);

    useEffect(() => {
        const flag = localStorage.getItem('isDark')
        // Ensure the body class reflects the current dark mode setting on load
        if (flag === "true") {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (token && userId) {
            // Optionally, verify token expiration here
            // Fetch the user's profile
            axios.get('http://localhost:5001/api/Profile/GetProfile', {
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
                    // Handle error, possibly invalid token
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
        // Optionally, clear user data from localStorage if needed
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
        <LanguageProvider> {/* Wrap the app in LanguageProvider */}
            <div className="App">
                {isAuthenticated ? (
                    profileCreated ? (
                        // User is authenticated and profile is created
                        <Main />
                    ) : (
                        // User is authenticated but profile is not created
                        <CreateProfile   onBackClick={handleCreateProfileBackClick}  onProfileCreated={handleProfileCreated} />
                    )
                ) : (
                    showAuthPage ? (
                        <AuthPage onBackClick={handleBackClick} onAuthSuccess={handleAuthSuccess} />
                    ) : (
                        <div>
                            <Navbar onGetStartedClick={handleGetStartedClick} />
                            <div id="home">
                                <Home onGetStartedClick={handleGetStartedClick}  />
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
                )}
            </div>
        </LanguageProvider>
    );
};

export default App;
