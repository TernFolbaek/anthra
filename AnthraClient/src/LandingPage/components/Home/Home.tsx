// Home.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { language } = useLanguage();
    const t = homeTranslations[language as keyof typeof homeTranslations];

    // Memoize words to prevent re-creation on every render
    const words = useMemo(() => {
        return language === 'da' ? ['makker', 'gruppe'] : ['partner', 'group'];
    }, [language]);

    useEffect(() => {
        const handleTyping = () => {
            const currentWord = words[currentWordIndex];
            const fullText = currentWord;
            const updatedText = isDeleting
                ? fullText.substring(0, displayedText.length - 1)
                : fullText.substring(0, displayedText.length + 1);

            setDisplayedText(updatedText);

            let delay = isDeleting ? 75 : 150;

            if (!isDeleting && updatedText === fullText) {
                delay = 1000; // Pause before deleting
                typingTimeoutRef.current = setTimeout(() => setIsDeleting(true), delay);
                return;
            }

            if (isDeleting && updatedText === '') {
                setIsDeleting(false);
                setCurrentWordIndex((prev) => (prev + 1) % words.length);
                delay = 500; // Pause before typing next word
            }

            typingTimeoutRef.current = setTimeout(handleTyping, delay);
        };

        typingTimeoutRef.current = setTimeout(handleTyping, isDeleting ? 75 : 150);

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [displayedText, isDeleting, currentWordIndex, words]);

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
                    <Icon path={mdiArrowRightThin} size={1} />
                </button>
            </div>

        </div>
    );
};

export default React.memo(Home);
