import React from "react";
import {useRive} from "@rive-app/react-canvas";

const NoMoreUsersToExplore: React.FC = () => {
    const { rive, RiveComponent } = useRive({
        src: 'stasher_character.riv',
        autoplay: true,
    });

    return (
        <div className="flex flex-col items-center">
            <RiveComponent className="no-conversations-rive" />
            <p className="text-m font-bold text-gray-500 text-center mb-2">Awaiting new users to join</p>
        </div>
    )
}

export default NoMoreUsersToExplore;