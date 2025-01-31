import React, { useState, useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import CurrentConversations from '../../Components/CurrentConversations/CurrentConversations';
import axios from 'axios';

interface MessagesLayoutProps {
    isConnections: boolean | null;
}

export interface Conversation {
    userId: string;
    userName: string;
    firstName: string;
    lastName: string;
    userProfilePicture: string;
    lastMessageContent: string;
    lastMessageTimestamp: string;
    lastMessageSenderId: string;
}

const MessagesLayout: React.FC<MessagesLayoutProps> = ({ isConnections }) => {
    const { userId } = useParams<{ userId?: string }>();

    let screenWidth = isConnections ? 1300 : 900;
    const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > screenWidth);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [errorConversations, setErrorConversations] = useState<string | null>(null);

    const currentUserId = localStorage.getItem('userId');

    useEffect(() => {
        if (!currentUserId) {
            setErrorConversations('User ID not found in localStorage.');
            setLoadingConversations(false);
            return;
        }

        const fetchConversations = async () => {
            try {
                const response = await axios.get(`/Messages/GetConversations`, {
                    params: { userId: currentUserId },
                });
                setConversations(response.data);
                setLoadingConversations(false);
            } catch (error) {
                console.error('Error fetching conversations:', error);
                setErrorConversations('Failed to fetch conversations. Please try again later.');
                setLoadingConversations(false);
            }
        };

        fetchConversations();
    }, [currentUserId]);

    const handleRemoveConversation = (removedUserId: string) => {
        setConversations((prev) => prev.filter((conv) => conv.userId !== removedUserId));
    };

    useEffect(() => {
        const handleResize = () => {
            setIsWideScreen(window.innerWidth > screenWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isConnections, screenWidth]);

    return (
        <div className="messages-page-container">
            {isWideScreen ? (
                <>
                    {/* Pass the conversation list and any relevant states */}
                    <CurrentConversations
                        conversations={conversations}
                        loading={loadingConversations}
                        error={errorConversations}
                    />

                    {/* Provide a context to the Outlet so `Messages.tsx` can remove a conversation */}
                    <Outlet
                        context={{
                            removeConversation: handleRemoveConversation,
                            conversations
                        }}
                    />
                </>
            ) : userId ? (
                <Outlet
                    context={{
                        removeConversation: handleRemoveConversation,
                        conversations
                    }}
                />
            ) : !isConnections ? (
                <div className="w-full flex justify-center">
                    <CurrentConversations
                        conversations={conversations}
                        loading={loadingConversations}
                        error={errorConversations}
                    />
                </div>
            ) : (
                <Outlet
                    context={{
                        removeConversation: handleRemoveConversation,
                        conversations
                    }}
                />
            )}
        </div>
    );
};

export default MessagesLayout;
