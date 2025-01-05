import React, { useState, useEffect } from 'react';
import Icon from '@mdi/react';
import { mdiArrowRightThin } from '@mdi/js';
import { useLanguage } from '../../../LanguageContext';
import homeTranslations from '../../../languages/homeTranslations.json';
import './Home.css';
import cbsBanner from '../../assets/cbs-banner.png';
import dtuBanner from '../../assets/dtu-banner.png';
import kuBanner from '../../assets/ku-banner.png';

interface NavbarProps {
    onGetStartedClick: () => void;
}

const Home: React.FC<NavbarProps> = ({ onGetStartedClick }) => {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(150);
    const { language } = useLanguage();
    const t = homeTranslations[language as keyof typeof homeTranslations];

    // Dynamic words array based on the selected language
    const words = language === 'da' ? ['makker', 'gruppe'] : ['partner', 'group'];

    useEffect(() => {
        const handleTyping = () => {
            const currentWord = words[currentWordIndex];
            if (isDeleting) {
                setDisplayedText((prev) => prev.slice(0, -1));
                setTypingSpeed(75);
            } else {
                setDisplayedText((prev) => currentWord.slice(0, prev.length + 1));
                setTypingSpeed(150);
            }

            if (!isDeleting && displayedText === currentWord) {
                setTimeout(() => setIsDeleting(true), 1000);
            } else if (isDeleting && displayedText === '') {
                setIsDeleting(false);
                setCurrentWordIndex((prev) => (prev + 1) % words.length);
            }
        };

        const typingTimeout = setTimeout(handleTyping, typingSpeed);

        return () => clearTimeout(typingTimeout);
    }, [displayedText, isDeleting, currentWordIndex, typingSpeed, words]);

    return (
        <div className="home-container">
            <div className="home-background" />

            <div className="home-content items-center flex flex-col gap-5">
                <div className="mission">
                    <h2>{t.mission}</h2>
                </div>
                <div className="home-content-text text-center text-white justify-center">
                    <div>
                        {t.description}
                        <span className="dynamic-text">{displayedText}</span>?
                    </div>
                </div>
                <button
                    className="flex items-center get-started-button"
                    onClick={onGetStartedClick}
                >
                    {t.getStarted}
                    <Icon path={mdiArrowRightThin} size={1}/>
                </button>
            </div>

            <div className="image-banner">
                <div className="image-track">
                    {[...Array(5)].map((_, i) => (
                        <React.Fragment key={i}>
                            <div className="banner-image">
                                <img src={cbsBanner} alt="banner for university"/>
                            </div>
                            <div className="banner-image">
                                <img src={dtuBanner} alt="banner for university"/>
                            </div>
                            <div className="banner-image">
                                <img src={kuBanner} alt="banner for university"/>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
