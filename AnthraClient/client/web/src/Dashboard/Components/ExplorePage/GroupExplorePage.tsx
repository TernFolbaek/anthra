import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './GroupExplorePage.css';
import NoMoreGroupsToExplore from '../../Helpers/Animations/NoMoreGroupsToExplore';
import ViewProfile from "../ViewProfile/ViewProfile";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface GroupMember {
    userId: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string;
    institution: string;
    statuses: string[];
    location: string;
}

interface Group {
    id: number;
    name: string;
    groupDescription: string;
    groupMemberDesire: string;
    groupPurpose: string;
    members: GroupMember[];
}

const GroupExplorePage: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
    const token = localStorage.getItem('token');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // States for page navigation and shake animation
    const [currentPage, setCurrentPage] = useState<number>(1); // 1 or 2
    const [shake, setShake] = useState<boolean>(false);

    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/GroupsExplore/GetGroups', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setGroups(response.data);
                console.log(response.data);
                setCurrentIndex(0);
            } catch (error) {
                console.error('Error fetching groups:', error);
            }
        };

        fetchGroups();
    }, [token]);

    useEffect(() => {
        if (groups.length > 0 && currentIndex < groups.length) {
            setCurrentGroup(groups[currentIndex]);
            setCurrentPage(1);
        } else {
            setCurrentGroup(null);
        }
    }, [groups, currentIndex]);

    const handleApply = async () => {
        if (currentGroup) {
            try {
                await axios.post(
                    'http://localhost:5001/api/GroupsExplore/ApplyToGroup',
                    { groupId: currentGroup.id },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            } catch (error: any) {
                if (error.response && error.response.data) {
                    alert(error.response.data);
                } else {
                    console.error('Error applying to group:', error);
                }
            }
        }
        setCurrentIndex(currentIndex + 1);
    };

    const handleSkip = async () => {
        if (currentGroup) {
            try {
                await axios.post(
                    'http://localhost:5001/api/GroupsExplore/SkipGroup',
                    {groupIdToSkip: currentGroup.id},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            } catch (error) {
                console.error('Error skipping group:', error);
            }
        }
        setCurrentIndex(currentIndex + 1);
    };

    const handleUserClick = (userId: string) => {
        setSelectedUserId(userId);
    };

    const handleCloseProfile = () => {
        setSelectedUserId(null);
    };

    // Compute data for charts if currentGroup is available
    let institutionCounts: Record<string, number> = {};
    let statusCounts: Record<string, number> = {};

    if (currentGroup && currentGroup.members) {
        currentGroup.members.forEach(member => {
            // Count institutions
            if (member.institution) {
                institutionCounts[member.institution] = (institutionCounts[member.institution] || 0) + 1;
            }

            // Count statuses
            member.statuses.forEach(status => {
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });
        });
    }

    const institutionNames = Object.keys(institutionCounts);
    const institutionValues = Object.values(institutionCounts);
    const statusNames = Object.keys(statusCounts);
    const statusValues = Object.values(statusCounts);

    const institutionData = {
        labels: institutionNames,
        datasets: [
            {
                label: 'Count',
                data: institutionValues,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
            },
        ],
    };

    const statusData = {
        labels: statusNames,
        datasets: [
            {
                label: 'Count',
                data: statusValues,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
        ],
    };

    const chartOptions = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: false,
            },
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                ticks: { precision: 0, beginAtZero: true }
            }
        }
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500); // Duration of the shake animation
    };

    const handlePageChange = (direction: 'left' | 'right') => {
        if (direction === 'left') {
            if (currentPage === 1) {
                triggerShake();
            } else {
                setCurrentPage(1);
            }
        } else if (direction === 'right') {
            if (currentPage === 2) {
                triggerShake();
            } else {
                setCurrentPage(2);
            }
        }
    };

    const handleLeftClick = () => handlePageChange('left');
    const handleRightClick = () => handlePageChange('right');

    return (
        <div className="group-explore-wrapper">
            {currentGroup ? (
                <div
                    className={`group-explore-card-wrapper ${shake ? 'group-explore-shake' : ''}`}
                    ref={cardRef}
                >
                    {/* Page Indicators */}
                    <div className="group-explore-page-indicators">
                        <div className={`group-explore-indicator ${currentPage === 1 ? 'active' : ''}`}></div>
                        <div className={`group-explore-indicator ${currentPage === 2 ? 'active' : ''}`}></div>
                    </div>

                    {/* Clickable Overlays for navigation */}
                    <div className="group-explore-click-overlay">
                        <div className="group-explore-click-area-left" onClick={handleLeftClick}></div>
                        <div className="group-explore-click-area-right" onClick={handleRightClick}></div>
                    </div>

                    {/* Page Content */}
                    {currentPage === 1 ? (
                        <div className="group-explore-page-content page-1">
                            <div className="group-explore-card-content">
                                <h2 className="group-explore-title">{currentGroup.name}</h2>
                                <h3 className="group-explore-section-heading">About the group:</h3>
                                <p className="group-explore-description">{currentGroup.groupDescription}</p>
                                <h3 className="group-explore-section-heading">What the group is looking for:</h3>
                                <p className="group-explore-member-desire break-all">{currentGroup.groupMemberDesire}</p>
                                <h3 className="group-explore-section-heading">Group Purpose:</h3>
                                <p className="group-explore-member-desire break-all">{currentGroup.groupPurpose}</p>
                                <div className="group-explore-info">
                                    <h3 className="group-explore-section-heading">Members</h3>
                                    <ul className="group-explore-members-list">
                                        {currentGroup.members.map((member) => (
                                            <li onClick={() => handleUserClick(member.userId)} key={member.userId}
                                                className="group-explore-member-item bg-sky-50">
                                                <img
                                                    className="group-explore-member-avatar"
                                                    src={`${member.profilePictureUrl}`}
                                                    alt={`${member.firstName} ${member.lastName}`}
                                                />
                                                <span className="font-semibold">
                                                    {member.firstName} {member.lastName}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="group-explore-page-content page-2">
                            <h2 className="font-semibold text-xl">Group members overview</h2>
                            {(institutionNames.length > 0 || statusNames.length > 0) && (
                                <div className="group-explore-charts-container">
                                    {institutionNames.length > 0 && (
                                        <div className="group-explore-chart-wrapper">
                                            <h4 className="group-explore-chart-heading">Institutions</h4>
                                            <div className="group-explore-chart-content">
                                                <Bar data={institutionData} options={chartOptions}/>
                                            </div>
                                        </div>
                                    )}
                                    {statusNames.length > 0 && (
                                        <div className="group-explore-chart-wrapper">
                                            <h4 className="group-explore-chart-heading">Statuses</h4>
                                            <div className="group-explore-chart-content">
                                                <Bar data={statusData} options={chartOptions}/>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <NoMoreGroupsToExplore/>
            )}

            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile}/>
            )}
            {currentGroup &&
            <div className="group-explore-button-container">
                <button className="group-explore-apply-button" onClick={handleApply}>
                    Apply
                </button>
                <button className="group-explore-skip-button" onClick={handleSkip}>
                    Skip
                </button>
            </div>
            }

        </div>
    );
};

export default GroupExplorePage;
