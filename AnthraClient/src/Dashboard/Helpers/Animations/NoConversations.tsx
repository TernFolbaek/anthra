import React from "react";
import { useNavigate } from 'react-router-dom';
import {FaMagnifyingGlass} from "react-icons/fa6";

const NoConversationsRive: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="no-connections-container">
            <p className="text-sm font-medium text-gray-400 text-center mb-2 ">Begin a conversation with a connection</p>
            <button className="text-sm dark:bg-emerald-500 dark:hover:bg-emerald-400 explore-button" onClick={() => navigate('/dashboard/connections')}><FaMagnifyingGlass/>Connections
            </button>
        </div>
    )
}

export default NoConversationsRive;