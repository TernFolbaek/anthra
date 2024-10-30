import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


const MessagesRedirect = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");
    useEffect(() => {
        const fetchLatestConversation = async () => {
            try {
                const response = await fetch(`http://localhost:5001/api/Messages/GetLatestConversation?userId=${userId}`);
                if (response.ok) {
                    const latestConversation = await response.json();
                    navigate(`/messages/${latestConversation.userId}`);
                } else {
                    console.error("No latest conversation found.");
                }
            } catch (error) {
                console.error("Error fetching latest conversation:", error);
            }
        };

        fetchLatestConversation();
    }, [userId, navigate]);

    return <div>Loading...</div>;
};

export default MessagesRedirect;
