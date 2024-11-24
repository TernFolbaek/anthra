import React from "react";
import {useRive} from "@rive-app/react-canvas";
import { useNavigate } from 'react-router-dom';
import {FaMagnifyingGlass} from "react-icons/fa6";

const NoConnectionsRive: React.FC = () => {
    const navigate = useNavigate();
    const { RiveComponent } = useRive({
        src: '/rive/no_conversations.riv',
        autoplay: true,
    });

    return (
        <div className="no-connections-container">
            <p className="text-xl text-center font-bold text-gray-500 mb-2">Send connections to create connections</p>
            <button className="explore-button" onClick={() => navigate('/explore')}> <FaMagnifyingGlass/>Explore</button>
            <RiveComponent className="no-connections-rive"/>
        </div>
    )
}

export default NoConnectionsRive;