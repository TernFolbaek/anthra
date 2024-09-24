import React, { useState, useRef, useEffect } from 'react';
import './Home.css';
import Icon from '@mdi/react';
import { mdiArrowRightThin } from '@mdi/js';

const Home = () => {
    const words = ["friendships", "collaborations", "partnerships"]
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(150);

    useEffect(() => {
        const handleTyping = () => {
            const currentWord = words[currentWordIndex];
            if (isDeleting) {
                setDisplayedText(prev => prev.slice(0, -1));
                setTypingSpeed(75);
            } else {
                setDisplayedText(prev => currentWord.slice(0, prev.length + 1));
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
    }, [displayedText, isDeleting, currentWordIndex, words, typingSpeed]);


    return (
        <div className="home-container">
            <div className="home-content w-[100%] items-center flex flex-col gap-5 mt-[13%]">
                <div className=" mission"><h2>Our Mission</h2></div>
                <div className="home-content-text text-center text-white justify-center"><h3>The platform which bridges
                    connections between like minded individuals, in the vast fields of
                    interests and hobbies, where you foster new <span className="dynamic-text">{displayedText}</span>,
                    along the way
                </h3></div>
                <button
                    className="flex items-center gap-2 px-6 py-3 font-sans text-xs font-bold text-center text-white text-[20px] uppercase align-middle transition-all rounded-lg select-none disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none hover:bg-gray-900/50 active:bg-gray-900/20"
                    type="button">
                    Get Started
                    <Icon path={mdiArrowRightThin} size={1} />

                </button>
            </div>

        </div>
    );
}

export default Home;