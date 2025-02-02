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
import Snackbar from "../../../Helpers/Snackbar/Snackbar";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
);

// ------------------- INTERFACES -------------------
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

// For storing in localStorage
interface CachedGroupsData {
    timestamp: number; // Date.now() of when we fetched
    groups: Group[];
}

const GroupExplorePage: React.FC = () => {
    // --------------- STATE ---------------
    const [groups, setGroups] = useState<Group[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentGroup, setCurrentGroup] = useState<Group | null>(null);

    // For local storage & skip / apply
    const token = localStorage.getItem('token');

    // For viewing profile
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Snackbar
    const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
    const [snackbarTitle, setSnackbarTitle] = useState<string>('');
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');

    // Card animation
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [animating, setAnimating] = useState<boolean>(false);
    const [slideDirection, setSlideDirection] = useState<'in' | 'out'>('in');
    const cardRef = useRef<HTMLDivElement>(null);

    // For showing the countdown
    const [intervalMessage, setIntervalMessage] = useState<string | null>(null);

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
        if (flag === "true") {
            document.body.classList.add('dark');
            setIsDarkMode(true);
        } else {
            document.body.classList.remove('dark');
            setIsDarkMode(false);
        }
    }, []);

    // Show "more members" modal
    const [showMembersModal, setShowMembersModal] = useState<boolean>(false);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await axios.get('/GroupsExplore/GetGroups', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const { mustWait, groups, message } = response.data;

                // Example:
                setIntervalMessage(message || null);
                setGroups(groups || []);
                setCurrentIndex(0);

                // if mustWait && !groups.length => user is locked out with no leftover
                // if mustWait && groups.length => leftover batch
                // if !mustWait && !groups.length => no groups found but not locked out
                // if !mustWait && groups.length => found new batch => locked out
            } catch (error) {
                console.error('Error fetching groups:', error);
            }
        };

        fetchGroups();
    }, [token]);


    // -------------- SET CURRENT GROUP -------------
    useEffect(() => {
        if (groups.length > 0 && currentIndex < groups.length) {
            setCurrentGroup(groups[currentIndex]);
            setCurrentPage(1);
            setSlideDirection('in');
        } else {
            setCurrentGroup(null);
        }
    }, [groups, currentIndex]);

    // -------------- REMOVE GROUP LOCALLY & UPDATE CACHE -------------
    const removeGroupFromList = (groupId: number) => {
        const updated = groups.filter(g => g.id !== groupId);
        setGroups(updated);

        // Update local storage too
        const cachedStr = localStorage.getItem('exploreGroupsData');
        if (cachedStr) {
            const cached: CachedGroupsData = JSON.parse(cachedStr);
            const newData: CachedGroupsData = {
                timestamp: cached.timestamp, // keep original timestamp
                groups: updated,
            };
            localStorage.setItem('exploreGroupsData', JSON.stringify(newData));
        }
    };

    // -------------- ANIMATION -------------
    const animateToNextGroup = () => {
        setCurrentIndex(prev => prev + 1);
        setCurrentPage(1);
        setAnimating(false);
    };

    // -------------- APPLY TO GROUP -------------
    const handleApply = async () => {
        if (!currentGroup) return;
        try {
            await axios.post(
                '/GroupsExplore/ApplyToGroup',
                { groupId: currentGroup.id },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setSnackbarTitle('Application Request Sent');
            setSnackbarMessage(`You have applied to ${currentGroup.name}.`);
            setSnackbarVisible(true);
        } catch (error: any) {
            console.error('Error applying to group:', error);
        }

        // Animate out & remove from list
        setSlideDirection('out');
        setAnimating(true);
        setTimeout(() => {
            removeGroupFromList(currentGroup.id);
        }, 300);
    };

    // -------------- SKIP GROUP -------------
    const handleSkip = async () => {
        if (!currentGroup) return;
        try {
            await axios.post(
                '/GroupsExplore/SkipGroup',
                { groupIdToSkip: currentGroup.id },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
        } catch (error) {
            console.error('Error skipping group:', error);
        }

        // Animate out & remove from list
        setSlideDirection('out');
        setAnimating(true);
        setTimeout(() => {
            removeGroupFromList(currentGroup.id);
        }, 300);
    };

    // -------------- VIEW PROFILE -------------
    const handleUserClick = (userId: string) => {
        setSelectedUserId(userId);
    };
    const handleCloseProfile = () => {
        setSelectedUserId(null);
    };

    // -------------- STATS (INSTITUTIONS / STATUSES) -------------
    let institutionCounts: Record<string, number> = {};
    let statusCounts: Record<string, number> = {};

    if (currentGroup?.members) {
        currentGroup.members.forEach(member => {
            if (member.institution) {
                institutionCounts[member.institution] = (institutionCounts[member.institution] || 0) + 1;
            }
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

    // Chart color
    const chartTextColor = isDarkMode ? '#ffffff' : '#000000';
    const chartOptions: ChartOptions<'bar'> = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: { display: false },
            legend: { display: false },
        },
        scales: {
            y: {
                ticks: {
                    color: chartTextColor,
                    font: { size: chartFontSize },
                },
            },
            x: {
                ticks: {
                    color: chartTextColor,
                    font: { size: chartFontSize },
                },
            },
        },
    };

    // -------------- SWIPE / PAGE LOGIC -------------
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
        } else {
            if (currentPage === 2) {
                triggerShake();
            } else {
                setCurrentPage(2);
            }
        }
    };
    const handleLeftClick = () => handlePageChange('left');
    const handleRightClick = () => handlePageChange('right');

    // Swipe handlers for mobile
    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => {
            if (currentPage === 1) setCurrentPage(2);
            else triggerShake();
        },
        onSwipedRight: () => {
            if (currentPage === 2) setCurrentPage(1);
            else triggerShake();
        },
        delta: 50,
        trackMouse: false,
    });

    // -------------- RENDER -------------
    // How many members to show
    const maxMembersToShow = isSmallScreen ? 3 : 6;
    const membersToShow = currentGroup?.members.slice(0, maxMembersToShow) || [];
    const extraMembersCount = currentGroup?.members.length
        ? currentGroup.members.length - maxMembersToShow
        : 0;

    const closeModal = () => setShowMembersModal(false);

    // Icon for group purpose
    const groupPurposes = [
        { label: 'Social', value: 'social', icon: <MdGroups size={iconSize} /> },
        { label: 'General', value: 'general', icon: <FaChalkboardTeacher size={iconSize} /> },
        { label: 'Exam Preparation', value: 'exam preparation', icon: <FaBookReader size={iconSize} /> },
        { label: 'Studying', value: 'studying', icon: <FaLaptopCode size={iconSize} /> },
    ];
    const getGroupPurposeIcon = (purpose: string) => {
        const found = groupPurposes.find(p => p.value === purpose.toLowerCase());
        return found ? found.icon : <MdGroups size={iconSize} />;
    };

    return (
        <div className="group-explore-wrapper">
            {/* If we have a currentGroup, show the card, else "No More Groups" */}
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

                    {/* Nav Buttons (desktop only) */}
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
                                        <h2 className="group-explore-title">{currentGroup.name}</h2>
                                        <h2 className="font-semibold text-md text-emerald-500">Group Info</h2>
                                    </div>
                                </div>
                                <h3 className="group-explore-section-heading">About the group:</h3>
                                <p className="group-explore-description">{currentGroup.groupDescription}</p>
                                <h3 className="group-explore-section-heading">What the group is looking for:</h3>
                                <p className="group-explore-member-desire break-normal">
                                    {currentGroup.groupMemberDesire}
                                </p>
                                <h3 className="group-explore-section-heading">Group Purpose:</h3>
                                <p className="group-explore-member-desire break-normal">
                                    {currentGroup.groupPurpose}
                                </p>
                                <div className="group-explore-info">
                                    <h3 className="group-explore-section-heading">Members</h3>
                                    <ul className="group-explore-members-list">
                                        {membersToShow.map(member => (
                                            <li
                                                onClick={() => handleUserClick(member.userId)}
                                                key={member.userId}
                                                className="group-explore-member-item hover:cursor-pointer bg-emerald-100 hover:bg-emerald-100 dark:bg-black/30 dark:hover:bg-black/10"
                                            >
                                                <img
                                                    className="group-explore-member-avatar"
                                                    src={member.profilePictureUrl}
                                                    alt={`${member.firstName} ${member.lastName}`}
                                                />
                                                <span className="group-member-name font-semibold dark:text-gray-200">
                                                    {member.firstName} {member.lastName}
                                                </span>
                                            </li>
                                        ))}
                                        {extraMembersCount > 0 && (
                                            <li
                                                className="dark:hover:bg-gray-800/50 more-members-button"
                                                onClick={() => setShowMembersModal(true)}
                                            >
                                                <span className="font-semibold text-emerald-400 underline">
                                                    + {extraMembersCount} more
                                                </span>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="group-explore-page-content">
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
                // If there's no currentGroup, we show <NoMoreGroupsToExplore> with the countdown message if any
                <NoMoreGroupsToExplore message={intervalMessage} />
            )}

            {/* Members Modal */}
            {showMembersModal && currentGroup && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close-button" onClick={closeModal}>
                            &times;
                        </button>
                        <h2 className="modal-title font-medium">Group Members</h2>
                        <div className="modal-members-container">
                            <ul className="modal-members-list">
                                {currentGroup.members.map(member => (
                                    <li
                                        onClick={() => handleUserClick(member.userId)}
                                        key={member.userId}
                                        className="modal-member-item"
                                    >
                                        <img
                                            className="modal-member-avatar"
                                            src={member.profilePictureUrl}
                                            alt={`${member.firstName} ${member.lastName}`}
                                        />
                                        <div className="flex flex-col items-start">
                                            <p className="font-semibold">
                                                {member.firstName} {member.lastName}
                                            </p>
                                            <p className="text-xs dark:text-gray-300 text-gray-500 font-medium">
                                                {member.institution}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* View profile */}
            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile}/>
            )}

            {/* Action Buttons */}
            {currentGroup && (
                <div className="group-explore-button-container">
                    <button
                        className="text-emerald-400 hover:bg-emerald-300 hover:text-white hover:border-emerald-300 group-explore-skip-button border-2 border-emerald-400 dark:border-emerald-500 dark:text-emerald-400 dark:hover:border-emerald-400 dark:hover:bg-emerald-400 dark:hover:text-white transform hover:scale-105"
                        onClick={handleSkip}
                    >
                        Skip
                    </button>
                    <button
                        className="text-white hover:bg-emerald-300 group-explore-apply-button bg-emerald-400 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:hover:text-white transform hover:scale-105"
                        onClick={handleApply}
                    >
                        Apply
                    </button>
                </div>
            )}

            {/* Snackbar */}
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
