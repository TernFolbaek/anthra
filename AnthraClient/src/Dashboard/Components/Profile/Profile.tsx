import React, { useState, useEffect } from 'react';
import './Profile.css';
import axios from 'axios';
import { FaRegHandPointer, FaPlus, FaTrash } from "react-icons/fa";

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
    // Replace string location with an object for Country & City
    location: {
        country: string;
        city: string;
    };
    profilePictureUrl: string;
    subjects: string[];
    userName: string;
    work: string;
    statuses: string[];
}

const Profile: React.FC = () => {
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Field-level errors so we can highlight the specific fields in red
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

    const token = localStorage.getItem('token');

    // Predefined statuses
    const allStatuses: string[] = [
        "✎ exam preparations",
        "☺ expanding my network",
        "☏ looking for collaboration",
        "❊ general studies",
        "❀ on exchange",
        "☂ seeking mentorship"
    ];
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profileData && !editMode) {
            // Whenever we exit edit mode or first load, ensure selectedStatuses matches profileData
            setSelectedStatuses(profileData.statuses || []);
        }
    }, [profileData, editMode]);

    const fetchProfile = async () => {
        try {
            const response = await axios.get('/Profile/GetProfile', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const [country, city] = response.data.location
                ? response.data.location.split(',')
                : ['', ''];

            localStorage.setItem('userProfilePicture', response.data.profilePictureUrl);

            setProfileData({
                ...response.data,
                location: {
                    country: country.trim(),
                    city: city.trim(),
                }
            });

            setSelectedStatuses(response.data.statuses || []);
        } catch (err) {
            setError('Failed to fetch profile data');
        }
    };


    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        if (profileData) {
            const { name, value } = e.target;
            setProfileData({
                ...profileData,
                [name]: value,
            });
        }
    };

    // Separate handler for location (because it's now an object)
    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (profileData) {
            const { name, value } = e.target;
            setProfileData({
                ...profileData,
                location: {
                    ...profileData.location,
                    [name]: value,
                },
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
            // Only add if we don't exceed 4 courses
            if (profileData.courses.length < 4) {
                setProfileData({
                    ...profileData,
                    courses: [
                        ...profileData.courses,
                        { courseName: '', courseLink: '' }
                    ],
                });
            }
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
            // Only add if we don't exceed 5 subjects
            if (profileData.subjects.length < 5) {
                setProfileData({
                    ...profileData,
                    subjects: [...profileData.subjects, ''],
                });
            }
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

    // Handle selecting/deselecting statuses
    const handleStatusSelect = (st: string) => {
        if (selectedStatuses.includes(st)) {
            setSelectedStatuses(selectedStatuses.filter(status => status !== st));
        } else {
            // Example logic: enforce a maximum of 3
            if (selectedStatuses.length < 3) {
                setSelectedStatuses([...selectedStatuses, st]);
            } else {
                setError('You can only select up to 3 statuses.');
            }
        }
    };

    const handleSave = async () => {
        if (!profileData) return;

        // Clear previous errors
        setError(null);
        const newFieldErrors: { [key: string]: string } = {};
        let hasError = false;

        // Validate About Me (150-300 chars)
        if (profileData.aboutMe.length < 150 || profileData.aboutMe.length > 300) {
            newFieldErrors.aboutMe = 'About Me must be between 150 and 300 characters';
            hasError = true;
        }

        // Validate First Name (no spaces, max 15 chars)
        if (profileData.firstName.includes(' ')) {
            newFieldErrors.firstName = 'First Name must be one word without spaces';
            hasError = true;
        }
        if (profileData.firstName.length > 15) {
            newFieldErrors.firstName = 'First Name cannot exceed 15 characters';
            hasError = true;
        }

        // Validate Last Name (no spaces, max 15 chars)
        if (profileData.lastName.includes(' ')) {
            newFieldErrors.lastName = 'Last Name must be one word without spaces';
            hasError = true;
        }
        if (profileData.lastName.length > 15) {
            newFieldErrors.lastName = 'Last Name cannot exceed 15 characters';
            hasError = true;
        }

        // Validate Courses (2 - 4)
        if (profileData.courses.length < 2) {
            newFieldErrors.courses = 'Please add at least 2 courses'
            hasError = true;
        }
        if (profileData.courses.length > 4) {
            newFieldErrors.courses = 'You cannot add more than 4 courses';
            hasError = true;
        }

        // Validate Subjects (2 - 5)
        if (profileData.subjects.length < 2) {
            newFieldErrors.subjects = 'Please add at least 2 subjects';
            hasError = true;
        }
        if (profileData.subjects.length > 5) {
            newFieldErrors.subjects = 'You cannot add more than 5 subjects';
            hasError = true;
        }

        // Validate location fields
        if (!profileData.location.country) {
            newFieldErrors.country = 'Country is required';
            hasError = true;
        }
        if (!profileData.location.city) {
            newFieldErrors.city = 'City is required';
            hasError = true;
        }

        // Validate statuses (example: must select between 2 and 3)
        if (selectedStatuses.length < 2 || selectedStatuses.length > 3) {
            newFieldErrors.statuses = 'Please select between 2 and 3 statuses.';
            hasError = true;
        }

        if (hasError) {
            setFieldErrors(newFieldErrors);
            return;
        } else {
            // Clear field-specific errors if all good
            setFieldErrors({});
        }

        // If we pass all validations, proceed with sending the data
        try {
            const formData = new FormData();

            // Scalar fields
            formData.append('FirstName', profileData.firstName);
            formData.append('LastName', profileData.lastName);
            // Combine or handle country/city in whatever way your backend expects
            formData.append('Location', `${profileData.location.country},${profileData.location.city}`);
            formData.append('Institution', profileData.institution);
            formData.append('Work', profileData.work);
            formData.append('AboutMe', profileData.aboutMe);
            formData.append('Age', profileData.age.toString());

            // Arrays
            profileData.subjects.forEach((subject) => formData.append('Subjects', subject));
            formData.append('Courses', JSON.stringify(profileData.courses));

            // Statuses
            selectedStatuses.forEach(status => formData.append('Statuses', status));

            // Profile picture
            if (profilePictureFile) {
                formData.append('ProfilePicture', profilePictureFile);
            }

            await axios.post(
                '/Profile/UpdateProfile',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setEditMode(false);
            fetchProfile(); // Refresh
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
    };

    if (!profileData) {
        return null;
    }

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePictureFile(e.target.files[0]);
        }
    };

    return (
        <div className="overflow-auto h-[100vh]">
            <div className={`profile-page ${!editMode ? 'h-[100%]' : ''}`}>
                <div className="profile-card">
                    <div className="profile-content">
                        <div className="flex flex-col justify-between">
                            <div className="profile-picture">
                                <img
                                    src={
                                        profilePictureFile
                                            ? URL.createObjectURL(profilePictureFile)
                                            : `${profileData.profilePictureUrl}`
                                    }
                                    alt="Profile"
                                />
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
                                            <FaRegHandPointer className="cursor-icon" />
                                            <span>Change Profile Picture</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                className="save-button bg-emerald-400 hover:bg-emerald-300 text-white dark:hover:bg-emerald-400 transform hover:scale-105 dark:text-white dark:bg-emerald-500"
                                onClick={() => {
                                    setError(null);
                                    setFieldErrors({});
                                    setEditMode(!editMode);
                                }}
                            >
                                {editMode ? 'Cancel' : 'Edit'}
                            </button>
                        </div>

                        <div className="profile-info">

                            {/* Username */}
                            <div className="profile-row">
                                <div className="profile-field full-width">
                                    <label>Username:</label>
                                    <span>@{profileData.userName}</span>
                                </div>
                            </div>

                            {/* First Name and Last Name */}
                            <div className="profile-row">
                                <div className="profile-field half-width">
                                    <label className="profile-label">First Name:</label>
                                    {editMode ? (
                                        <>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={profileData.firstName}
                                                onChange={handleInputChange}
                                                className={`${
                                                    fieldErrors.firstName ? 'border border-red-500' : ''
                                                }`}
                                            />
                                            {fieldErrors.firstName && (
                                                <p className="text-red-500 text-sm">{fieldErrors.firstName}</p>
                                            )}
                                        </>
                                    ) : (
                                        <span>{profileData.firstName}</span>
                                    )}
                                </div>

                                <div className="profile-field half-width">
                                    <label className="profile-label">Last Name:</label>
                                    {editMode ? (
                                        <>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={profileData.lastName}
                                                onChange={handleInputChange}
                                                className={`${
                                                    fieldErrors.lastName ? 'border border-red-500' : ''
                                                }`}
                                            />
                                            {fieldErrors.lastName && (
                                                <p className="text-red-500 text-sm">{fieldErrors.lastName}</p>
                                            )}
                                        </>
                                    ) : (
                                        <span>{profileData.lastName}</span>
                                    )}
                                </div>
                            </div>

                            {/* Age */}
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
                                    <label className="profile-label">Country:</label>
                                    {editMode ? (
                                        <>
                                            <input
                                                type="text"
                                                name="country"
                                                autoComplete="nope"
                                                value={profileData.location.country}
                                                onChange={handleLocationChange}
                                                className={`${
                                                    fieldErrors.country ? 'border border-red-500' : ''
                                                }`}
                                            />
                                            {fieldErrors.country && (
                                                <p className="text-red-500 text-sm">{fieldErrors.country}</p>
                                            )}
                                        </>
                                    ) : (
                                        <span>{profileData.location.country}</span>
                                    )}
                                </div>
                            </div>

                            <div className="profile-row">
                                <div className="profile-field half-width">
                                    <label className="profile-label">City:</label>
                                    {editMode ? (
                                        <>
                                            <input
                                                type="text"
                                                name="city"
                                                autoComplete="nope"
                                                value={profileData.location.city}
                                                onChange={handleLocationChange}
                                                className={`${
                                                    fieldErrors.city ? 'border border-red-500' : ''
                                                }`}
                                            />
                                            {fieldErrors.city && (
                                                <p className="text-red-500 text-sm">{fieldErrors.city}</p>
                                            )}
                                        </>
                                    ) : (
                                        <span>{profileData.location.city}</span>
                                    )}
                                </div>

                                {/* Institution */}
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
                            </div>

                            {/* Work */}
                            <div className="profile-row">
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
                                        <>
                              <textarea
                                  name="aboutMe"
                                  value={profileData.aboutMe}
                                  onChange={handleInputChange}
                                  rows={5}
                                  minLength={150}
                                  maxLength={300}
                                  className={`${
                                      fieldErrors.aboutMe ? 'border border-red-500' : ''
                                  }`}
                              />
                                {fieldErrors.aboutMe && (
                                    <p className="text-red-500 text-sm">{fieldErrors.aboutMe}</p>
                                )}
                                        </>
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
                                        <div className="flex flex-col gap-2">
                                            {profileData.subjects.map((subject, index) => (
                                                <div key={index} className="subject-item flex">
                                                    <input
                                                        type="text"
                                                        value={subject}
                                                        onChange={(e) => handleSubjectChange(index, e.target.value)}
                                                        className={`${
                                                            fieldErrors.subjects ? 'border border-red-500' : ''
                                                        }`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSubject(index)}
                                                        className="profile-edit-trash"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            ))}
                                            {fieldErrors.subjects && (
                                                <p className="text-red-500 text-sm">{fieldErrors.subjects}</p>
                                            )}
                                            <div className="flex items-center">
                                                <button
                                                    type="button"
                                                    onClick={addSubject}
                                                    className="profile-icon-button"
                                                >
                                                    <FaPlus />
                                                </button>
                                                <p className="text-gray-500 text-xs font-bold">New Subject</p>
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
                                                <div key={index} className="course-item dark:text-emerald-400 flex items-center">
                                                    <div className="w-full flex flex-col gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Course Name"
                                                            value={course.courseName}
                                                            onChange={(e) => handleCourseChange(index, 'courseName', e.target.value)}
                                                            className={`${
                                                                fieldErrors.courses ? 'border border-red-500' : ''
                                                            }`}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Course Link"
                                                            value={course.courseLink}
                                                            onChange={(e) => handleCourseChange(index, 'courseLink', e.target.value)}
                                                            className={`${
                                                                fieldErrors.courses ? 'border border-red-500' : ''
                                                            }`}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCourse(index)}
                                                        className="profile-edit-trash"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            ))}
                                            {fieldErrors.courses && (
                                                <p className="text-red-500 text-sm">{fieldErrors.courses}</p>
                                            )}
                                            <div className="flex items-center">
                                                <button
                                                    type="button"
                                                    onClick={addCourse}
                                                    className="profile-icon-button"
                                                >
                                                    <FaPlus />
                                                </button>
                                                <p className="text-gray-500 text-xs font-bold">New Course</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <ul className="courses-list">
                                            {profileData.courses.map((course, index) => (
                                                <li key={index}>
                                                    <a
                                                        href={course.courseLink}
                                                        className="text-emerald-400 dark:text-emerald-400 hover:font-semibold"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {course.courseName}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Statuses */}
                            <div className="profile-row">
                                <div className="profile-field full-width">
                                    <label className="profile-label">Current Statuses (2-3):</label>
                                    {editMode ? (
                                        <div className="status-tags-container-profile">
                                            {allStatuses.map((st, i) => (
                                                <span
                                                    key={i}
                                                    className={`status-tag hover:scale-105 transform  dark:hover:bg-gray-700 dark:bg-gray-700/50 dark:border-emerald-500 ${selectedStatuses.includes(st) ? 'text-white bg-emerald-500' : ' bg-emerald-400/80 text-white'}`}
                                                    onClick={() => {
                                                        setError(null);
                                                        handleStatusSelect(st);
                                                    }}
                                                >
                          {st}
                        </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="status-tags-container-profile">
                                            {selectedStatuses.map((st, i) => (
                                                <span
                                                    key={i}
                                                    className={`status-tag bg-emerald-400 text-white dark:hover:bg-gray-700 dark:bg-gray-700/50 dark:border-emerald-500 ${selectedStatuses.includes(st) ? 'status-tag-selected ' : ''}`}
                                                >
                          {st}
                        </span>
                                            ))}
                                        </div>
                                    )}
                                    {fieldErrors.statuses && (
                                        <p className="text-red-500 text-sm">{fieldErrors.statuses}</p>
                                    )}
                                </div>
                            </div>

                            {editMode && (
                                <button className="save-button bg-emerald-400 text-white hover:bg-emerald-300 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-sm" onClick={handleSave}>
                                    Save
                                </button>
                            )}
                            {error && <p className="error-message text-center">{error}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
