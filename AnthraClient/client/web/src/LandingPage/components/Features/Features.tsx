import React, { useState, useEffect, useRef } from 'react';
import './Features.css';

interface Feature {
    title: string;
    description: string;
}

const features: Feature[] = [
    {
        title: 'Forums',
        description: 'Create larger forums with your connections, and begin your own community',
    },
    {
        title: 'Connection Requests',
        description: 'View all connection requests you have received in its dedicated page',
    },
    {
        title: 'Selective Connecting',
        description: 'Only connect with the individuals you wish to reach out to',
    },
    {
        title: 'Resource Sharing',
        description: 'Share resources in direct messages, and forum chats allowing an easier workflow',
    },
];

const Features: React.FC = () => {
    const [activeFeature, setActiveFeature] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const featuresRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % features.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

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
            <h1 className="feature-showcase-title">Features</h1>
            <div className="feature-container">
                {features.map((feature, index) => (
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