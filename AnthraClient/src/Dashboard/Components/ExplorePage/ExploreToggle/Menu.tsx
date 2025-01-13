import React from 'react';
import './Menu.css';
import useWindowWidth from '../../../hooks/useWindowWidth';

interface MenuProps {
    activePage: 'individuals' | 'groups';
    setActivePage: React.Dispatch<React.SetStateAction<'individuals' | 'groups'>>;
}

const Menu: React.FC<MenuProps> = ({ activePage, setActivePage }) => {
    const windowWidth = useWindowWidth();
    const isSmallScreen = windowWidth < 480;

    return (
        <div className="explore-menu-container">
            <div className="menu-toggle dark:bg-gray-700/50">
                <div
                    className={`menu-slider ${activePage === 'individuals' ? 'slide-left' : 'slide-right'}`}
                ></div>
                <button
                    className={`text-sm explore-menu-button ${activePage === 'individuals' ? 'active' : ''}`}
                    onClick={() => setActivePage('individuals')}
                    aria-label="Individuals"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                        <path
                            d="M6 20C6 16.6863 8.68629 14 12 14C15.3137 14 18 16.6863 18 20"
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                    </svg>
                    {!isSmallScreen && <span>Individuals</span>}
                </button>
                <button
                    className={`text-sm explore-menu-button ${activePage === 'groups' ? 'active' : ''}`}
                    onClick={() => setActivePage('groups')}
                    aria-label="Groups"
                >
                    {/* Group icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="9" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                        <circle cx="17" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                        <path
                            d="M4 20C4 16.6863 6.68629 14 10 14"
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                        <path
                            d="M14 14C17.3137 14 20 16.6863 20 20"
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                    </svg>
                    {!isSmallScreen && <span>Groups</span>}
                </button>
            </div>
        </div>
    );
};

export default Menu;
