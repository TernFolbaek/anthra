import React, { useState, useEffect, useRef } from 'react';
import './Features.css';
import { useLanguage } from '../../../LanguageContext'; // Import language context
import translations from '../../../languages/landingPageTranslations.json'; // Import combined translations

interface Feature {
    title: string;
    description: string;
}

const Features: React.FC = () => {
    const [activeFeature, setActiveFeature] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const featuresRef = useRef<HTMLDivElement>(null);
    const { language } = useLanguage(); // Get the current language
    const t = translations[language as keyof typeof translations].features; // Get the translations for Features

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % t.featuresList.length); // Use the length of the translated features array
        }, 5000);

        return () => clearInterval(interval);
    }, [t.featuresList.length]); // Watch for changes in translated features

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.2, // 20% visibility
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
            <h1 className="feature-showcase-title">{t.title}</h1> {/* Use translated title */}
            <div className="feature-container">
                {t.featuresList.map((feature: Feature, index: number) => (
                    <div
                        key={index}
                        className={`feature-card ${index === activeFeature ? 'active' : ''} cursor-pointer`}
                        style={{ '--delay': `${index * 0.1}s` } as React.CSSProperties}
                        onClick={() => setActiveFeature(index)}
                    >
                        <h3 className="feature-title">{feature.title}</h3> {/* Use translated title */}
                        <p className="feature-description">{feature.description}</p> {/* Use translated description */}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Features;
