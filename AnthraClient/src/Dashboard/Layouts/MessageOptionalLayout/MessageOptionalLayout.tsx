import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import CurrentConversations from "../../Components/CurrentConversations/CurrentConversations";

const MessageOptionalLayout: React.FC = () => {
    const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > 1200);

    useEffect(() => {
        const handleResize = () => {
            setIsWideScreen(window.innerWidth > 1200);
        };
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="messages-page-container">
            {isWideScreen ? (
                <>
                    <CurrentConversations />
                    <Outlet />
                </>
            ) :
                <Outlet />
            }
        </div>
    );
};

export default MessageOptionalLayout;
