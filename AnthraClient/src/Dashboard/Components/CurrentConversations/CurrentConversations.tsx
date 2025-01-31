import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CurrentConversations.css';
import CardContainer from '../CardContainer/CardContainer';
import NoConversationsRive from '../../Helpers/Animations/NoConversations';
import {Conversation} from "../../Layouts/MessagesLayout/MessagesLayout";

interface CurrentConversationsProps {
    conversations: Conversation[];
    loading: boolean;
    error: string | null;
}

const CurrentConversations: React.FC<CurrentConversationsProps> = React.memo(
    ({ conversations, loading, error }) => {
        const [searchQuery, setSearchQuery] = useState<string>('');
        const navigate = useNavigate();
        const location = useLocation();

        // Extract currently-selected conversation from the URL
        const pathMatch = location.pathname.match(/\/messages\/(.+)/);
        const selectedConversationId = pathMatch ? pathMatch[1] : null;

        // Filter by search
        const filteredConversations = conversations.filter((conv) => {
            const fullName = `${conv.firstName} ${conv.lastName}`.toLowerCase();
            return fullName.includes(searchQuery.toLowerCase());
        });

        if (loading) {
            return (
                <CardContainer title="Messages">
                    <div className="p-4 text-center text-sm">Loading conversations...</div>
                </CardContainer>
            );
        }

        if (error) {
            return (
                <CardContainer title="Messages">
                    <div className="conversations-error">{error}</div>
                </CardContainer>
            );
        }

        return (
            <CardContainer title="Messages">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search messages"
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredConversations.length === 0 ? (
                    <NoConversationsRive />
                ) : (
                    <ul className="conversations-list">
                        {filteredConversations.map((conv) => (
                            <li
                                key={conv.userId}
                                className={`conversation-item ${
                                    selectedConversationId === conv.userId ? 'selected' : ''
                                }`}
                                onClick={() => {
                                    navigate(`/dashboard/messages/${conv.userId}`);
                                }}
                            >
                                <img
                                    src={`${conv.userProfilePicture}`}
                                    alt={conv.userName}
                                    className="conversation-profile-picture"
                                />
                                <div className="conversation-details">
                                    <p className="font-medium text-sm dark:text-white">
                                        {conv.firstName} {conv.lastName}
                                    </p>
                                    <p className="last-message">
                                        {conv.lastMessageContent.length > 15
                                            ? `${conv.lastMessageContent.substring(0, 10)}...`
                                            : conv.lastMessageContent}
                                    </p>
                                </div>
                                <p className="conversation-timestamp">
                                    {new Date(conv.lastMessageTimestamp).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'numeric',
                                        year: 'numeric',
                                    })}{' '}
                                    {new Date(conv.lastMessageTimestamp).toLocaleTimeString('en-GB', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContainer>
        );
    }
);

export default CurrentConversations;
