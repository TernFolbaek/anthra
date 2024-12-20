// ExplorePage.tsx
import React, { useState } from 'react';
import './ExplorePage.css';
import Menu from './Menu';
import UserExplorePage from './UserExplorePage';
import GroupExplorePage from './GroupExplorePage';

const ExplorePage: React.FC = () => {
    const [activePage, setActivePage] = useState<'individuals' | 'groups'>('individuals');

    return (
        <div className="explore-page">
            <div  className="w-[100%] ">
                <Menu activePage={activePage} setActivePage={setActivePage} />
                {activePage === 'individuals' ? <UserExplorePage /> : <GroupExplorePage />}
            </div>
        </div>
    );
};

export default ExplorePage;
