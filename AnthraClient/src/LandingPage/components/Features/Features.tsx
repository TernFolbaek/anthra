import React from 'react';
import './Features.css';

const Features: React.FC = () => {
    return (
        <div className="feature-showcase-wrapper">
            <h1 className="demo-video-title">Demo</h1>
            <div className="demo-video-container">
                <iframe
                    className="demo-video-iframe"
                    src="https://www.youtube.com/embed/B_pltPlrEfY"
                    title="Demo Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>

            </div>
        </div>
    );
};

export default Features;
