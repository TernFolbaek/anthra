// Components/MessagesLayout/MessagesLayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import CurrentConversations from '../CurrentConversations/CurrentConversations';

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
        <div className="messages-page">
            {isWideScreen ? (
                <>
                    <CurrentConversations />
                    <Outlet />
                </>
            ) : userId ? (
                <Outlet />
            ) : (
                <CurrentConversations />
            )}
        </div>
    );
};

export default MessagesLayout;
