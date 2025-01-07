import React, { useState, useEffect } from 'react';
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

    const { language } = useLanguage();
    const t = homeTranslations[language as keyof typeof homeTranslations];



    return (
        <div className="home-container">
            <div className="home-background" />

            <div className="home-content items-center flex flex-col gap-5">
                <div className="mission">
                </div>
                <div className="home-content-text text-center text-white justify-center">
                    <div>
                        {t.description}
                    </div>
                </div>
                <button
                    className="flex items-center get-started-button"
                    onClick={onGetStartedClick}
                >
                    {t.getStarted}
                    <Icon path={mdiArrowRightThin} size={1}/>
                </button>
            </div>

            <div className="image-banner">
                <div className="image-track">
                    {[...Array(5)].map((_, i) => (
                        <React.Fragment key={i}>
                            <div className="banner-image">
                                <img src={cbsBanner} alt="banner for university"/>
                            </div>
                            <div className="banner-image">
                                <img src={dtuBanner} alt="banner for university"/>
                            </div>
                            <div className="banner-image">
                                <img src={kuBanner} alt="banner for university"/>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
