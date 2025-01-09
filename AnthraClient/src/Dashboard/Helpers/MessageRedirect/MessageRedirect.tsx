import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MessagesRedirect = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");

    useEffect(() => {
        const fetchLatestConversation = async () => {
            try {
                const response = await fetch(`/Messages/GetLatestConversation?userId=${userId}`);
                if (response.ok) {
                    const latestConversation = await response.json();
                    navigate(`/dashboard/messages/${latestConversation.userId}`);
                } else {
                    console.error("No latest conversation found.");
                    navigate('/dashboard/messages');
                }
            } catch (error) {
                console.error("Error fetching latest conversation:", error);
                navigate('/dashboard/messages');
            }
        };

        fetchLatestConversation();
    }, [userId, navigate]);

    return null;
};

export default MessagesRedirect;
