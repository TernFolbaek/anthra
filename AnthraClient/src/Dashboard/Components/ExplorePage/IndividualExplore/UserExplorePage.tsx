import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './UserExplorePage.css';
import NoMoreUsersToExplore from '../../../Helpers/Animations/NoMoreUsersToExplore';
import Snackbar from "../../../Helpers/Snackbar/Snackbar";
import ReferModal from '../ReferModal/ReferModal';
import useWindowWidth from '../../../hooks/useWindowWidth';
import { useSwipeable } from 'react-swipeable';
import {FaCog} from "react-icons/fa"; // Import the swipeable hook

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

const UserExplorePage: React.FC<UserExplorePageProps> = ({onSettingsClick}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const token = localStorage.getItem('token');

    const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
    const [snackbarTitle, setSnackbarTitle] = useState<string>('');
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');

    const [showReferModal, setShowReferModal] = useState(false);

    const windowWidth = useWindowWidth();
    const isSmallScreen = windowWidth < 480;

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [shake, setShake] = useState<boolean>(false);

    // New states for animation
    const [animating, setAnimating] = useState<boolean>(false);
    const [slideDirection, setSlideDirection] = useState<'in' | 'out'>('in');

    // Refs for handling animation end
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('/Explore/GetUsers', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUsers(response.data);
                setCurrentIndex(0);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, [token]);

    useEffect(() => {
        if (users.length > 0 && currentIndex < users.length) {
            setCurrentUser(users[currentIndex]);
            setCurrentPage(1);
            // When we have a new current user, ensure we slide them "in"
            setSlideDirection('in');
        } else {
            setCurrentUser(null);
        }
    }, [users, currentIndex]);

    const animateToNextUser = () => {
        setCurrentIndex(prev => prev + 1);
        setCurrentPage(1);
        setAnimating(false);
        setSlideDirection('in');
    };

    const handleConnect = async () => {
        if (currentUser) {
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
        }

        // Trigger slide-out animation before showing next user
        setSlideDirection('out');
        setAnimating(true);
        setTimeout(animateToNextUser, 300); // match animation duration in CSS
    };

    const handleSkip = async () => {
        if (currentUser) {
            try {
                await axios.post(
                    '/Explore/SkipUser',
                    { UserIdToSkip: currentUser.id },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (error) {
                console.error('Error skipping user:', error);
            }
        }

        setSlideDirection('out');
        setAnimating(true);
        setTimeout(animateToNextUser, 300);
    };


    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

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

    return (
        <div className="user-explore-container">
            {isSmallScreen && (
                <div onClick={onSettingsClick} className="settings-explore-mobile">
                    <FaCog className="sidebar-icon"/>
                    <span className="tooltip">Settings</span>
                </div>
            )}
            {currentUser ? (
                <div
                    className={`explore-user-card ${isSmallScreen ? 'small-screen' : ''} ${shake ? 'shake' : ''} slide-${slideDirection}`}
                    {...(isSmallScreen ? swipeHandlers : {})}
                >
                    {/* Page Indicators */}
                    {isSmallScreen && (
                        <div className="page-indicators">
                            <div className={`indicator ${currentPage === 1 ? 'active' : ''}`}></div>
                            <div className={`indicator ${currentPage === 2 ? 'active' : ''}`}></div>
                        </div>
                    )}

                    {/* Page Content */}
                    {isSmallScreen ? (
                        <div className="small-screen-content">
                            {currentPage === 1 ? (
                                <div className="page-content page-1">
                                    <div className="flex items-center gap-2">
                                        <img
                                            className="explore-user-card-img"
                                            src={`${currentUser.profilePictureUrl}`}
                                            alt="Profile"
                                        />
                                        <div className="flex flex-col">
                                            <h2 className="user-name">
                                                {currentUser.firstName} {currentUser.lastName}, {currentUser.age}
                                            </h2>
                                            <p className="user-location">{currentUser.location}</p>
                                        </div>
                                    </div>
                                    <div className="user-info">
                                        <h3>Institution</h3>
                                        <p>{currentUser.institution}</p>
                                        <h3>About Me</h3>
                                        <p>{currentUser.aboutMe}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="page-content page-2">
                                    <div className="flex items-center gap-2">
                                        <img
                                            className="explore-user-card-img"
                                            src={`${currentUser.profilePictureUrl}`}
                                            alt="Profile"
                                        />
                                        <div className="flex flex-col">
                                            <h2 className="user-name">
                                                {currentUser.firstName} {currentUser.lastName}, {currentUser.age}
                                            </h2>
                                            <p className="user-location">{currentUser.location}</p>
                                        </div>
                                    </div>
                                    <div className="user-info">
                                        {currentUser.subjects && currentUser.subjects.length > 0 && (
                                            <div>
                                                <h3>Subjects</h3>
                                                <p>{currentUser.subjects.join(', ')}</p>
                                            </div>
                                        )}

                                        {currentUser.courses && currentUser.courses.length > 0 && (
                                            <div>
                                                <h3>Courses</h3>
                                                <ul  className="dark:text-emerald-400">
                                                    {currentUser.courses.map((course, index) => (
                                                        <li key={index} >
                                                            <a href={course.courseLink} target="_blank"
                                                               rel="noopener noreferrer">
                                                                {course.courseName}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {currentUser.statuses && currentUser.statuses.length > 0 && (
                                            <div className="user-explore-statuses">
                                                <h3>Status</h3>
                                                <div className="flex gap-2 text-xs text-center">
                                                    {currentUser.statuses.map((st, i) => (
                                                        <p
                                                            key={i}
                                                            className="status-tag-explore"
                                                        >{st}
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
                        <div className="flex flex-col">
                            <div className="explore-user-card-content">
                                <div className="flex items-center gap-2">
                                    <img
                                        className="explore-user-card-img"
                                        src={`${currentUser.profilePictureUrl}`}
                                        alt="Profile"
                                    />
                                    <div className="flex flex-col">
                                        <h2 className="user-name">
                                            {currentUser.firstName} {currentUser.lastName}, {currentUser.age}
                                        </h2>
                                        <p className="user-location">{currentUser.location}</p>
                                    </div>
                                </div>
                                <div className="user-info">
                                    <h3>Institution</h3>
                                    <p>{currentUser.institution}</p>
                                    <h3>Work</h3>
                                    <p>{currentUser.work}</p>
                                    <h3>About Me</h3>
                                    <p>{currentUser.aboutMe}</p>

                                    {currentUser.subjects && currentUser.subjects.length > 0 && (
                                        <div>
                                            <h3>Subjects</h3>
                                            <p>{currentUser.subjects.join(', ')}</p>
                                        </div>
                                    )}

                                    {currentUser.courses && currentUser.courses.length > 0 && (
                                        <div>
                                            <h3>Courses</h3>
                                            <ul className="user-explore-courses-list">
                                                {currentUser.courses.map((course, index) => (
                                                    <li key={index}>
                                                        <a href={course.courseLink} target="_blank"
                                                           rel="noopener noreferrer">
                                                            {course.courseName}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {currentUser.statuses && currentUser.statuses.length > 0 && (
                                        <div className="user-explore-statuses">
                                            <h3>Status</h3>
                                            <div className="flex gap-2">
                                                {currentUser.statuses.map((st, i) => (
                                                    <p
                                                        key={i}
                                                        className="status-tag-explore"
                                                    >{st}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <NoMoreUsersToExplore />
            )}

            {/* Buttons to Connect/Skip/Refer */}
            {currentUser && (
                <div className="user-explore-page-button-container">
                    <button className="skip-button dark:hover:bg-emerald-400 border transform dark:hover:scale-105 dark:hover:border-emerald-400 dark:border-emerald-500 dark:text-emerald-400" onClick={handleSkip}>
                        Skip
                    </button>
                    <button className="refer-button dark:hover:bg-emerald-400  transform dark:hover:scale-105 dark:bg-emerald-300 dark:text-gray-900" onClick={() => setShowReferModal(true)}>
                        Refer
                    </button>
                    <button className="connect-button dark:hover:bg-emerald-400 dark:hover:text-white  transform dark:hover:scale-105 dark:bg-emerald-500 dark:text-gray-900" onClick={handleConnect}>
                        Connect
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
