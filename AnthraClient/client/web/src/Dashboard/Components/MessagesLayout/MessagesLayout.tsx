// Components/MessagesLayout/MessagesLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import CurrentConversations from '../CurrentConversations/CurrentConversations';

const MessagesLayout: React.FC = () => {
    return (
        <div className="messages-page">
            <CurrentConversations />
            <Outlet />
        </div>
    );
};

export default MessagesLayout;
