import React from "react";
import { useNavigate } from 'react-router-dom';
import {FaMagnifyingGlass} from "react-icons/fa6";

const NoConnectionsRive: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="no-connections-container">
            <p className="text-sm text-center font-medium text-gray-400 mb-2">No connections, explore new ones</p>
            <button className="text-sm dark:bg-emerald-500 bg-emerald-400 hover:bg-emerald-300 dark:hover:bg-emerald-400 explore-button" onClick={() => navigate('/dashboard/explore')}> <FaMagnifyingGlass/>Explore</button>
        </div>
    )
}

export default NoConnectionsRive;