import React, {useEffect} from "react";

interface NoMoreGroupsToExploreProps {
    message?: string | null;
}

const NoMoreGroupsToExplore: React.FC<NoMoreGroupsToExploreProps> = ({ message }) => {
    useEffect(() => {
        console.log(message)
    }, [message]);
    return (
        <div className="no-more-users-or-groups">
            <p className="dark:text-white text-m font-bold text-gray-500 text-center mb-2 ">
                {message ?? "Awaiting new groups"}
            </p>
        </div>
    );
};

export default NoMoreGroupsToExplore;
