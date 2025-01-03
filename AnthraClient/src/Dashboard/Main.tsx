// src/main.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import Footer from './Components/Footer/Footer';
import ExplorePage from './Components/ExplorePage/ExplorePage';
import Connections from './Components/Connections/Connections';
import Messages from './Components/Messages/Messages';
import Settings from './Components/Settings/Settings';
import Profile from './Components/Profile/Profile';
import Groups from './Components/Groups/Groups';
import MessagesLayout from './Layouts/MessagesLayout/MessagesLayout';
import GroupsLayout from './Layouts/GroupsLayout/GroupsLayout';
import MessageOptionalLayout from "./Layouts/MessageOptionalLayout/MessageOptionalLayout";
import './Main.css';
import DevelopmentTools from "../DevelopmentTools";
import Notifications from "./Components/Notifications/Notifications";
import { NotificationProvider } from "./context/NotificationsContext";
import useWindowWidth from "./hooks/useWindowWidth";

const DashboardContent: React.FC = () => {
    const location = useLocation();
    const windowWidth = useWindowWidth();
    const isMobile = windowWidth < 480;
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    // Check if the path matches "/messages/:userId" or "/groups/:groupId"
    const isUserSpecificMessage = /^\/messages\/[^/]+$/.test(location.pathname);
    const isGroupSpecificPage = /^\/groups\/[^/]+$/.test(location.pathname);

    // If on a specific user/group page and on mobile, hide the footer
    const shouldHideFooter = isMobile && (isUserSpecificMessage || isGroupSpecificPage);

    // Function to toggle Settings
    const toggleSettings = () => {
        setIsSettingsOpen(!isSettingsOpen);
    };

    // Prevent background scrolling when Settings is open
    useEffect(() => {
        if (isSettingsOpen) {
            document.body.classList.add('settings-open');
        } else {
            document.body.classList.remove('settings-open');
        }

        // Cleanup on unmount
        return () => {
            document.body.classList.remove('settings-open');
        };
    }, [isSettingsOpen]);

    return (
        <NotificationProvider>
            <div className="dashboard-container">
                {isMobile && (<Notifications />)}
                <div className="content-wrapper">
                    {/* Pass the toggleSettings function as a prop to Sidebar */}
                    <Sidebar onSettingsClick={toggleSettings} />
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
                                {/* Removed Settings route */}
                            </Route>
                            <Route path="/" element={<ExplorePage />} />
                            <Route path="/explore" element={<ExplorePage />} />
                            <Route path="/profile" element={<Profile />} />
                        </Routes>
                    </div>
                </div>
                {/*{process.env.NODE_ENV === 'development' && <DevelopmentTools />}*/}

                {!shouldHideFooter && (
                    // Pass the toggleSettings function as a prop to Footer
                    <Footer onSettingsClick={toggleSettings} />
                )}

                {/* Render Settings as a sliding card */}
                {isSettingsOpen && <Settings onClose={toggleSettings} />}
            </div>
        </NotificationProvider>
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
