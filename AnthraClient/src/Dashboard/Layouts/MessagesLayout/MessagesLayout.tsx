import React, { useState, useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import CurrentConversations from '../../Components/CurrentConversations/CurrentConversations';

const MessagesLayout: React.FC = () => {
    const { userId } = useParams<{ userId?: string }>();
    const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > 900);

    useEffect(() => {
        const handleResize = () => {
            setIsWideScreen(window.innerWidth > 900);
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
            ) : userId ? (
                <Outlet />
            ) : (
                <div className="w-full flex justify-center">
                    <CurrentConversations />
                </div>
            )}
        </div>
    );
};

export default MessagesLayout;
