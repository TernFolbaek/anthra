import React, { useState, useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import CurrentConversations from '../../Components/CurrentConversations/CurrentConversations';
interface MessagesLayoutProps {
    isConnections: boolean | null;
}
const MessagesLayout: React.FC<MessagesLayoutProps> = ({isConnections}) => {
    const { userId } = useParams<{ userId?: string }>();
    let screenWidth = isConnections ? 1200 : 900
    const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > screenWidth);
    useEffect(() => {
        setIsWideScreen(window.innerWidth > screenWidth);

        const handleResize = () => {
            setIsWideScreen(window.innerWidth > screenWidth);
        };
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [isConnections]);
    return (
        <div className="messages-page-container">
            {isWideScreen ? (
                <>
                    <CurrentConversations />
                    <Outlet />
                </>
            ) : userId ? (
                <Outlet />
            ) : !isConnections ? (
                <div className="w-full flex justify-center">
                    <CurrentConversations />
                </div>
            ) :(
                <Outlet />
            )}
        </div>
    );
};

export default MessagesLayout;
