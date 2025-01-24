import React from "react";

interface NoMoreUsersToExploreProps {
    message?: string | null;
}

const NoMoreUsersToExplore: React.FC<NoMoreUsersToExploreProps> = ({ message }) => {
    return (
        <div className="no-more-users-or-groups">
            <p className="dark:text-white text-m font-bold text-gray-500 text-center mb-2 ">
                {message ?? "Awaiting new users to join"}
            </p>
        </div>
    );
};

export default NoMoreUsersToExplore;
