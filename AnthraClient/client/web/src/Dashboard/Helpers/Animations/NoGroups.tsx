import React from "react";
import {useRive} from "@rive-app/react-canvas";

const NoGroups: React.FC = () => {
    const { RiveComponent } = useRive({
        src: '/rive/no_connections.riv',
        autoplay: true,
    });

    return (
        <div className="no-connections-container">
            <RiveComponent className="no-conversations-rive"/>
            <p className="text-m font-bold dark:text-white text-center mb-2 ">Create a group with your connections</p>
        </div>
    )
}

export default NoGroups;