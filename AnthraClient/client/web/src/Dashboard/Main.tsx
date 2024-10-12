// src/main.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import DashboardNavbar from './Components/DashboardNavbar/DashboardNavbar';
import ExplorePage from './Components/ExplorePage/ExplorePage';
import Connections from './Components/Connections/Connections';
import Messages from './Components/Messages/Messages';
import Settings from './Components/Settings/Settings';
import Requests from './Components/Requests/Requests';
import Profile from './Components/Profile/Profile';
import MessageList from "./Components/MessageList/MessageList";
import Groups from './Components/Groups/Groups';
import Footer from './Components/Footer/Footer';
import GroupMessage from "./GroupMessages/GroupMessage";

import './Main.css';

const Dashboard: React.FC = () => {
    return (
        <Router>
            <div className="dashboard-container">
                <DashboardNavbar />
                <div className="content-wrapper">
                    <Sidebar />
                    <div className="main-content">
                        <Routes>
                            <Route path="/messages" element={<MessageList />} />
                            <Route path="/explore" element={<ExplorePage />} />
                            <Route path="/connections" element={<Connections />} />
                            <Route path="/messages/:userId" element={<Messages />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/requests" element={<Requests />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/groups/:groupId" element={<GroupMessage />} />
                            <Route path="/groups" element={<Groups />} />
                            <Route path="/" element={<ExplorePage />} />
                        </Routes>
                    </div>
                </div>
                <Footer /> {/* Add Footer */}
            </div>
        </Router>
    );
};

export default Dashboard;
