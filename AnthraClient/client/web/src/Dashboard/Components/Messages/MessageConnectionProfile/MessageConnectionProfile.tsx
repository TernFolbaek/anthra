import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MessageConnectionProfile.css';

interface Course {
    courseName: string;
    courseLink: string;
}

interface ProfileData {
    aboutMe: string;
    age: number;
    courses: Course[];
    email: string;
    firstName: string;
    institution: string;
    lastName: string;
    location: string;
    profilePictureUrl: string;
    subjects: string[];
    userName: string;
    work: string;
}

interface Props {
    userId: string;
}

const MessageConnectionProfile: React.FC<Props> = ({ userId }) => {
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            const response = await axios.get(
                `http://localhost:5001/api/Profile/GetProfileById?userId=${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setProfileData(response.data);
        } catch (err) {
            setError('Failed to fetch profile data.');
        }
    };

    if (error) {
        return <div className="profile-error">{error}</div>;
    }

    if (!profileData) {
        return <div className="profile-loading">Loading profile...</div>;
    }

    return (
        <div className="message-connection-profile">
            <div className="profile-picture">
                <img
                    className="profile-picture-image"
                    src={`${profileData.profilePictureUrl}`}
                    alt="Profile"
                />
            </div>
            <div className="profile-info">
                <div className="profile-info-header">
                    {profileData.firstName} {profileData.lastName}
                </div>
                <div className="profile-username">@{profileData.userName}</div>
                <div className="profile-info-text">
                    <span className="profile-location-label">Location:</span> {profileData.location}
                </div>
                <div className="profile-info-text">
                    <span className="profile-work-label">Work:</span> {profileData.work}
                </div>
                <div className="profile-info-text">
                    <span className="profile-institution-label">Institution:</span> {profileData.institution}
                </div>
                <div className="profile-info-text">
                    <span className="profile-age-label">Age:</span> {profileData.age}
                </div>
                <div className="profile-section-title">About Me</div>
                <div className="profile-info-text">{profileData.aboutMe}</div>
                <div className="profile-section-title">Subjects</div>
                <ul className="profile-info-list">
                    {profileData.subjects.map((subject, index) => (
                        <li key={index} className="profile-info-list-item">{subject}</li>
                    ))}
                </ul>
                <div className="profile-section-title">Courses</div>
                <ul className="profile-info-list">
                    {profileData.courses.map((course, index) => (
                        <li key={index} className="profile-info-list-item">
                            <a
                                href={course.courseLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="profile-info-link"
                            >
                                {course.courseName}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default MessageConnectionProfile;
