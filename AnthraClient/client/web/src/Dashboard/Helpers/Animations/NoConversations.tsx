import React from "react";
import {useRive} from "@rive-app/react-canvas";
import { useNavigate } from 'react-router-dom';
import {FaMagnifyingGlass} from "react-icons/fa6";

const NoConversationsRive: React.FC = () => {
    const navigate = useNavigate();
    const { rive, RiveComponent } = useRive({
        src: '/rive/juggling_master.riv',
        autoplay: true,
    });

    return (
        <div className="no-connections-container">
            <RiveComponent className="no-conversations-rive"/>
            <p className="text-m font-bold text-gray-500 text-center mb-2">Begin a conversation with a connection</p>
            <button className="explore-button" onClick={() => navigate('/connections')}><FaMagnifyingGlass/>Connections
            </button>
        </div>
    )
}

export default NoConversationsRive;