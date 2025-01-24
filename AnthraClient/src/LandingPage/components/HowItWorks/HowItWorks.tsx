// HowItWorks.tsx

import React, { useEffect, useRef } from 'react';
import './HowItWorks.css';
import '../Features/Features.css'
import stepOneImage from '../../assets/userexplorepage.png';
import stepTwoImage from '../../assets/connectionpagedemo.png';
import stepThreeImage from '../../assets/grouppagedemo.png';
import { useLanguage } from '../../../LanguageContext';
import translations from '../../../languages/landingPageTranslations.json';
import { faMagnifyingGlass, faUsersRays, faUserAstronaut } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const HowItWorks: React.FC = () => {
    const step1Ref = useRef<HTMLDivElement>(null);
    const step2Ref = useRef<HTMLDivElement>(null);
    const step3Ref = useRef<HTMLDivElement>(null);

    const { language } = useLanguage(); // Get the current language
    const t = translations[language as keyof typeof translations].howItWorks; // Get HowItWorks translations

    useEffect(() => {
        const options: IntersectionObserverInit = {
            threshold: 0.5,
        };

        const handleIntersection = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('slide-in');
                    observer.unobserve(entry.target);
                }
            });
        };

        const observer = new IntersectionObserver(handleIntersection, options);

        if (step1Ref.current) observer.observe(step1Ref.current);
        if (step2Ref.current) observer.observe(step2Ref.current);
        if (step3Ref.current) observer.observe(step3Ref.current);

        return () => {
            if (step1Ref.current) observer.unobserve(step1Ref.current);
            if (step2Ref.current) observer.unobserve(step2Ref.current);
            if (step3Ref.current) observer.unobserve(step3Ref.current);
        };
    }, []);

    return (
        <div className="how-it-works-container">
            <div className="background-video"></div>
            <div className="content">
                <p className="how-it-works-title text-center mb-4 text-4xl font-bold">{t.title}</p>
                <p className="how-it-works-subtitle text-center mb-16 text-sm">{t.subtitle}</p>

                {/* Step 1 */}
                <div ref={step1Ref} className="step step-1">
                    <div className="step-content">
                        <div className="flex items-center gap-2 mb-4">
                            <FontAwesomeIcon className="text-2xl text-gray-300" icon={faUserAstronaut} />
                            <p className="text-white text-2xl font-semibold">{t.steps[0].heading}</p>
                        </div>
                        <p className="step-description text-lg text-gray-400 leading-relaxed mb-6">{t.steps[0].description}</p>
                        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700/50">
                            <p className="text-emerald-400 font-medium text-sm">{t.step1}</p>
                        </div>
                    </div>
                    <img src={stepOneImage} className="step-image" alt="profile on explore page" />
                </div>

                {/* Step 2 */}
                <div ref={step2Ref} className="step step-2">
                    <div className="step-content">
                        <div className="flex items-center gap-2 mb-4">
                            <FontAwesomeIcon className="text-2xl text-gray-300" icon={faMagnifyingGlass} />
                            <p className="text-white text-2xl font-semibold">{t.steps[1].heading}</p>
                        </div>
                        <p className="step-description text-lg text-gray-400 leading-relaxed mb-6">{t.steps[1].description}</p>
                        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700/50">
                            <p className="text-emerald-400 font-medium text-sm">{t.step2}</p>
                        </div>
                    </div>
                    <img src={stepTwoImage} className="step-image" alt="connection requests" />
                </div>

                {/* Step 3 */}
                <div ref={step3Ref} className="step step-3">
                    <div className="step-content">
                        <div className="flex items-center gap-2 mb-4">
                            <FontAwesomeIcon className="text-2xl text-gray-300" icon={faUsersRays} />
                            <p className="text-white text-2xl font-semibold">{t.steps[2].heading}</p>
                        </div>
                        <p className="step-description text-lg text-gray-400 leading-relaxed mb-6">{t.steps[2].description}</p>
                        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700/50">
                            <p className="text-emerald-400 font-medium text-sm">{t.step3}</p>
                        </div>
                    </div>
                    <img src={stepThreeImage} className="step-image" alt="group chat" />
                </div>

                {/* Demo Video */}
                <div className="demo-video-container mb-16">
                    <div className="demo-video-iframe">
                        <iframe
                            src="https://www.youtube.com/embed/_HYSb0Z-owk"
                            title="Demo Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;
