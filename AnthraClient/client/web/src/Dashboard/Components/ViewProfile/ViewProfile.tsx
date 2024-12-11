import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './ViewProfile.css';

interface ViewProfileProps {
    userId: string;
    onClose: () => void;
}

interface Course {
    courseName: string;
    courseLink: string;
}

interface UserProfile {
    firstName: string;
    lastName: string;
    age: number;
    location: string;
    institution: string;
    work: string;
    courses: Course[];
    subjects: string[];
    statuses: string[];
    aboutMe: string;
    profilePictureUrl: string;
}

const ViewProfile: React.FC<ViewProfileProps> = ({ userId, onClose }) => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        console.log(userId);
        const fetchUserProfile = async () => {
            try {
                const response = await axios.get(`http://localhost:5001/api/Profile/GetProfileById?userId=${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                console.log(response.data)
                setUserProfile(response.data);
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
                setError('Failed to fetch user profile. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [userId, token]);

    const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            onClose();
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (loading) {
        return null;
    }

    if (error) {
        return null;
    }

    if (!userProfile) {
        return null;
    }

    return (
        <div id="viewprofile" className="viewprofile-overlay">
            <div className="viewprofile-modal" ref={modalRef}>
                <button className="viewprofile-close-button" onClick={onClose}>
                    &times;
                </button>
                <div className="viewprofile-content">
                    <div className="flex">
                        <img
                            src={`${userProfile.profilePictureUrl}`}
                            alt={`${userProfile.firstName} ${userProfile.lastName}`}
                            className="viewprofile-profile-picture"
                        />
                        <div>
                            <h2 className="viewprofile-name sm:text-red">
                                {userProfile.firstName} {userProfile.lastName}{userProfile.age ? `, ${userProfile.age}` : ''}
                            </h2>
                            <p className="viewprofile-location">{userProfile.location}</p>
                        </div>
                    </div>
                    <p className="viewprofile-institution">{userProfile.institution}</p>
                    <p className="viewprofile-work">{userProfile.work}</p>
                    <h3 className="viewprofile-section-title">About Me</h3>
                    <p className="viewprofile-aboutme">{userProfile.aboutMe}</p>
                    <h3 className="viewprofile-section-title">Courses</h3>
                    <ul className="viewprofile-list">
                        {userProfile.courses.map((course, index) => (
                            <li key={index}>
                                <a href={course.courseLink} className="text-blue-400 hover:font-semibold" target="_blank"
                                   rel="noopener noreferrer">
                                    {course.courseName}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <h3 className="viewprofile-section-title">Subjects</h3>
                    <ul className="viewprofile-list">
                        {userProfile.subjects.map((subject, index) => (
                            <li key={index}>{subject}</li>
                        ))}
                    </ul>
                    {userProfile.statuses && userProfile.statuses.length > 0 && (
                        <div className="user-explore-statuses mt-[10px]">
                            <h3 className="viewprofile-section-title">Status</h3>
                            <div className="flex">
                            {userProfile.statuses.map((st, i) => (
                                <p
                                    key={i}
                                    className="status-tag-explore mr-1"
                                >{st}
                            </p>
                            ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ViewProfile;
