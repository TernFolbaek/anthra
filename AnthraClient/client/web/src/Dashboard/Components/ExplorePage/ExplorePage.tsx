import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './ExplorePage.css';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

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
    aboutMe: string;
    age: number;
    profilePictureUrl: string;
}

const ExplorePage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [totalUsersFetched, setTotalUsersFetched] = useState(0);
    const [isFetching, setIsFetching] = useState(false);
    const [cardLeaving, setCardLeaving] = useState(false);
    const token = localStorage.getItem('token');

    const nodeRef = useRef(null);

    const fetchUsers = async (skip: number, take: number) => {
        try {
            setIsFetching(true);
            const response = await axios.get('http://localhost:5001/api/Explore/GetUsers', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    skip,
                    take,
                },
            });
            if (response.data.length > 0) {
                setUsers((prevUsers) => [...prevUsers, ...response.data]);
                setTotalUsersFetched((prevTotal) => prevTotal + response.data.length);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchUsers(0, 10);
    }, [token]);

    useEffect(() => {
        if (users.length > 0 && currentIndex < users.length) {
            setCurrentUser(users[currentIndex]);
        } else {
            setCurrentUser(null);
        }

        // Fetch more users when less than 5 are left
        if (users.length - currentIndex <= 5 && !isFetching) {
            fetchUsers(totalUsersFetched, 5);
        }
    }, [currentIndex, users]);

    const handleConnect = async () => {
        if (currentUser) {
            try {
                await axios.post(
                    'http://localhost:5001/api/Connections/SendRequest',
                    { targetUserId: currentUser.id },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            } catch (error) {
                console.error('Error sending connection request:', error);
            }
            setCardLeaving(true);
        }
    };

    const handleSkip = async () => {
        if (currentUser) {
            try {
                await axios.post(
                    'http://localhost:5001/api/Explore/SkipUser',
                    { userIdToSkip: currentUser.id }, // Changed property name to match expected casing
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            } catch (error) {
                console.error('Error skipping user:', error);
            }
            setCardLeaving(true);
        }
    };

    return (
        <div className="explore-page">
            {currentUser ? (
                <CSSTransition
                    key={currentUser.id}
                    nodeRef={nodeRef}
                    in={!cardLeaving}
                    timeout={300}
                    classNames="explore-card"
                    onExited={() => {
                        setCurrentIndex((prevIndex) => prevIndex + 1);
                        setCardLeaving(false);
                    }}
                    unmountOnExit
                >
                    <div ref={nodeRef} className="explore-user-card">
                        <img
                            className="explore-user-card-img"
                            src={`http://localhost:5001${currentUser.profilePictureUrl}`}
                            alt="Profile"
                        />
                        <div className="explore-user-card-content">
                            <h2 className="user-name">
                                {currentUser.firstName} {currentUser.lastName}, {currentUser.age}
                            </h2>
                            <p className="user-location">{currentUser.location}</p>
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
                                        <ul className="courses-list">
                                            {currentUser.courses.map((course, index) => (
                                                <li key={index}>
                                                    <a
                                                        href={course.courseLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {course.courseName}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div className="button-container">
                                <button className="connect-button" onClick={handleConnect}>
                                    Connect
                                </button>
                                <button className="skip-button" onClick={handleSkip}>
                                    Skip
                                </button>
                            </div>
                        </div>
                    </div>
                </CSSTransition>
            ) : (
                <p>No more users to display.</p>
            )}
        </div>
    );
};

export default ExplorePage;
