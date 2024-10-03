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
}

const MessageList: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
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
                    setConversations(data)
                }
            )
            .catch((error) => console.error('Error fetching conversations:', error));
    }, [currentUserId]);

    const handleConversationClick = (userId: string) => {
        navigate(`/messages/${userId}`);
    };

    return (
        <div className="message-list">
            {conversations.length === 0 ? (
                <p>No conversations found.</p>
            ) : (
                conversations.map((conversation) => (
                    <div
                        key={conversation.userId}
                        className="conversation-row"
                        onClick={() => handleConversationClick(conversation.userId)}
                    >
                        <img
                            src={`http://localhost:5001${conversation.userProfilePicture}` || '/default-profile.png'}
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
              </span>x
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default MessageList;
