// src/main.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import ExplorePage from './Components/ExplorePage/ExplorePage';
import Connections from './Components/Connections/Connections';
import Messages from './Components/Messages/Messages';
import Settings from './Components/Settings/Settings';
import Requests from './Components/Requests/Requests';
import Profile from './Components/Profile/Profile';
import Groups from './Components/Groups/Groups';
import Footer from './Components/Footer/Footer';
import MessagesLayout from './Components/MessagesLayout/MessagesLayout';
import GroupsLayout from './Components/GroupsLayout/GroupsLayout';

import './Main.css';

const Dashboard: React.FC = () => {
    return (
        <Router>
            <div className="dashboard-container">
                <div className="content-wrapper">
                    <Sidebar />
                    <div className="main-content">
                        <Routes>
                            {/* Routes that share CurrentConversations */}
                            <Route element={<MessagesLayout />}>
                                <Route path="/" element={<ExplorePage />} />
                                <Route path="/explore" element={<ExplorePage />} />
                                <Route path="/messages" element={<Messages />} />
                                <Route path="/messages/:userId" element={<Messages />} />
                                <Route path="/connections" element={<Connections />} />
                                <Route path="/requests" element={<Requests />} />
                            </Route>
                            {/* Other routes */}
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/groups" element={<GroupsLayout />}>
                                <Route index element={<Groups />} />
                                <Route path=":groupId" element={<Groups />} />
                            </Route>
                        </Routes>
                    </div>
                </div>
                <Footer />
            </div>
        </Router>
    );
};

export default Dashboard;
