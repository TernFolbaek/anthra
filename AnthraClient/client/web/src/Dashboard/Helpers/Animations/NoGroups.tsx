import React from "react";
import {useRive} from "@rive-app/react-canvas";
import { useNavigate } from 'react-router-dom';
import {FaMagnifyingGlass} from "react-icons/fa6";

const NoGroups: React.FC = () => {
    const navigate = useNavigate();
    const { rive, RiveComponent } = useRive({
        src: 'new_file.riv',
        autoplay: true,
    });

    return (
        <div className="no-connections-container">
            <RiveComponent className="no-conversations-rive"/>
            <p className="text-m font-bold text-gray-500 text-center mb-2">Create a group with your connections</p>
        </div>
    )
}

export default NoGroups;