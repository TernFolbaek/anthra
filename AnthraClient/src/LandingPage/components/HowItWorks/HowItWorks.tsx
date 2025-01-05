import React, { useEffect, useRef } from 'react';
import './HowItWorks.css';
import stepOneImage from '../../assets/explore-anthra.png';
import stepTwoImage from '../../assets/connections-anthra.png';
import stepThreeImage from '../../assets/group-chat.jpg';
import howItWorksVideo from '../../assets/air.mp4';
import { useLanguage } from '../../../LanguageContext'; // Import the useLanguage hook
import translations from '../../../languages/landingPageTranslations.json'; // Import the combined translations

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
            <video autoPlay loop muted className="background-video" controls={false}>
                <source src={howItWorksVideo} type="video/mp4"/>
                Your browser does not support the video tag.
            </video>

            <div className="content">
                <h1 className="how-it-works-title">{t.title}</h1> {/* Use translated title */}
                <div ref={step1Ref} className="step step-1">
                    <div className="step-content">
                        <p className="step-content-title">{t.steps[0].heading}</p> {/* Use translated step 1 heading */}
                        <p className="step-description">{t.steps[0].description}</p> {/* Use translated step 1 description */}
                    </div>
                    <img src={stepOneImage} className="step-image" alt="profile on explore page"/>
                </div>

                <div ref={step2Ref} className="step step-2">
                    <div className="step-content">
                        <p className="step-content-title">{t.steps[1].heading}</p> {/* Use translated step 2 heading */}
                        <p className="step-description">{t.steps[1].description}</p> {/* Use translated step 2 description */}
                    </div>
                    <img src={stepTwoImage} className="step-image" alt="connection requests"/>
                </div>

                <div ref={step3Ref} className="step step-3">
                    <div className="step-content">
                        <p className="step-content-title">{t.steps[2].heading}</p> {/* Use translated step 3 heading */}
                        <p className="step-description">{t.steps[2].description}</p> {/* Use translated step 3 description */}
                    </div>
                    <img src={stepThreeImage} className="step-image" alt="group chat"/>
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;
