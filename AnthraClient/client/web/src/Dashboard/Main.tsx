import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import Navbar from './Components/DashboardNavbar/DashboardNavbar';
import ExplorePage from './Components/ExplorePage/ExplorePage';
import Connections from './Components/Connections/Connections';
import Messages from './Components/Messages/Messages';
import Settings from './Components/Settings/Settings';
import Requests from './Components/Requests/Requests';
import Profile from './Components/Profile/Profile';
import './Main.css';

const Dashboard: React.FC = () => {
    return (
        <Router>
            <div className="dashboard-container">
                <Sidebar />
                <div className="main-content">
                    <Navbar />
                    <div className="content-area">
                        <Routes>
                            <Route path="/explore" element={<ExplorePage />} />
                            <Route path="/connections" element={<Connections />} />
                            <Route path="/messages" element={<Messages />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/requests" element={<Requests />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/" element={<ExplorePage />} /> {/* Default route */}
                        </Routes>
                    </div>
                </div>
            </div>
        </Router>
    );
};

export default Dashboard;
