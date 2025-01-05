import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';
import './Logo.css';
import { useLanguage } from '../../../LanguageContext';
import navbarTranslations from '../../../languages/navbarTranslations.json';
import Danish from '../../assets/danish.jpg';
import English from '../../assets/english.jpg';

interface NavbarProps {
    onGetStartedClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onGetStartedClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { language, switchLanguage } = useLanguage();
    const t = navbarTranslations[language as keyof typeof navbarTranslations];

    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
            if (window.innerWidth > 1024) {
                setIsMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

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
        if (isMenuOpen) {
            setIsMenuOpen(false);
        }
    };

    return (
        <nav className="home-navbar flex items-center">
            <h1 id="logo-title" className="animate">Anthra</h1>

            {/* Burger Menu Icon */}
            {isMobile && (
                <div className={`burger-menu ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
                    <div className="burger-bar"></div>
                    <div className="burger-bar"></div>
                    <div className="burger-bar"></div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className={`nav-buttons flex animate-nav-buttons ${isMobile ? (isMenuOpen ? 'mobile-open' : 'mobile-closed') : ''}`}>
                <div
                    className={`language-dropdown animate ${isDropdownOpen ? 'open' : ''}`}
                    onClick={toggleDropdown}
                    ref={dropdownRef} // Assign the ref here
                    role="button"
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                >
                    <div className="dropdown-header-home-navbar">
                        {language === 'da' ? (
                            <>
                                <img src={Danish} alt="Danish" className="flag-icon" /> Dansk
                            </>
                        ) : (
                            <>
                                <img src={English} alt="English" className="flag-icon" /> English
                            </>
                        )}
                        {/* Arrow Element */}
                        <span className={`arrow ${isDropdownOpen ? 'open' : ''}`}></span>
                    </div>

                    {isDropdownOpen && (
                        <div className="dropdown-menu animate">
                            <div className="language-dropdown-item" onClick={() => handleLanguageChange('da')}>
                                <img src={Danish} alt="Danish" className="flag-icon" /> Dansk
                            </div>
                            <div className="language-dropdown-item" onClick={() => handleLanguageChange('en')}>
                                <img src={English} alt="English" className="flag-icon" /> English
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
        </nav>
    );

};

export default Navbar;
