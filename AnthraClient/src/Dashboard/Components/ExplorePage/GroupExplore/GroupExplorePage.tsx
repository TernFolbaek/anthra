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
import { useSwipeable } from 'react-swipeable';
import Snackbar from "../../../Helpers/Snackbar/Snackbar"; // Import the swipeable hook

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
    // State for groups
    const [groups, setGroups] = useState<Group[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentGroup, setCurrentGroup] = useState<Group | null>(null);

    // Auth token
    const token = localStorage.getItem('token');

    // State for viewing profile
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
    const [snackbarTitle, setSnackbarTitle] = useState<string>('');
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    // Pagination and card animation
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [animating, setAnimating] = useState<boolean>(false);
    const [slideDirection, setSlideDirection] = useState<'in' | 'out'>('in');
    const cardRef = useRef<HTMLDivElement>(null);

    // Shake animation
    const [shake, setShake] = useState<boolean>(false);

    // Window size and chart font
    const windowWidth = useWindowWidth();
    const isSmallScreen = windowWidth < 480;
    let iconSize, chartFontSize;
    if (isSmallScreen) {
        iconSize = 40;
        chartFontSize = 10;
    } else {
        iconSize = 60;
        chartFontSize = 14;
    }

    // Dark mode detection
    const [isDarkMode, setIsDarkMode] = useState(false);
    useEffect(() => {
        const flag = localStorage.getItem('isDark');
        // Ensure the body class reflects the current dark mode setting on load
        if (flag === "true") {
            document.body.classList.add('dark');
            setIsDarkMode(true);
        } else {
            document.body.classList.remove('dark');
            setIsDarkMode(false);
        }
    }, []);

    // For the "see more" members modal
    const [showMembersModal, setShowMembersModal] = useState<boolean>(false);

    // This effect fetches groups
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await axios.get('/GroupsExplore/GetGroups', {
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

    // Whenever currentIndex changes, set currentGroup and reset page to 1
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

    // Apply to current group
    const handleApply = async () => {
        if (currentGroup) {
            try {
                await axios.post(
                    '/GroupsExplore/ApplyToGroup',
                    { groupId: currentGroup.id },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setSnackbarTitle('Application Request Sent');
                setSnackbarMessage(`You have sent a connection request to ${currentGroup.name}`);
                setSnackbarVisible(true);
            } catch (error: any) {
                if (error.response && error.response.data) {
                    // handle known error
                } else {
                    console.error('Error applying to group:', error);
                }
            }
        }
        // Trigger out animation then show next group

        setSlideDirection('out');
        setAnimating(true);
        setTimeout(animateToNextGroup, 300); // match CSS transition duration
    };

    // Skip current group
    const handleSkip = async () => {
        if (currentGroup) {
            try {
                await axios.post(
                    '/GroupsExplore/SkipGroup',
                    { groupIdToSkip: currentGroup.id },
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
        // Trigger out animation then show next group
        setSlideDirection('out');
        setAnimating(true);
        setTimeout(animateToNextGroup, 300);
    };

    // Clicking a user opens their profile
    const handleUserClick = (userId: string) => {
        setSelectedUserId(userId);
    };

    const handleCloseProfile = () => {
        setSelectedUserId(null);
    };

    // Count institutions & statuses in the group
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
                backgroundColor: 'rgba(54, 162, 235)',
            },
        ],
    };

    const statusData = {
        labels: statusNames,
        datasets: [
            {
                label: 'Count',
                data: statusValues,
                backgroundColor: 'rgba(75, 192, 192)',
            },
        ],
    };

    // Determine text color for charts based on dark mode
    const chartTextColor = isDarkMode ? '#ffffff' : '#000000';

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
                    color: chartTextColor,
                    font: {
                        size: chartFontSize,
                    },
                },
            },
            x: {
                ticks: {
                    color: chartTextColor,
                    font: {
                        size: chartFontSize,
                    },
                },
            },
        }
    };

    // Shake animation logic
    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    // Page change logic for the 2-page card
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

    // Icon for group purpose
    const groupPurposes = [
        { label: 'Social', value: 'social', icon: <MdGroups size={iconSize} /> },
        { label: 'General', value: 'general', icon: <FaChalkboardTeacher size={iconSize} /> },
        { label: 'Exam Preparation', value: 'exam preparation', icon: <FaBookReader size={iconSize} /> },
        { label: 'Studying', value: 'studying', icon: <FaLaptopCode size={iconSize} /> },
    ];

    const getGroupPurposeIcon = (purpose: string) => {
        const purposeObj = groupPurposes.find(p => p.value === purpose.toLowerCase());
        return purposeObj ? purposeObj.icon : <MdGroups size={iconSize} />;
    };

    // Swipe handlers for mobile
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
        delta: 50, // minimum distance(px) for a swipe
        trackMouse: false,
    });

    // Determine how many members to show at a glance
    const maxMembersToShow = isSmallScreen ? 3 : 6;
    const membersToShow = currentGroup?.members.slice(0, maxMembersToShow) || [];
    const extraMembersCount = currentGroup?.members.length
        ? currentGroup.members.length - maxMembersToShow
        : 0;

    // Close members modal
    const closeModal = () => {
        setShowMembersModal(false);
    };

    return (
        <div className="group-explore-wrapper">
            {currentGroup ? (
                <div
                    className={`group-explore-card-wrapper ${shake ? 'group-explore-shake' : ''} slide-${slideDirection}`}
                    {...(isSmallScreen ? swipeHandlers : {})}
                >
                    {/* Page Indicators */}
                    <div className="group-explore-page-indicators">
                        <div className={`group-explore-indicator ${currentPage === 1 ? 'active' : ''}`}></div>
                        <div className={`group-explore-indicator ${currentPage === 2 ? 'active' : ''}`}></div>
                    </div>

                    {/* Navigation Buttons for desktop */}
                    {!isSmallScreen && (
                        <>
                            <button className="navigate-button navigate-button-left" onClick={handleLeftClick}>
                                &larr;
                            </button>
                            <button className="navigate-button navigate-button-right" onClick={handleRightClick}>
                                &rarr;
                            </button>
                        </>
                    )}

                    {/* Page Content */}
                    {currentPage === 1 ? (
                        <div className="group-explore-page-content">
                            <div className="group-explore-card-content">
                                <div className="group-explore-header">
                                    <div className="group-explore-purpose bg-emerald-200 dark:bg-emerald-500">
                                        {getGroupPurposeIcon(currentGroup.groupPurpose)}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <h2 className="group-explore-title ">{currentGroup.name}</h2>
                                        <h2 className="font-semibold text-md text-emerald-500">Group Info</h2>
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
                                                className="group-explore-member-item hover:cursor-pointer bg-emerald-50 hover:bg-emerald-100  border-emerald-200 dark:border-emerald-600 border dark:hover:bg-gray-800/50 dark:bg-gray-700/50 "
                                            >
                                                <img
                                                    className="group-explore-member-avatar"
                                                    src={`${member.profilePictureUrl}`}
                                                    alt={`${member.firstName} ${member.lastName}`}
                                                />
                                                <span className="font-semibold dark:text-white">
                                                    {member.firstName} {member.lastName}
                                                </span>
                                            </li>
                                        ))}
                                        {extraMembersCount > 0 && (
                                            <li
                                                className="group-explore-member-item dark:border-emerald-600 border dark:hover:bg-gray-800/50 dark:bg-gray-700/50 more-members-button"
                                                onClick={() => setShowMembersModal(true)}
                                            >
                                                <span className="font-semibold text-emerald-400 underline">+ {extraMembersCount} more</span>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="group-explore-page-content ">
                            <div className="group-explore-header">
                                <div className="group-explore-purpose bg-emerald-200 dark:bg-emerald-500">
                                    {getGroupPurposeIcon(currentGroup.groupPurpose)}
                                </div>
                                <div className="flex flex-col items-start">
                                    <h2 className="group-explore-title">{currentGroup.name}</h2>
                                    <h2 className="font-semibold text-md text-emerald-500">Group Members Overview</h2>
                                </div>
                            </div>
                            {(institutionNames.length > 0 || statusNames.length > 0) && (
                                <div className="group-explore-charts-container">
                                    {institutionNames.length > 0 && (
                                        <div className="group-explore-chart-wrapper">
                                            <h4 className="group-explore-chart-heading">Institutions</h4>
                                            <div className="group-explore-chart-content">
                                                <Bar data={institutionData} options={chartOptions} />
                                            </div>
                                        </div>
                                    )}
                                    {statusNames.length > 0 && (
                                        <div className="group-explore-chart-wrapper">
                                            <h4 className="group-explore-chart-heading">Statuses</h4>
                                            <div className="group-explore-chart-content">
                                                <Bar data={statusData} options={chartOptions} />
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

            {/* Members Modal */}
            {showMembersModal && currentGroup && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-button" onClick={closeModal}>
                            &times;
                        </button>
                        <h2 className="modal-title font-medium">Group Members</h2>

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
                    <button className="text-white hover:bg-emerald-300 group-explore-apply-button bg-emerald-400 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:hover:text-white dark:text-gray-900 trasnform hover:scale-105" onClick={handleApply}>
                        Apply
                    </button>
                    <button className="text-emerald-400 hover:bg-emerald-300 hover:text-white hover:border-emerald-300 group-explore-skip-button border-2 border-emerald-400 dark:border-emerald-500 dark:text-emerald-400 dark:hover:border-emerald-400 dark:hover:bg-emerald-400 dark:hover:text-white  transform hover:scale-105" onClick={handleSkip}>
                        Skip
                    </button>
                </div>
            )}
            {snackbarVisible && !isSmallScreen && (
                <Snackbar
                    key={snackbarTitle + snackbarMessage}
                    title={snackbarTitle}
                    message={snackbarMessage}
                    duration={4000}
                    onClose={() => setSnackbarVisible(false)}
                />
            )}
        </div>
    );
};

export default GroupExplorePage;
