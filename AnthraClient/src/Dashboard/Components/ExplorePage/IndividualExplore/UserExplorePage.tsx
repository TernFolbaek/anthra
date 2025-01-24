import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './UserExplorePage.css';
import NoMoreUsersToExplore from '../../../Helpers/Animations/NoMoreUsersToExplore';
import Snackbar from "../../../Helpers/Snackbar/Snackbar";
import ReferModal from '../ReferModal/ReferModal';
import useWindowWidth from '../../../hooks/useWindowWidth';
import { useSwipeable } from 'react-swipeable';
import { FaCog, FaBookOpen, FaPencilAlt } from "react-icons/fa";

// -------------- INTERFACES -----------------
interface Course {
    courseName: string;
    courseLink: string;
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    location: string;
    institution: string;
    work: string;
    courses: Course[];
    subjects: string[];
    statuses: string[];
    aboutMe: string;
    age: number;
    profilePictureUrl: string;
}

interface UserExplorePageProps {
    onSettingsClick: () => void;
}

// We can store the fetched time + user array in localStorage:
interface CachedUsersData {
    timestamp: number; // Date.now() of when we fetched
    users: User[];
}

// -------------- COMPONENT ------------------
const UserExplorePage: React.FC<UserExplorePageProps> = ({ onSettingsClick }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [intervalMessage, setIntervalMessage] = useState<string | null>(null);
    const token = localStorage.getItem('token');

    // For UI feedback
    const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
    const [snackbarTitle, setSnackbarTitle] = useState<string>('');
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [showReferModal, setShowReferModal] = useState(false);

    // For mobile swipe / small screen
    const windowWidth = useWindowWidth();
    const isSmallScreen = windowWidth < 480;
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [shake, setShake] = useState<boolean>(false);

    // For card animation
    const [animating, setAnimating] = useState<boolean>(false);
    const [slideDirection, setSlideDirection] = useState<'in' | 'out'>('in');
    const cardRef = useRef<HTMLDivElement>(null);

    // -------------- USEEFFECT: LOAD USERS -------------
    useEffect(() => {
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        const updateIntervalMessage = (cachedTimestamp: number) => {
            const now = Date.now();
            const elapsed = now - cachedTimestamp;
            const remaining = TWENTY_FOUR_HOURS - elapsed;

            if (remaining <= 0) {
                setIntervalMessage(null);
                return;
            }

            // Calculate hours/minutes left
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            if(hours === 0 && minutes === 0){
                setIntervalMessage(null);
            }else{
                setIntervalMessage(`You can connect again in : ${hours}h ${minutes}m`);
            }
        };

        // 1. Attempt to load from localStorage
        const cachedStr = localStorage.getItem('exploreUsersData');
        if (cachedStr) {
            const cached: CachedUsersData = JSON.parse(cachedStr);
            const now = Date.now();

            // If it's still under 24h old, use it
            if (now - cached.timestamp < TWENTY_FOUR_HOURS) {
                setUsers(cached.users);
                setCurrentIndex(0);

                updateIntervalMessage(cached.timestamp);

                const timerId = setInterval(() => {
                    updateIntervalMessage(cached.timestamp);
                }, 60000);

                return () => clearInterval(timerId);
            }
        }

        // 2. Otherwise, fetch fresh from server
        const fetchUsers = async () => {
            try {
                const response = await axios.get('/Explore/GetUsers', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const newUsers: User[] = response.data;
                setUsers(newUsers);
                setCurrentIndex(0);

                // Save to localStorage with current timestamp
                const dataToCache: CachedUsersData = {
                    timestamp: Date.now(),
                    users: newUsers,
                };
                localStorage.setItem('exploreUsersData', JSON.stringify(dataToCache));
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, [token]);

    // -------------- USEEFFECT: SET CURRENT USER -------------
    useEffect(() => {
        if (users.length > 0 && currentIndex < users.length) {
            setCurrentUser(users[currentIndex]);
            setCurrentPage(1);
            setSlideDirection('in');
        } else {
            setCurrentUser(null);
        }
    }, [users, currentIndex]);

    // -------------- ANIMATE TO NEXT USER -------------
    const animateToNextUser = () => {
        setCurrentIndex(prev => prev + 1);
        setCurrentPage(1);
        setAnimating(false);
        setSlideDirection('in');
    };

    // -------------- REMOVE A USER LOCALLY & UPDATE STORAGE -------------
    // We'll call this whenever we skip or connect, so local storage stays in sync
    const removeUserFromList = (userId: string) => {
        const updatedUsers = users.filter(u => u.id !== userId);
        setUsers(updatedUsers);

        // Also update local storage so that next time we load, it's accurate
        const cachedStr = localStorage.getItem('exploreUsersData');
        if (cachedStr) {
            const cached: CachedUsersData = JSON.parse(cachedStr);
            const newData: CachedUsersData = {
                timestamp: cached.timestamp, // keep the same original fetch time
                users: updatedUsers,
            };
            localStorage.setItem('exploreUsersData', JSON.stringify(newData));
        }
    };

    // -------------- HANDLE CONNECT -------------
    const handleConnect = async () => {
        if (!currentUser) return;
        try {
            await axios.post(
                '/Connections/SendRequest',
                { targetUserId: currentUser.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSnackbarTitle('Connection Request Sent');
            setSnackbarMessage(`You have sent a connection request to ${currentUser.firstName} ${currentUser.lastName}.`);
            setSnackbarVisible(true);
        } catch (error) {
            console.error('Error sending connection request:', error);
        }

        // Remove from list, animate to next
        setSlideDirection('out');
        setAnimating(true);
        setTimeout(() => {
            removeUserFromList(currentUser.id);
            // No need to call setCurrentIndex(prev => prev+1) if we just removed user from array
        }, 300);
    };

    // -------------- HANDLE SKIP -------------
    const handleSkip = async () => {
        if (!currentUser) return;
        try {
            await axios.post(
                '/Explore/SkipUser',
                { UserIdToSkip: currentUser.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error('Error skipping user:', error);
        }

        // Remove from list, animate to next
        setSlideDirection('out');
        setAnimating(true);
        setTimeout(() => {
            removeUserFromList(currentUser.id);
        }, 300);
    };

    // -------------- SWIPE LOGIC FOR MOBILE -------------
    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => {
            // Switch to page 2 if on page1
            if (currentPage === 1) {
                setCurrentPage(2);
            } else {
                triggerShake();
            }
        },
        onSwipedRight: () => {
            // Switch to page 1 if on page2
            if (currentPage === 2) {
                setCurrentPage(1);
            } else {
                triggerShake();
            }
        },
        delta: 50,
        trackMouse: false,
    });

    // -------------- RENDER -------------
    return (
        <div className="user-explore-container">
            {isSmallScreen && (
                <div onClick={onSettingsClick} className="settings-explore-mobile">
                    <FaCog className="sidebar-icon"/>
                    <span className="tooltip">Settings</span>
                </div>
            )}

            {/* If we have a current user, show the card. Otherwise, <NoMoreUsersToExplore> */}
            {currentUser ? (
                <div
                    className={`explore-user-card ${isSmallScreen ? 'small-screen' : ''} ${shake ? 'shake' : ''} slide-${slideDirection}`}
                    {...(isSmallScreen ? swipeHandlers : {})}
                >
                    {/* Page Indicators (for small screens) */}
                    {isSmallScreen && (
                        <div className="page-indicators">
                            <div className={`indicator ${currentPage === 1 ? 'active' : ''}`}></div>
                            <div className={`indicator ${currentPage === 2 ? 'active' : ''}`}></div>
                        </div>
                    )}

                    {/* Page Content (two-page swipe for small screen, single page for desktop) */}
                    {isSmallScreen ? (
                        <div className="small-screen-content">
                            {currentPage === 1 ? (
                                <div className="page-content page-1">
                                    <div className="flex items-center gap-2">
                                        <img
                                            className="explore-user-card-img"
                                            src={currentUser.profilePictureUrl}
                                            alt="Profile"
                                        />
                                        <div className="flex flex-col">
                                            <h2 className="user-name">
                                                {currentUser.firstName} {currentUser.lastName} {currentUser.age}
                                            </h2>
                                            <p className="user-location font-semibold dark:text-emerald-400 text-emerald-500">
                                                {currentUser.location}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="user-info">
                                        <div className="flex flex-col bg-emerald-100 dark:bg-emerald-500/10 rounded-lg p-1">
                                            <h3 className="dark:text-emerald-400 text-emerald-500">Institution</h3>
                                            <div className="flex gap-1 items-center">
                                                <FaBookOpen size={12} color={"#6AD09D"} />
                                                <p className="font-medium dark:text-gray-300">
                                                    {currentUser.institution}
                                                </p>
                                            </div>
                                            <h3 className="dark:text-emerald-400 text-emerald-500">Work</h3>
                                            <div className="flex gap-1 items-center">
                                                <FaPencilAlt size={12} color={"#6AD09D"} />
                                                <p className="font-medium dark:text-gray-300">
                                                    {currentUser.work}
                                                </p>
                                            </div>
                                        </div>
                                        <h3 className="dark:text-emerald-400 text-emerald-500 break-all">About Me</h3>
                                        <p className="break-all">{currentUser.aboutMe}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="page-content page-2">
                                    <div className="flex items-center gap-2">
                                        <img
                                            className="explore-user-card-img"
                                            src={currentUser.profilePictureUrl}
                                            alt="Profile"
                                        />
                                        <div className="flex flex-col">
                                            <h2 className="user-name">
                                                {currentUser.firstName} {currentUser.lastName}, {currentUser.age}
                                            </h2>
                                            <p className="user-location font-semibold dark:text-emerald-400 text-emerald-500">
                                                {currentUser.location}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="user-info">
                                        <div className="flex flex-col bg-emerald-100 dark:bg-emerald-500/10 rounded-lg p-1">
                                            {currentUser.subjects && currentUser.subjects.length > 0 && (
                                                <div>
                                                    <h3 className="dark:text-emerald-400 text-emerald-500">Subjects</h3>
                                                    <p>{currentUser.subjects.join(', ')}</p>
                                                </div>
                                            )}
                                            {currentUser.courses && currentUser.courses.length > 0 && (
                                                <div>
                                                    <h3 className="dark:text-emerald-400 text-emerald-500">Courses</h3>
                                                    <ul className="dark:text-emerald-400">
                                                        {currentUser.courses.map((course, index) => (
                                                            <li key={index}>
                                                                <a
                                                                    href={course.courseLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-emerald-500 dark:text-emerald-400"
                                                                >
                                                                    {course.courseName}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                        {currentUser.statuses && currentUser.statuses.length > 0 && (
                                            <div className="user-explore-statuses">
                                                <h3 className="dark:text-emerald-400">Status</h3>
                                                <div className="flex gap-2 text-xs text-center">
                                                    {currentUser.statuses.map((st, i) => (
                                                        <p
                                                            key={i}
                                                            className="status-tag-explore text-center p-1 text-white bg-emerald-400"
                                                        >
                                                            {st}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // ---------------- DESKTOP LAYOUT ----------------
                        <div className="flex flex-col">
                            <div className="explore-user-card-content">
                                <div className="flex items-center gap-2 mb-10">
                                    <img
                                        className="explore-user-card-img"
                                        src={currentUser.profilePictureUrl}
                                        alt="Profile"
                                    />
                                    <div className="flex flex-col">
                                        <h2 className="user-name">
                                            {currentUser.firstName} {currentUser.lastName}, {currentUser.age}
                                        </h2>
                                        <p className="user-location font-semibold text-emerald-400">
                                            {currentUser.location}
                                        </p>
                                    </div>
                                </div>
                                <div className="user-info">
                                    <div className="flex gap-5">
                                        <div className="flex flex-col flex-1 gap-4">
                                            <div
                                                className="flex px-5 py-2 gap-5 dark:bg-emerald-500/10 bg-emerald-100 w-fit rounded-xl backdrop-blur-sm dark:border-gray-600 items-center"
                                            >
                                                <div className="flex flex-col">
                                                    <h3 className="dark:text-emerald-400 text-emerald-500">Institution</h3>
                                                    <div className="flex gap-1 items-center">
                                                        <FaBookOpen size={14} color={"#6AD09D"} />
                                                        <p className="font-medium dark:text-gray-300">
                                                            {currentUser.institution}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <h3 className="dark:text-emerald-400 text-emerald-500">Work</h3>
                                                    <div className="flex gap-1 items-center">
                                                        <FaPencilAlt size={14} color={"#6AD09D"} />
                                                        <p className="font-medium dark:text-gray-300">
                                                            {currentUser.work}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <h3 className="dark:text-emerald-400 text-emerald-500">About Me</h3>
                                                <p className="break-all">{currentUser.aboutMe}</p>
                                            </div>
                                            {currentUser.statuses && currentUser.statuses.length > 0 && (
                                                <div className="user-explore-statuses">
                                                    <h3 className="dark:text-emerald-400">Status</h3>
                                                    <div className="flex gap-2">
                                                        {currentUser.statuses.map((st, i) => (
                                                            <p
                                                                key={i}
                                                                className="status-tag-explore text-center text-white bg-emerald-400"
                                                            >
                                                                {st}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            className="flex max-w-[35%] min-w-[25%] flex-col px-5 py-2 gap-10 dark:bg-emerald-500/10 bg-emerald-100 w-fit rounded-xl backdrop-blur-sm dark:border-gray-600"
                                        >
                                            {currentUser.subjects && currentUser.subjects.length > 0 && (
                                                <div>
                                                    <h3 className="dark:text-emerald-400 text-emerald-500">Subjects</h3>
                                                    <p>{currentUser.subjects.join(', ')}</p>
                                                </div>
                                            )}

                                            {currentUser.courses && currentUser.courses.length > 0 && (
                                                <div>
                                                    <h3 className="dark:text-emerald-400 text-emerald-500">Courses</h3>
                                                    <ul className="user-explore-courses-list">
                                                        {currentUser.courses.map((course, index) => (
                                                            <li key={index}>
                                                                <a
                                                                    href={course.courseLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-emerald-400"
                                                                >
                                                                    {course.courseName}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <NoMoreUsersToExplore message={intervalMessage} />
            )}

            {/* Action Buttons to Connect/Skip/Refer if a user is present */}
            {currentUser && (
                <div className="user-explore-page-button-container">
                    <button
                        className="skip-button border-2 hover:text-white hover:bg-emerald-400 transform hover:scale-105 hover:border-emerald-300 border-emerald-400 text-emerald-400"
                        onClick={handleSkip}
                    >
                        Skip
                    </button>
                    <button
                        className="refer-button hover:bg-emerald-400 hover:text-white transform hover:scale-105 bg-emerald-300 text-gray-900"
                        onClick={() => setShowReferModal(true)}
                    >
                        Refer
                    </button>
                    <button
                        className="connect-button hover:bg-emerald-400 text-white transform hover:scale-105 bg-emerald-400 text-gray-900"
                        onClick={handleConnect}
                    >
                        Connect
                    </button>
                </div>
            )}

            {/* Snackbar for success messages */}
            {snackbarVisible && !isSmallScreen && (
                <Snackbar
                    key={snackbarTitle + snackbarMessage}
                    title={snackbarTitle}
                    message={snackbarMessage}
                    duration={4000}
                    onClose={() => setSnackbarVisible(false)}
                />
            )}

            {/* Refer Modal */}
            {showReferModal && currentUser && (
                <ReferModal
                    currentUser={currentUser}
                    onClose={() => setShowReferModal(false)}
                />
            )}
        </div>
    );
};

export default UserExplorePage;
