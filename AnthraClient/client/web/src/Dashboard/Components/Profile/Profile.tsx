// Profile.tsx
import React, { useState, useEffect } from 'react';
import './Profile.css';
import axios from 'axios';

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

const Profile: React.FC = () => {
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/Profile/GetProfile', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setProfileData(response.data);
        } catch (err) {
            setError('Failed to fetch profile data.');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (profileData) {
            setProfileData({
                ...profileData,
                [e.target.name]: e.target.value,
            });
        }
    };

    // Handle array inputs for courses
    const handleCourseChange = (index: number, field: keyof Course, value: string) => {
        if (profileData) {
            const updatedCourses = [...profileData.courses];
            updatedCourses[index] = {
                ...updatedCourses[index],
                [field]: value,
            };
            setProfileData({
                ...profileData,
                courses: updatedCourses,
            });
        }
    };

    const addCourse = () => {
        if (profileData) {
            setProfileData({
                ...profileData,
                courses: [...profileData.courses, { courseName: '', courseLink: '' }],
            });
        }
    };

    const removeCourse = (index: number) => {
        if (profileData) {
            const updatedCourses = [...profileData.courses];
            updatedCourses.splice(index, 1);
            setProfileData({
                ...profileData,
                courses: updatedCourses,
            });
        }
    };

    // Handle array inputs for subjects
    const handleSubjectChange = (index: number, value: string) => {
        if (profileData) {
            const updatedSubjects = [...profileData.subjects];
            updatedSubjects[index] = value;
            setProfileData({
                ...profileData,
                subjects: updatedSubjects,
            });
        }
    };

    const addSubject = () => {
        if (profileData) {
            setProfileData({
                ...profileData,
                subjects: [...profileData.subjects, ''],
            });
        }
    };

    const removeSubject = (index: number) => {
        if (profileData) {
            const updatedSubjects = [...profileData.subjects];
            updatedSubjects.splice(index, 1);
            setProfileData({
                ...profileData,
                subjects: updatedSubjects,
            });
        }
    };

    const handleSave = async () => {
        try {
            await axios.post(
                'http://localhost:5001/api/Profile/UpdateProfile',
                { ...profileData },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setEditMode(false);
        } catch (err) {
            setError('Failed to update profile.');
        }
    };

    if (!profileData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="profile-page">
            <div className="profile-card">
                <div className="profile-header">
                    <button onClick={() => setEditMode(!editMode)}>
                        {editMode ? 'Cancel' : 'Edit'}
                    </button>
                </div>
                <div className="profile-content">
                    <div className="profile-picture">
                        <img src={`http://localhost:5001${profileData.profilePictureUrl}`} alt="Profile" />
                        {editMode && (
                            <input
                                type="file"
                                name="profileImage"
                                accept="image/*"
                                onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const formData = new FormData();
                                        formData.append('image', e.target.files[0]);
                                        try {
                                            const response = await axios.post(
                                                'http://localhost:5001/api/Profile/UploadProfileImage',
                                                formData,
                                                {
                                                    headers: {
                                                        Authorization: `Bearer ${token}`,
                                                        'Content-Type': 'multipart/form-data',
                                                    },
                                                }
                                            );
                                            if (response.data.imageUrl) {
                                                setProfileData({
                                                    ...profileData,
                                                    profilePictureUrl: response.data.imageUrl,
                                                });
                                            }
                                        } catch (error) {
                                            setError('Failed to upload profile image.');
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                    <div className="profile-info">
                        {/* Username */}
                        <div className="profile-row">
                            <div className="profile-field full-width">
                                <label>Username:</label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        name="userName"
                                        value={profileData.userName}
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    <span>{profileData.userName}</span>
                                )}
                            </div>
                        </div>

                        {/* First Name and Last Name */}
                        <div className="profile-row">
                            <div className="profile-field half-width">
                                <label>First Name:</label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={profileData.firstName}
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    <span>{profileData.firstName}</span>
                                )}
                            </div>
                            <div className="profile-field half-width">
                                <label>Last Name:</label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={profileData.lastName}
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    <span>{profileData.lastName}</span>
                                )}
                            </div>
                        </div>

                        {/* Age and Location */}
                        <div className="profile-row">
                            <div className="profile-field half-width">
                                <label>Age:</label>
                                {editMode ? (
                                    <input
                                        type="number"
                                        name="age"
                                        value={profileData.age}
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    <span>{profileData.age}</span>
                                )}
                            </div>
                            <div className="profile-field half-width">
                                <label>Location:</label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        name="location"
                                        value={profileData.location}
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    <span>{profileData.location}</span>
                                )}
                            </div>
                        </div>

                        {/* Institution and Work */}
                        <div className="profile-row">
                            <div className="profile-field half-width">
                                <label>Institution:</label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        name="institution"
                                        value={profileData.institution}
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    <span>{profileData.institution}</span>
                                )}
                            </div>
                            <div className="profile-field half-width">
                                <label>Work:</label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        name="work"
                                        value={profileData.work}
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    <span>{profileData.work}</span>
                                )}
                            </div>
                        </div>

                        {/* About Me */}
                        <div className="profile-row">
                            <div className="profile-field full-width">
                                <label>About Me:</label>
                                {editMode ? (
                                    <textarea
                                        name="aboutMe"
                                        value={profileData.aboutMe}
                                        onChange={handleInputChange}
                                        rows={5}
                                    />
                                ) : (
                                    <p className="about-me-text">{profileData.aboutMe}</p>
                                )}
                            </div>
                        </div>

                        {/* Subjects */}
                        <div className="profile-row">
                            <div className="profile-field full-width">
                                <label>Subjects:</label>
                                {editMode ? (
                                    <div className="subjects-list">
                                        {profileData.subjects.map((subject, index) => (
                                            <div key={index} className="subject-item">
                                                <input
                                                    type="text"
                                                    value={subject}
                                                    onChange={(e) => handleSubjectChange(index, e.target.value)}
                                                />
                                                <button type="button" onClick={() => removeSubject(index)}>
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={addSubject}>
                                            Add Subject
                                        </button>
                                    </div>
                                ) : (
                                    <ul className="subjects-list">
                                        {profileData.subjects.map((subject, index) => (
                                            <li key={index}>{subject}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Courses */}
                        <div className="profile-row">
                            <div className="profile-field full-width">
                                <label>Courses:</label>
                                {editMode ? (
                                    <div className="courses-list">
                                        {profileData.courses.map((course, index) => (
                                            <div key={index} className="course-item">
                                                <input
                                                    type="text"
                                                    placeholder="Course Name"
                                                    value={course.courseName}
                                                    onChange={(e) => handleCourseChange(index, 'courseName', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Course Link"
                                                    value={course.courseLink}
                                                    onChange={(e) => handleCourseChange(index, 'courseLink', e.target.value)}
                                                />
                                                <button type="button" onClick={() => removeCourse(index)}>
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={addCourse}>
                                            Add Course
                                        </button>
                                    </div>
                                ) : (
                                    <ul className="courses-list">
                                        {profileData.courses.map((course, index) => (
                                            <li key={index}>
                                                <a href={course.courseLink} target="_blank" rel="noopener noreferrer">
                                                    {course.courseName}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {editMode && (
                            <button className="save-button" onClick={handleSave}>
                                Save
                            </button>
                        )}
                        {error && <p className="error-message">{error}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
