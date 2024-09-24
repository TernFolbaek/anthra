import React, { useState, useEffect } from 'react';
import './Navbar.css';
import './Logo.css';

interface NavbarProps {
    onGetStartedClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onGetStartedClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        if (isMenuOpen) {
            setIsMenuOpen(false);
        }
    };

    return (
        <nav className="home-navbar flex">
            <div className="logo flex" onClick={() => scrollToSection('home')}>
                <ul className="mr-5">
                    <li className="animate h-1"></li>
                    <li className="animate h-1"></li>
                    <li className="animate h-1"></li>
                </ul>
                <h1 id="logo-title" className="animate e">Anthra</h1>
            </div>
            {isMobile ? (
                <>
                    <div className="burger-menu" onClick={toggleMenu}>
                        <div className={`burger-bar ${isMenuOpen ? 'open' : ''}`}></div>
                        <div className={`burger-bar ${isMenuOpen ? 'open' : ''}`}></div>
                        <div className={`burger-bar ${isMenuOpen ? 'open' : ''}`}></div>
                    </div>
                    <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
                        <button
                            className="nav-button animate"
                            onClick={() => scrollToSection('how-it-works')}
                        >
                            How It Works
                        </button>
                        <button
                            className="nav-button animate"
                            onClick={() => scrollToSection('features')}
                        >
                            Features
                        </button>
                        <button
                            className="nav-button animate"
                            onClick={() => scrollToSection('faq')}
                        >
                            FAQ
                        </button>
                        <button
                            className="nav-button animate"
                            onClick={() => scrollToSection('contact')}
                        >
                            Contact
                        </button>
                        <button
                            className="nav-button animate"
                            onClick={onGetStartedClick}
                        >
                            Get Started
                        </button>
                    </div>
                </>
            ) : (
                <div className="nav-buttons flex animate-nav-buttons">
                    <button
                        className="nav-button animate"
                        onClick={() => scrollToSection('features')}
                    >
                        Features
                    </button>
                    <button
                        className="nav-button animate"
                        onClick={() => scrollToSection('how-it-works')}
                    >
                        How It Works
                    </button>
                    <button
                        className="nav-button animate"
                        onClick={() => scrollToSection('faq')}
                    >
                        FAQ
                    </button>
                    <button
                        className="nav-button animate"
                        onClick={() => scrollToSection('contact')}
                    >
                        Contact
                    </button>
                    <button
                        className="nav-button animate"
                        onClick={onGetStartedClick}
                    >
                        Get Started
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
