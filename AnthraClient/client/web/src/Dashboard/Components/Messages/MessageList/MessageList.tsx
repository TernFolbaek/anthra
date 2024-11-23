import React, { useEffect, useState } from 'react';
import './MessageList.css';
import { useNavigate } from 'react-router-dom';

interface Conversation {
    userId: string;
    userName: string;
    userEmail: string;
    userProfilePicture?: string;
    lastMessageContent: string;
    lastMessageTimestamp: string;
    lastMessageSenderId: string; // Added field
}

const MessageList: React.FC = () => {
    const [yourTurnConversations, setYourTurnConversations] = useState<Conversation[]>([]);
    const [theirTurnConversations, setTheirTurnConversations] = useState<Conversation[]>([]);
    const [isYourTurnOpen, setIsYourTurnOpen] = useState(true);
    const [isTheirTurnOpen, setIsTheirTurnOpen] = useState(true);
    const navigate = useNavigate();
    const currentUserId = localStorage.getItem('userId');

    useEffect(() => {
        if (!currentUserId) {
            console.error('User ID not found in localStorage.');
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
                // Categorize conversations
                const yourTurn = data.filter((conv: Conversation) => conv.lastMessageSenderId !== currentUserId);
                const theirTurn = data.filter((conv: Conversation) => conv.lastMessageSenderId === currentUserId);

                setYourTurnConversations(yourTurn);
                setTheirTurnConversations(theirTurn);
            })
            .catch((error) => console.error('Error fetching conversations:', error));
    }, [currentUserId]);

    const handleConversationClick = (userId: string) => {
        navigate(`/messages/${userId}`);
    };

    const renderConversation = (conversation: Conversation) => (
        <div
            key={conversation.userId}
            className="conversation-row"
            onClick={() => handleConversationClick(conversation.userId)}
        >
            <img
                src={
                    conversation.userProfilePicture
                        ? `http://localhost:5001${conversation.userProfilePicture}`
                        : '/default-profile.png'
                }
                alt="Profile"
                className="conversation-avatar"
            />
            <div className="conversation-info">
                <h3>{conversation.userName}</h3>
                <p className="last-message">{conversation.lastMessageContent}</p>
            </div>
            <div className="conversation-timestamp">
                <span>
                    {conversation.lastMessageTimestamp
                        ? new Date(conversation.lastMessageTimestamp).toLocaleDateString()
                        : ''}
                </span>
            </div>
        </div>
    );

    return (
        <div className="message-list">
            <div className="message-list-dropdown-section">
                <div className="message-list-dropdown-header" onClick={() => setIsYourTurnOpen(!isYourTurnOpen)}>
                    <h3>Your turn ({yourTurnConversations.length})</h3>
                    <span className="dropdown-arrow">{isYourTurnOpen ? '▲' : '▼'}</span>
                </div>
                {isYourTurnOpen && (
                    <div className="conversation-list">
                        {yourTurnConversations.length === 0 ? (
                            <p className="flex justify-center border-none p-5 font-bold text-gray-500">No conversations found</p>
                        ) : (
                            yourTurnConversations.map(renderConversation)
                        )}
                    </div>
                )}
            </div>
            <div className="message-list-dropdown-section">
                <div className="message-list-dropdown-header" onClick={() => setIsTheirTurnOpen(!isTheirTurnOpen)}>
                    <h3>Their turn ({theirTurnConversations.length})</h3>
                    <span className="dropdown-arrow">{isTheirTurnOpen ? '▲' : '▼'}</span>
                </div>
                {isTheirTurnOpen && (
                    <div className="conversation-list">
                        {theirTurnConversations.length === 0 ? (
                            <p className="flex justify-center border-none p-5 font-bold text-gray-500">No conversations found</p>
                        ) : (
                            theirTurnConversations.map(renderConversation)
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageList;
