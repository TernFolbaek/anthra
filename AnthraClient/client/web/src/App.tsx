import React, {useEffect, useState} from 'react';
import Home from './LandingPage/components/Home/Home';
import HowItWorks from './LandingPage/components/HowItWorks/HowItWorks';
import Features from "./LandingPage/components/Features/Features";
import FAQ from "./LandingPage/components/FAQ/FAQ";
import Contact from "./LandingPage/components/Contact/Contact";
import AuthPage from "./Authentication/AuthPage";
import './App.css';
import Navbar from './LandingPage/components/Navbar/Navbar';

const App = () => {
    const [showAuthPage, setShowAuthPage] = useState(false);

    const handleGetStartedClick = () => {
        setShowAuthPage(true);
    };

    const handleBackClick = () => {
        setShowAuthPage(false);
    };
    return (
        <div className="App">
            {showAuthPage ? (
                <AuthPage onBackClick={handleBackClick} />
            ) : (
                <div>
                    <Navbar onGetStartedClick={handleGetStartedClick}  />
            <div id="home">
            <Home/>
            </div>
            <div id="features">
                <Features/>
            </div>
            <div id="how-it-works">
                <HowItWorks/>
            </div>
            <div id="faq">
                <FAQ/>
            </div>
            <div id="contact">
                <Contact/>
            </div>
                </div>
                )}
        </div>
    );
}

export default App;
