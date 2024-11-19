// Components/GroupsLayout/GroupsLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';

const GroupsLayout: React.FC = () => {
    return (
        <div className="groups-page">
            <Outlet />
        </div>
    );
};

export default GroupsLayout;
