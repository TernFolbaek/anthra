import React, { useState, useEffect } from 'react';
import './Navbar.css';
import './Logo.css';
import { useLanguage } from '../../../LanguageContext';
import navbarTranslations from '../../../languages/navbarTranslations.json';

interface NavbarProps {
    onGetStartedClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onGetStartedClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { language, switchLanguage } = useLanguage(); // Hook to get and switch language
    const t = navbarTranslations[language as keyof typeof navbarTranslations]; // Get the current language translation

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
            <div className="language-dropdown" style={{position: 'relative', marginLeft: 'auto'}}>
                <select value={language} onChange={(e) => switchLanguage(e.target.value)}>
                    <option value="da">Dansk</option>
                    <option value="en">English</option>
                </select>
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
                            {t.howItWorks}
                        </button>
                        <button
                            className="nav-button animate"
                            onClick={() => scrollToSection('features')}
                        >
                            {t.features}
                        </button>
                        <button
                            className="nav-button animate"
                            onClick={() => scrollToSection('faq')}
                        >
                            {t.faq}
                        </button>
                        <button
                            className="nav-button animate"
                            onClick={() => scrollToSection('contact')}
                        >
                            {t.contact}
                        </button>
                        <button
                            className="nav-button animate"
                            onClick={onGetStartedClick}
                        >
                            {t.getStarted}
                        </button>
                    </div>
                </>
            ) : (
                <div className="nav-buttons flex animate-nav-buttons">
                    <button
                        className="nav-button animate"
                        onClick={() => scrollToSection('features')}
                    >
                        {t.features}
                    </button>
                    <button
                        className="nav-button animate"
                        onClick={() => scrollToSection('how-it-works')}
                    >
                        {t.howItWorks}
                    </button>
                    <button
                        className="nav-button animate"
                        onClick={() => scrollToSection('faq')}
                    >
                        {t.faq}
                    </button>
                    <button
                        className="nav-button animate"
                        onClick={() => scrollToSection('contact')}
                    >
                        {t.contact}
                    </button>
                    <button
                        className="nav-button animate"
                        onClick={onGetStartedClick}
                    >
                        {t.getStarted}
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
