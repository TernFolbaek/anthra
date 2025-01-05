import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MessagesRedirect = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");

    useEffect(() => {
        const fetchLatestConversation = async () => {
            try {
                const response = await fetch(`https://api.anthra.dk/api/Messages/GetLatestConversation?userId=${userId}`);
                if (response.ok) {
                    const latestConversation = await response.json();
                    navigate(`/messages/${latestConversation.userId}`);
                } else {
                    console.error("No latest conversation found.");
                    navigate('/messages'); // Navigate to Messages without a userId
                }
            } catch (error) {
                console.error("Error fetching latest conversation:", error);
                navigate('/messages'); // Navigate to Messages without a userId
            }
        };

        fetchLatestConversation();
    }, [userId, navigate]);

    return null; // Remove the Loading... text
};

export default MessagesRedirect;
