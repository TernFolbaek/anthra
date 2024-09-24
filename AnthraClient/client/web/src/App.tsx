import React, { useState } from 'react';
import Home from './LandingPage/components/Home/Home';
import HowItWorks from './LandingPage/components/HowItWorks/HowItWorks';
import Features from "./LandingPage/components/Features/Features";
import FAQ from "./LandingPage/components/FAQ/FAQ";
import Contact from "./LandingPage/components/Contact/Contact";
import AuthPage from "./Authentication/AuthPage";
import CreateProfile from './CreateProfile/CreateProfile';
import './App.css';
import Navbar from './LandingPage/components/Navbar/Navbar';
import Main from './Dashboard/Main'; // Placeholder for your main app after logins
import { LanguageProvider } from './LanguageContext'; // Import the LanguageProvider

const App = () => {
    const [showAuthPage, setShowAuthPage] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [profileCreated, setProfileCreated] = useState(false);

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
                        <CreateProfile onProfileCreated={handleProfileCreated} />
                    )
                ) : (
                    showAuthPage ? (
                        <AuthPage onBackClick={handleBackClick} onAuthSuccess={handleAuthSuccess} />
                    ) : (
                        <div>
                            <Navbar onGetStartedClick={handleGetStartedClick} />
                            <div id="home">
                                <Home />
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
                        </div>
                    )
                )}
            </div>
        </LanguageProvider>
    );
};

export default App;
