import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CurrentConversations.css';
import CardContainer from '../CardContainer/CardContainer';
import NoConversationsRive from "../../Helpers/Animations/NoConversations";

interface Conversation {
    userId: string;
    userName: string;
    firstName: string;
    lastName: string;
    userProfilePicture: string;
    lastMessageContent: string;
    lastMessageTimestamp: string;
    lastMessageSenderId: string;
}

const CurrentConversations: React.FC = React.memo(() => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');  // State for the search query
    const currentUserId = localStorage.getItem('userId');
    const navigate = useNavigate();
    const location = useLocation();

    const pathMatch = location.pathname.match(/\/messages\/(.+)/);
    const selectedConversationId = pathMatch ? pathMatch[1] : null;

    useEffect(() => {
        if (!currentUserId) {
            console.error('User ID not found in localStorage.');
            setError('User ID not found.');
            return;
        }

        fetch(`http://localhost:5001/api/Messages/GetConversations?userId=${currentUserId}`)
            .then((response) => {
                if (!response.ok) {
                    return response.text().then((text) => {
                        console.error('Error fetching conversations:', text);
                        throw new Error(`HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then((data) => {
                setConversations(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching conversations:', error);
                setError('Failed to fetch conversations. Please try again later.');
                setLoading(false);
            });
    }, [currentUserId]);

    // Filter conversations based on the search query
    const filteredConversations = conversations.filter((conv) => {
        const fullName = `${conv.firstName} ${conv.lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
    });

    if (loading) {
        return <div className="conversations-loading">Loading conversations...</div>;
    }

    if (error) {
        return <div className="conversations-error">{error}</div>;
    }

    return (
        <CardContainer title="Messages">
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search Conversations"
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
                                navigate(`/messages/${conv.userId}`);
                            }}
                        >
                            <img
                                src={`${conv.userProfilePicture}`}
                                alt={conv.userName}
                                className="conversation-profile-picture"
                            />
                            <div className="conversation-details">
                                <h3>{conv.firstName} {conv.lastName}</h3>
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
                                    year: 'numeric'
                                })}{" "}
                                {new Date(conv.lastMessageTimestamp).toLocaleTimeString('en-GB', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </CardContainer>
    );
});

export default CurrentConversations;
