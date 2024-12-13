import React from "react";
import {useRive} from "@rive-app/react-canvas";

const NoMoreGroupsToExplore: React.FC = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { RiveComponent } = useRive({
        src: '/rive/stasher_character.riv',
        autoplay: true,
    });

    return (
        <div className="no-more-users-or-groups">
            <RiveComponent className="no-conversations-rive ml-auto mr-auto"/>
            <p className="dark:text-white text-m font-bold text-gray-500 text-center mb-2 ">Awaiting new groups</p>
        </div>
    )
}

export default NoMoreGroupsToExplore;