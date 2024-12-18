// src/main.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import ExplorePage from './Components/ExplorePage/ExplorePage';
import Connections from './Components/Connections/Connections';
import Messages from './Components/Messages/Messages';
import Settings from './Components/Settings/Settings';
import Profile from './Components/Profile/Profile';
import Groups from './Components/Groups/Groups';
import Footer from './Components/Footer/Footer';
import MessagesLayout from './Layouts/MessagesLayout/MessagesLayout';
import GroupsLayout from './Layouts/GroupsLayout/GroupsLayout';
import MessageOptionalLayout from "./Layouts/MessageOptionalLayout/MessageOptionalLayout";
import './Main.css';
import DevelopmentTools from "../DevelopmentTools";

const DashboardContent: React.FC = () => {
    const location = useLocation();
    const isMobile = window.innerWidth <= 480;

    // Check if the path matches "/messages/:userId" or "/groups/:groupId"
    const isUserSpecificMessage = /^\/messages\/[^/]+$/.test(location.pathname);
    const isGroupSpecificPage = /^\/groups\/[^/]+$/.test(location.pathname);

    // If on a specific user/group page and on mobile, hide the footer
    const shouldHideFooter = isMobile && (isUserSpecificMessage || isGroupSpecificPage);

    return (
        <div className="dashboard-container">
            <div className="content-wrapper">
                <Sidebar />
                <div className="main-content">
                    <Routes>
                        <Route element={<MessagesLayout />}>
                            <Route path="/messages" element={<Messages />} />
                            <Route path="/messages/:userId" element={<Messages />} />
                        </Route>
                        <Route path="/groups" element={<GroupsLayout />}>
                            <Route index element={<Groups />} />
                            <Route path=":groupId" element={<Groups />} />
                        </Route>
                        <Route element={<MessageOptionalLayout/>}>
                            <Route path="/connections" element={<Connections />} />
                            <Route path="/settings" element={<Settings />} />
                        </Route>
                        <Route path="/" element={<ExplorePage />} />
                        <Route path="/explore" element={<ExplorePage />} />
                        <Route path="/profile" element={<Profile />} />
                    </Routes>
                </div>
            </div>
            {/*{process.env.NODE_ENV === 'development' && <DevelopmentTools />}*/}

            {!shouldHideFooter && <Footer />}
        </div>
    );
};

const Dashboard: React.FC = () => {
    return (
        <Router>
            <DashboardContent />
        </Router>
    );
};

export default Dashboard;
