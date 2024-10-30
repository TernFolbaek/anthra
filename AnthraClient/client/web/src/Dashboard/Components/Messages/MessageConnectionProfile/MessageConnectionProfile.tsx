// MessageConnectionProfile.tsx
import React, {useEffect, useState} from 'react';
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

const MessageConnectionProfile: React.FC<Props> = ({userId}) => {
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [error, setError] = useState<string | null>(null);
    console.log(userId)
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    src={`http://localhost:5001${profileData.profilePictureUrl}`}
                    alt="Profile"
                />
            </div>
            <div className="profile-info">
                <h2>
                    {profileData.firstName} {profileData.lastName}
                </h2>
                <p className="profile-username">@{profileData.userName}</p>
                <p>{profileData.location}</p>
                <p>{profileData.work}</p>
                <p>{profileData.institution}</p>
                <p>Age: {profileData.age}</p>
                <h3>About Me</h3>
                <p>{profileData.aboutMe}</p>
                <h3>Subjects</h3>
                <ul>
                    {profileData.subjects.map((subject, index) => (
                        <li key={index}>{subject}</li>
                    ))}
                </ul>
                <h3>Courses</h3>
                <ul>
                    {profileData.courses.map((course, index) => (
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
        </div>
    );
};

export default MessageConnectionProfile;
