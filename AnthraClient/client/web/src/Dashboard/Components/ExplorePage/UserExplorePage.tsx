// UserExplorePage.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserExplorePage.css';
import NoMoreUsersToExplore from '../../Helpers/Animations/NoMoreUsersToExplore';

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

const UserExplorePage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/Explore/GetUsers', {
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
        } else {
            setCurrentUser(null);
        }
    }, [users, currentIndex]);

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
        }
        setCurrentIndex(currentIndex + 1);
    };

    const handleSkip = async () => {
        if (currentUser) {
            try {
                await axios.post(
                    'http://localhost:5001/api/Explore/SkipUser',
                    { UserIdToSkip: currentUser.id },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            } catch (error) {
                console.error('Error skipping user:', error);
            }
        }
        setCurrentIndex(currentIndex + 1);
    };

    return (
        <div className="user-explore-container">
            {currentUser ? (
                <div className="explore-user-card">
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
                                                <a href={course.courseLink} target="_blank" rel="noopener noreferrer">
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
            ) : (
                    <NoMoreUsersToExplore />
            )}
        </div>
    );
};

export default UserExplorePage;
