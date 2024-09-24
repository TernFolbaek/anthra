import React, { useEffect, useRef } from 'react';
import './HowItWorks.css';
import stepOneImage from '../../assets/explore-anthra.png';
import stepTwoImage from '../../assets/connections-anthra.png';
import stepThreeImage from '../../assets/group-chat.jpg';
import howItWorksVideo from '../../assets/air.mp4';

const HowItWorks: React.FC = () => {
    const step1Ref = useRef<HTMLDivElement>(null);
    const step2Ref = useRef<HTMLDivElement>(null);
    const step3Ref = useRef<HTMLDivElement>(null);

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
                <video autoPlay loop muted className="background-video">
                    <source src={howItWorksVideo} type="video/mp4"/>
                    Your browser does not support the video tag.
                </video>

                <div className="content">
                    <h1 className="title">How It Works</h1>
                    <div ref={step1Ref} className="step step-1">
                        <div className="step-content">
                            <h2>Create your profile and explore</h2>
                            <p>Create your own profile and dive into the explore page where you can send connection
                                requests to others who pique your interest</p>
                        </div>
                        <img src={stepOneImage} className="step-image" alt="profile on explore page"/>
                    </div>

                    <div ref={step2Ref} className="step step-2">
                        <div className="step-content">
                            <h2>Check your inbox</h2>
                            <p>Check your inbox for requests from other users, and decide whether or not you want to
                                commence the relationship</p>
                        </div>
                        <img src={stepTwoImage} className="step-image" alt="connection requests"/>
                    </div>

                    <div ref={step3Ref} className="step step-3">
                        <div className="step-content">
                            <h2>Create forums</h2>
                            <p>If you believe your partnership would be strengthened with more users, you always have
                                the opportunity to create forums with your connections and their connections</p>
                        </div>
                        <img src={stepThreeImage} className="step-image" alt="group chat"/>
                    </div>
                </div>
            </div>
        );
}
export default HowItWorks;