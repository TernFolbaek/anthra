import React, { useState, useEffect, useRef } from 'react';
import './Features.css';
import { useLanguage } from '../../../LanguageContext';
import translations from '../../../languages/landingPageTranslations.json';
import pngTree from '../../assets/group-tree.png';

interface Feature {
    title: string;
    description: string;
}

const Features: React.FC = () => {
    const [activeFeature, setActiveFeature] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const featuresRef = useRef<HTMLDivElement>(null);
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations].features;

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % t.featuresList.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [t.featuresList.length]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.2,
            }
        );

        if (featuresRef.current) {
            observer.observe(featuresRef.current);
        }

        return () => {
            if (featuresRef.current) {
                observer.unobserve(featuresRef.current);
            }
        };
    }, []);

    return (
        <div className={`feature-showcase ${isVisible ? 'visible' : ''}`} ref={featuresRef}>
            <h1 className="feature-showcase-title">{t.title}</h1>
            <div className="feature-container">
                {t.featuresList.map((feature: Feature, index: number) => (
                    <div
                        key={index}
                        className={`feature-card ${index === activeFeature ? 'active' : ''} cursor-pointer`}
                        style={{ '--delay': `${index * 0.1}s` } as React.CSSProperties}
                        onClick={() => setActiveFeature(index)}
                    >
                        <h3 className="feature-title">{feature.title}</h3>
                        <p className="feature-description">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Features;
