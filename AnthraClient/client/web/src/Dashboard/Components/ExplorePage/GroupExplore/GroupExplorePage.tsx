// GroupExplorePage.tsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './GroupExplorePage.css';
import NoMoreGroupsToExplore from '../../../Helpers/Animations/NoMoreGroupsToExplore';
import ViewProfile from "../../ViewProfile/ViewProfile";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { MdGroups } from "react-icons/md";
import { FaChalkboardTeacher, FaBookReader, FaLaptopCode } from "react-icons/fa";
import useWindowWidth from "../../../hooks/useWindowWidth";
import { useSwipeable } from 'react-swipeable'; // Import the swipeable hook

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
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

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [shake, setShake] = useState<boolean>(false);
    const windowWidth = useWindowWidth();
    const isSmallScreen = windowWidth < 480;

    let iconSize, chartFontSize;
    if(isSmallScreen) {
        iconSize = 40;
        chartFontSize = 10;
    } else {
        iconSize = 60;
        chartFontSize = 14;
    }
    const [animating, setAnimating] = useState<boolean>(false);
    const [slideDirection, setSlideDirection] = useState<'in' | 'out'>('in');

    const cardRef = useRef<HTMLDivElement>(null);

    const groupPurposes = [
        { label: 'Social', value: 'social', icon: <MdGroups size={iconSize} /> },
        { label: 'General', value: 'general', icon: <FaChalkboardTeacher size={iconSize} /> },
        { label: 'Exam Preparation', value: 'exam preparation', icon: <FaBookReader size={iconSize} /> },
        { label: 'Studying', value: 'studying', icon: <FaLaptopCode size={iconSize} /> },
    ];

    const [showMembersModal, setShowMembersModal] = useState<boolean>(false);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/GroupsExplore/GetGroups', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setGroups(response.data);
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
            // New group appears, slide it in
            setSlideDirection('in');
        } else {
            setCurrentGroup(null);
        }
    }, [groups, currentIndex]);

    const animateToNextGroup = () => {
        setCurrentIndex(prev => prev + 1);
        setCurrentPage(1);
        setAnimating(false);
    };

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
                } else {
                    console.error('Error applying to group:', error);
                }
            }
        }
        // Trigger out animation before showing next group
        setSlideDirection('out');
        setAnimating(true);
        setTimeout(animateToNextGroup, 300); // match CSS transition duration
    };

    const handleSkip = async () => {
        if (currentGroup) {
            try {
                await axios.post(
                    'http://localhost:5001/api/GroupsExplore/SkipGroup',
                    { groupIdToSkip: currentGroup.id },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                // Optionally, show a success message or update state
            } catch (error) {
                console.error('Error skipping group:', error);
            }
        }
        // Trigger out animation before showing next group
        setSlideDirection('out');
        setAnimating(true);
        setTimeout(animateToNextGroup, 300);
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

    const chartOptions: ChartOptions<'bar'> = {
        indexAxis: 'y',
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
            y: {
                ticks: {
                    color: 'black',
                    font: {
                        size: chartFontSize,
                    },
                },
            },
        }
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
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

    const getGroupPurposeIcon = (purpose: string) => {
        const purposeObj = groupPurposes.find(p => p.value === purpose.toLowerCase());
        return purposeObj ? purposeObj.icon : <MdGroups size={iconSize} />;
    };

    // Swipe handlers
    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => {
            if (currentPage === 1) {
                setCurrentPage(2);
            } else {
                triggerShake();
            }
        },
        onSwipedRight: () => {
            if (currentPage === 2) {
                setCurrentPage(1);
            } else {
                triggerShake();
            }
        },
        // Prevent vertical swipes from triggering horizontal actions
        delta: 50, // minimum distance(px) before a swipe is detected
        trackMouse: false,
    });

    // Determine how many members to show based on screen size
    const maxMembersToShow = isSmallScreen ? 3 : 6;
    const membersToShow = currentGroup?.members.slice(0, maxMembersToShow) || [];
    const extraMembersCount = currentGroup?.members.length
        ? currentGroup.members.length - maxMembersToShow
        : 0;

    const closeModal = () => {
        setShowMembersModal(false);
    };

    return (
        <div className="group-explore-wrapper">
            {currentGroup ? (
                // Apply swipe handlers only on mobile
                <div
                    className={`group-explore-card-wrapper ${shake ? 'group-explore-shake' : ''} slide-${slideDirection}`}
                    {...(isSmallScreen ? swipeHandlers : {})}
                >
                    {/* Page Indicators */}
                    <div className="group-explore-page-indicators">
                        <div className={`group-explore-indicator ${currentPage === 1 ? 'active' : ''}`}></div>
                        <div className={`group-explore-indicator ${currentPage === 2 ? 'active' : ''}`}></div>
                    </div>

                    {/* Clickable Overlays for navigation (only on desktop) */}
                    {!isSmallScreen && (
                        <div className="group-explore-click-overlay">
                            <div className="group-explore-click-area-left" onClick={handleLeftClick}></div>
                            <div className="group-explore-click-area-right" onClick={handleRightClick}></div>
                        </div>
                    )}

                    {/* Page Content */}
                    {currentPage === 1 ? (
                        <div className="group-explore-page-content">
                            <div className="group-explore-card-content">
                                <div className="group-explore-header">
                                    <div className="group-explore-purpose">
                                        {getGroupPurposeIcon(currentGroup.groupPurpose)}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <h2 className="group-explore-title ">{currentGroup.name}</h2>
                                        <h2 className="font-semibold text-lg text-gray-600 dark:text-gray-400">Group Info</h2>
                                    </div>
                                </div>
                                <h3 className="group-explore-section-heading">About the group:</h3>
                                <p className="group-explore-description">{currentGroup.groupDescription}</p>
                                <h3 className="group-explore-section-heading">What the group is looking for:</h3>
                                <p className="group-explore-member-desire break-all">{currentGroup.groupMemberDesire}</p>
                                <h3 className="group-explore-section-heading">Group Purpose:</h3>
                                <p className="group-explore-member-desire break-all">{currentGroup.groupPurpose}</p>
                                <div className="group-explore-info">
                                    <h3 className="group-explore-section-heading">Members</h3>
                                    <ul className="group-explore-members-list">
                                        {membersToShow.map((member) => (
                                            <li
                                                onClick={() => handleUserClick(member.userId)}
                                                key={member.userId}
                                                className="group-explore-member-item bg-sky-50"
                                            >
                                                <img
                                                    className="group-explore-member-avatar"
                                                    src={`${member.profilePictureUrl}`}
                                                    alt={`${member.firstName} ${member.lastName}`}
                                                />
                                                <span className="font-semibold dark:text-black">
                                                    {member.firstName} {member.lastName}
                                                </span>
                                            </li>
                                        ))}
                                        {extraMembersCount > 0 && (
                                            <li
                                                className="group-explore-member-item bg-sky-50 more-members-button"
                                                onClick={() => setShowMembersModal(true)}
                                            >
                                                <span className="font-semibold">+ {extraMembersCount} more</span>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="group-explore-page-content ">
                            <div className="group-explore-header">
                                <div className="group-explore-purpose">
                                    {getGroupPurposeIcon(currentGroup.groupPurpose)}
                                </div>
                                <div className="flex flex-col items-start">
                                    <h2 className="group-explore-title">{currentGroup.name}</h2>
                                    <h2 className="font-semibold text-lg text-gray-600 dark:text-gray-400">Group Members Overview</h2>
                                </div>

                            </div>
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

            {showMembersModal && currentGroup && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-button" onClick={closeModal}>
                            &times;
                        </button>
                        <h2 className="modal-title font-medium">Group Members</h2>

                        {/* New Container for Members List */}
                        <div className="modal-members-container">
                            <ul className="modal-members-list">
                                {currentGroup.members.map((member) => (
                                    <li
                                        onClick={() => {
                                            handleUserClick(member.userId);
                                            closeModal();
                                        }}
                                        key={member.userId}
                                        className="modal-member-item"
                                    >
                                        <img
                                            className="modal-member-avatar"
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
            )}


            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile}/>
            )}

            {currentGroup && (
                <div className="group-explore-button-container">
                    <button className="group-explore-apply-button" onClick={handleApply}>
                        Apply
                    </button>
                    <button className="group-explore-skip-button" onClick={handleSkip}>
                        Skip
                    </button>
                </div>
            )}
        </div>
    );

};

export default GroupExplorePage;
