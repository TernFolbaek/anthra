import React, { useState, useEffect } from 'react';
import './Navbar.css';
import './Logo.css';
import { useLanguage } from '../../../LanguageContext';
import navbarTranslations from '../../../languages/navbarTranslations.json';
import Danish from '../../assets/danish.jpg'
import English from '../../assets/english.jpg'


interface NavbarProps {
    onGetStartedClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onGetStartedClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { language, switchLanguage } = useLanguage();
    const t = navbarTranslations[language as keyof typeof navbarTranslations];

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

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleLanguageChange = (lang: string) => {
        switchLanguage(lang);
        setIsDropdownOpen(false);
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
                        <div className="language-dropdown  animate " onClick={toggleDropdown}>
                            <div className="dropdown-header-home-navbar">
                                {language === 'da' ? (
                                    <>
                                        <img src={Danish} alt="Danish" className="flag-icon"/> Dansk
                                    </>
                                ) : (
                                    <>
                                        <img src={English} alt="English" className="flag-icon"/> English
                                    </>
                                )}
                            </div>

                            {isDropdownOpen && (
                                <div className="dropdown-menu animate">
                                    <div className="dropdown-item" onClick={() => handleLanguageChange('da')}>
                                        <img src={Danish} alt="Danish" className="flag-icon"/> Dansk
                                    </div>
                                    <div className="dropdown-item" onClick={() => handleLanguageChange('en')}>
                                        <img src={English} alt="English" className="flag-icon"/> English
                                    </div>
                                </div>
                            )}
                        </div>
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
                    <div className="language-dropdown  animate" onClick={toggleDropdown}>
                        <div className="dropdown-header-home-navbar">
                            {language === 'da' ? (
                                <>
                                    <img src={Danish} alt="Danish" className="flag-icon"/> Dansk
                                </>
                            ) : (
                                <>
                                    <img src={English} alt="English" className="flag-icon"/> English
                                </>
                            )}
                        </div>

                        {isDropdownOpen && (
                            <div className="dropdown-menu animate">
                                <div className="dropdown-item" onClick={() => handleLanguageChange('da')}>
                                    <img src={Danish} alt="Danish" className="flag-icon"/> Dansk
                                </div>
                                <div className="dropdown-item" onClick={() => handleLanguageChange('en')}>
                                    <img src={English} alt="English" className="flag-icon"/> English
                                </div>
                            </div>
                        )}
                    </div>
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
