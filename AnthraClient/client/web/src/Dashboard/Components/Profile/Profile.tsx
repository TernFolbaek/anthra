// Profile.tsx
import React, {useState, useEffect} from 'react';
import './Profile.css';
import axios from 'axios';
import {FaRegHandPointer, FaPlus, FaTrash} from "react-icons/fa";

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
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

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
            localStorage.setItem('userProfilePicture', `${response.data.profilePictureUrl}`);
            setProfileData(response.data);
        } catch (err) {
            setError('Failed to fetch profile data.');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (profileData) {
            const {name, value} = e.target;
            setProfileData({
                ...profileData,
                [name]: value,
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
                courses: [...profileData.courses, {courseName: '', courseLink: ''}],
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
        if (profileData) {
            const formData = new FormData();

            // Append scalar fields
            formData.append('FirstName', profileData.firstName);
            formData.append('LastName', profileData.lastName);
            formData.append('Location', profileData.location);
            formData.append('Institution', profileData.institution);
            formData.append('Work', profileData.work);
            formData.append('AboutMe', profileData.aboutMe);
            formData.append('Age', profileData.age.toString());

            // Append array fields
            profileData.subjects.forEach((subject) => formData.append('Subjects', subject));
            formData.append('Courses', JSON.stringify(profileData.courses));

            // Append profile picture if updated
            if (profilePictureFile) {
                formData.append('ProfilePicture', profilePictureFile);
            }

            try {
                await axios.post(
                    'http://localhost:5001/api/Profile/UpdateProfile',
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setEditMode(false);
                // Refresh the profile data to reflect changes
                fetchProfile();
            } catch (err: any) {
                if (err.response && err.response.data) {
                    const errorData = err.response.data;
                    setError(
                        errorData.Message ||
                        Object.values(errorData.errors || {}).join(' ') ||
                        'An error occurred'
                    );
                } else {
                    setError('An error occurred. Please try again.');
                }
            }
        }
    };

    if (!profileData) {
        return <div>Loading...</div>;
    }
    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePictureFile(e.target.files[0]);
        }
    };

    return (
        <div className="overflow-auto h-full ">
            <div className="profile-page h-full overflow-auto">
                <div className="profile-card">
                    <div className="profile-header">
                        <button onClick={() => setEditMode(!editMode)}>
                            {editMode ? 'Cancel' : 'Edit'}
                        </button>
                    </div>
                    <div className="profile-content">
                        <div className="profile-picture">
                            <img
                                src={
                                    profilePictureFile
                                        ? URL.createObjectURL(profilePictureFile)
                                        : `${profileData.profilePictureUrl}`
                                }
                                className="profile-picture-img"
                                alt="Profile"
                            />
                            {profileData.profilePictureUrl}
                            {editMode && (
                                <div className="profile-picture-overlay">
                                    <input
                                        type="file"
                                        name="profileImage"
                                        accept="image/*"
                                        onChange={handleProfilePictureChange}
                                        className="hidden-file-input"
                                    />
                                    <div className="overlay-content">
                                        <FaRegHandPointer className="cursor-icon"/>
                                        <span>Change Profile Picture</span>
                                    </div>
                                </div>)}
                        </div>
                        <div className="profile-info">
                            {/* Username */}
                            <div className="profile-row">
                                <div className="profile-field full-width">
                                    <label className="profile-label">Username:</label>
                                    <span>{profileData.userName}</span>
                                </div>
                            </div>

                            {/* First Name and Last Name */}
                            <div className="profile-row">
                                <div className="profile-field half-width">
                                    <label className="profile-label">First Name:</label>
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
                                    <label className="profile-label">Last Name:</label>
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
                                    <label className="profile-label">Age:</label>
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
                                    <label className="profile-label">Location:</label>
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
                                    <label className="profile-label">Institution:</label>
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
                                    <label className="profile-label">Work:</label>
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
                                    <label className="profile-label">About Me:</label>
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
                                    <label className="profile-label">Subjects:</label>
                                    {editMode ? (
                                        <div className="subjects-list">
                                            {profileData.subjects.map((subject, index) => (
                                                <div key={index} className="subject-item flex">
                                                    <input
                                                        type="text"
                                                        value={subject}
                                                        onChange={(e) => handleSubjectChange(index, e.target.value)}
                                                    />
                                                    <button type="button" onClick={() => removeSubject(index)}
                                                            className="profile-edit-trash">
                                                        <FaTrash/>
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="flex items-center">
                                                <button type="button" onClick={addSubject}
                                                        className="profile-icon-button">
                                                    <FaPlus/>
                                                </button>
                                                <p className="text-gray-500 text-xs font-bold ">New Subject</p>
                                            </div>
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
                                    <label className="profile-label">Courses:</label>
                                    {editMode ? (
                                        <div className="courses-list">
                                            {profileData.courses.map((course, index) => (
                                                <div key={index} className="course-item flex items-center">
                                                    <div>
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
                                                    </div>
                                                    <button type="button" onClick={() => removeCourse(index)}
                                                            className="profile-edit-trash">
                                                        <FaTrash/>
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="flex items-center">
                                                <button type="button" onClick={addCourse}
                                                        className="profile-icon-button">
                                                    <FaPlus/>
                                                </button>
                                                <p className="text-gray-500 text-xs font-bold ">New Course</p>
                                            </div>

                                        </div>
                                    ) : (
                                        <ul className="courses-list">
                                            {profileData.courses.map((course, index) => (
                                                <li key={index}>
                                                    <a href={course.courseLink}
                                                       className="dark:text-blue-400 text-blue-600 hover:font-bold"
                                                       target="_blank" rel="noopener noreferrer">
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
        </div>

    );
};

export default Profile;
