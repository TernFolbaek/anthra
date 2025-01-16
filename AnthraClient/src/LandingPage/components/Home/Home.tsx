// Home.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Icon from '@mdi/react';
import { mdiArrowRightThin } from '@mdi/js';
import { useLanguage } from '../../../LanguageContext';
import homeTranslations from '../../../languages/homeTranslations.json';
import './Home.css';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


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

    const handleScroll = () => {
        const nav = document.querySelector('.home-navbar');
        if (window.scrollY > 0) {
            console.log("here");
            nav?.classList.add('scrolled');
        } else {
            nav?.classList.remove('scrolled');
        }
    };


    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);



    return (
        <div className="home-container">
            <div className="home-background" />

            <div className="home-content items-center flex flex-col gap-5">

                <div
                    className="mission flex gap-2 text-gray-300 text-sm inline-flex items-center px-4 py-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-full hover:bg-gray-800 transition-all transform hover:scale-105">
                    <FontAwesomeIcon className="text-emerald-400" icon={faWandMagicSparkles}/><h2>{t.mission}</h2>
                </div>
                <div className="home-content-text text-center text-white justify-center">
                    <div>
                        {t.description}
                        <span className="dynamic-text text-emerald-400">{displayedText}</span>?
                    </div>
                </div>
                <button
                    className="text-lg flex items-center bg-emerald-500 text-gray-900 hover:bg-emerald-400 transform hover:scale-105 get-started-button"
                    onClick={onGetStartedClick}
                >
                    {t.getStarted}
                    <Icon path={mdiArrowRightThin} size={1}/>
                </button>
                <div className="grid mt-10 grid-cols-1 md:grid-cols-3 gap-8 mb-12" data-v-095ba637="">
                    <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700"
                         data-v-095ba637="">
                        <div className="text-3xl font-bold text-emerald-400 mb-2 text-center" data-v-095ba637="">3+</div>
                        <div className="text-gray-400 text-center font-light" data-v-095ba637="">{t.block1}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700"
                         data-v-095ba637="">
                        <div className="text-3xl font-bold text-emerald-400 mb-2 text-center" data-v-095ba637="">24 / 7</div>
                        <div className="text-gray-400 text-center font-light" data-v-095ba637="">{t.block2}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700"
                         data-v-095ba637="">
                        <div className="text-3xl font-bold text-emerald-400 mb-2 text-center" data-v-095ba637="">15%
                        </div>
                        <a
                            href="https://en.wikipedia.org/wiki/Peer-led_team_learning?utm_source=chatgpt.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer"
                        >
                            <div className="text-gray-400 text-center font-light" data-v-095ba637="">
                                {t.block3}
                            </div>
                        </a>

                    </div>
                </div>

            </div>

        </div>
    );
};

export default React.memo(Home);
