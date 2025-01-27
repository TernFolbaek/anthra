import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';
import { FaRegHandPointer, FaPlus, FaTrash, FaArrowLeft, FaSpinner } from "react-icons/fa";
import ViewProfile from "../ViewProfile/ViewProfile";

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

// Predefined statuses
const allStatuses: string[] = [
    "✎ exam preparations",
    "☺ expanding my network",
    "☏ looking for collaboration",
    "❊ general studies",
    "❀ on exchange",
    "☂ seeking mentorship"
];

const Profile: React.FC = () => {
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

    // New state to track saving status for the picture
    const [isSavingPicture, setIsSavingPicture] = useState<boolean>(false);

    // Each section can have its own open/close toggle
    const [editPicturePanelOpen, setEditPicturePanelOpen] = useState(false);
    const [personalPanelOpen, setPersonalPanelOpen] = useState(false);
    const [locationPanelOpen, setLocationPanelOpen] = useState(false);
    const [aboutPanelOpen, setAboutPanelOpen] = useState(false);
    const [subjectsPanelOpen, setSubjectsPanelOpen] = useState(false);
    const [coursesPanelOpen, setCoursesPanelOpen] = useState(false);
    const [statusesPanelOpen, setStatusesPanelOpen] = useState(false);
    const [aboutMeCharCount, setAboutMeCharCount] = useState(profileData?.aboutMe.length || 0);
    // -------------------
    //  Backup States
    // -------------------
    const [personalBackup, setPersonalBackup] = useState({
        firstName: "",
        lastName: "",
        age: 0,
        institution: "",
        work: ""
    });
    const [locationBackup, setLocationBackup] = useState({
        country: "",
        city: ""
    });
    const [aboutBackup, setAboutBackup] = useState("");
    const [subjectsBackup, setSubjectsBackup] = useState<string[]>([]);
    const [coursesBackup, setCoursesBackup] = useState<Course[]>([]);
    const [statusesBackup, setStatusesBackup] = useState<string[]>([]);
    const [profilePictureBackup, setProfilePictureBackup] = useState<File | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const currentUserId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profileData) {
            setSelectedStatuses(profileData.statuses || []);
        }
    }, [profileData]);

    const handleUserSelect = () => {
        setSelectedUserId(currentUserId);
    }

    const handleCloseProfile = () => {
        setSelectedUserId(null);
    }

    const fetchProfile = async () => {
        try {
            const response = await axios.get('/Profile/GetProfile', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Split location into country/city
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
            setAboutMeCharCount(response.data.aboutMe.length)

            setSelectedStatuses(response.data.statuses || []);
        } catch (err) {
            setError('Failed to fetch profile data');
        }
    };

    // -----------------------------------
    //    Input Change Handlers
    // -----------------------------------
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        if (profileData) {
            const { name, value } = e.target;
            setAboutMeCharCount(value.length)
            setProfileData({
                ...profileData,
                [name]: value,
            });
        }
    };

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

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const maxSizeInBytes = 2 * 1024 * 1024;
            if (file.size > maxSizeInBytes) {
                alert("File size must be less than 2MB.");
                e.target.value = "";
                return;
            }
            setProfilePictureFile(file);
        }
    };

    // -----------------------------------
    //    Array Fields (Courses/Subjects)
    // -----------------------------------
    // Courses
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
        if (profileData && profileData.courses.length < 4) {
            setProfileData({
                ...profileData,
                courses: [
                    ...profileData.courses,
                    { courseName: '', courseLink: '' }
                ],
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

    // Subjects
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
        if (profileData && profileData.subjects.length < 5) {
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

    // Status selection
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

    // -----------------------------------
    //    FormData Helper
    // -----------------------------------
    function buildFormData(
        profileData: ProfileData,
        selectedStatuses: string[],
        profilePictureFile: File | null
    ): FormData {
        const formData = new FormData();

        // Scalar fields
        formData.append('FirstName', profileData.firstName);
        formData.append('LastName', profileData.lastName);
        formData.append('Location', `${profileData.location.country},${profileData.location.city}`);
        formData.append('Institution', profileData.institution);
        formData.append('Work', profileData.work);
        formData.append('AboutMe', profileData.aboutMe);
        formData.append('Age', profileData.age.toString());

        // Convert courses to JSON
        formData.append('Courses', JSON.stringify(profileData.courses ?? []));

        // The backend expects repeated "Subjects" for each subject in the array
        profileData.subjects?.forEach((subject) => {
            formData.append('Subjects', subject);
        });

        // Statuses (2-3)
        selectedStatuses.forEach((status) => {
            formData.append('Statuses', status);
        });

        // Profile picture (if changed)
        if (profilePictureFile) {
            formData.append('ProfilePicture', profilePictureFile);
        }

        return formData;
    }

    // -----------------------------------
    //    Save Handlers (Panels)
    // -----------------------------------

    // 1) Save Picture
    const handleSavePicture = async () => {
        if (!profileData) return;
        setError(null);
        setFieldErrors({});
        setIsSavingPicture(true); // Start saving

        try {
            const formData = buildFormData(profileData, selectedStatuses, profilePictureFile);
            await axios.post('/Profile/UpdateProfile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
            setEditPicturePanelOpen(false);
            fetchProfile();
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsSavingPicture(false); // End saving
        }
    };

    // 2) Save Personal Info
    const handleSavePersonal = async () => {
        if (!profileData) return;
        setError(null);
        setFieldErrors({});

        // Minimal example validations
        const newFieldErrors: { [key: string]: string } = {};
        let hasError = false;

        if (profileData.firstName.includes(' ')) {
            newFieldErrors.firstName = 'First Name must be one word without spaces';
            hasError = true;
        }
        if (profileData.firstName.length > 15) {
            newFieldErrors.firstName = 'First Name cannot exceed 15 characters';
            hasError = true;
        }

        if (profileData.lastName.includes(' ')) {
            newFieldErrors.lastName = 'Last Name must be one word without spaces';
            hasError = true;
        }
        if (profileData.lastName.length > 15) {
            newFieldErrors.lastName = 'Last Name cannot exceed 15 characters';
            hasError = true;
        }

        if (hasError) {
            setFieldErrors(newFieldErrors);
            return;
        }

        try {
            const formData = buildFormData(profileData, selectedStatuses, profilePictureFile);
            await axios.post('/Profile/UpdateProfile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
            setPersonalPanelOpen(false);
            fetchProfile();
        } catch (err) {
            setError('An error occurred while saving personal info.');
        }
    };

    // 3) Save Location
    const handleSaveLocation = async () => {
        if (!profileData) return;
        setError(null);
        setFieldErrors({});

        // Example check: Make sure country and city exist
        if (!profileData.location.country || !profileData.location.city) {
            setFieldErrors({
                country: !profileData.location.country ? 'Country is required' : '',
                city: !profileData.location.city ? 'City is required' : ''
            });
            return;
        }

        try {
            const formData = buildFormData(profileData, selectedStatuses, profilePictureFile);
            await axios.post('/Profile/UpdateProfile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
            setLocationPanelOpen(false);
            fetchProfile();
        } catch (err) {
            setError('An error occurred while saving location info.');
        }
    };

    // 4) Save About Me
    const handleSaveAbout = async () => {
        if (!profileData) return;
        setError(null);
        setFieldErrors({});

        // Example check: AboutMe length
        if (profileData.aboutMe.length < 150 || profileData.aboutMe.length > 300) {
            setFieldErrors({
                aboutMe: 'About Me must be between 150 and 300 characters',
            });
            return;
        }

        try {
            const formData = buildFormData(profileData, selectedStatuses, profilePictureFile);
            await axios.post('/Profile/UpdateProfile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
            setAboutPanelOpen(false);
            fetchProfile();
        } catch (err) {
            setError('An error occurred while saving About Me.');
        }
    };

    // 5) Save Subjects
    const handleSaveSubjects = async () => {
        if (!profileData) return;
        setError(null);
        setFieldErrors({});

        // Must have 2-5 subjects
        if (profileData.subjects.length < 2 || profileData.subjects.length > 5) {
            setFieldErrors({
                subjects: 'Please add between 2 and 5 subjects.'
            });
            return;
        }

        try {
            const formData = buildFormData(profileData, selectedStatuses, profilePictureFile);
            await axios.post('/Profile/UpdateProfile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
            setSubjectsPanelOpen(false);
            fetchProfile();
        } catch (err) {
            setError('An error occurred while saving subjects.');
        }
    };

    // 6) Save Courses
    const handleSaveCourses = async () => {
        if (!profileData) return;
        setError(null);
        setFieldErrors({});

        // Must have 2-4 courses
        if (profileData.courses.length < 2 || profileData.courses.length > 4) {
            setFieldErrors({
                courses: 'Please have between 2 and 4 courses.'
            });
            return;
        }

        try {
            const formData = buildFormData(profileData, selectedStatuses, profilePictureFile);
            await axios.post('/Profile/UpdateProfile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
            setCoursesPanelOpen(false);
            fetchProfile();
        } catch (err) {
            setError('An error occurred while saving courses.');
        }
    };

    // 7) Save Statuses
    const handleSaveStatuses = async () => {
        if (!profileData) return;
        setError(null);
        setFieldErrors({});

        // 2-3 statuses
        if (selectedStatuses.length < 2 || selectedStatuses.length > 3) {
            setFieldErrors({
                statuses: 'Please select between 2 and 3 statuses.'
            });
            return;
        }

        try {
            const formData = buildFormData(profileData, selectedStatuses, profilePictureFile);
            await axios.post('/Profile/UpdateProfile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
            setStatusesPanelOpen(false);
            fetchProfile();
        } catch (err) {
            setError('An error occurred while saving statuses.');
        }
    };

    // -------------------------------------------------------
    //  Revert Handlers (one for each panel)
    // -------------------------------------------------------
    // Called when user clicks "Revert" inside a panel

    const handleRevertPicture = () => {
        // Revert the file
        setProfilePictureFile(profilePictureBackup);
    };

    const handleRevertPersonal = () => {
        if (!profileData) return;
        // Revert the personal fields
        setProfileData({
            ...profileData,
            firstName: personalBackup.firstName,
            lastName: personalBackup.lastName,
            age: personalBackup.age,
            institution: personalBackup.institution,
            work: personalBackup.work
        });
    };

    const handleRevertLocation = () => {
        if (!profileData) return;
        setProfileData({
            ...profileData,
            location: {
                country: locationBackup.country,
                city: locationBackup.city
            }
        });
    };

    const handleRevertAbout = () => {
        if (!profileData) return;
        setProfileData({
            ...profileData,
            aboutMe: aboutBackup
        });
    };

    const handleRevertSubjects = () => {
        if (!profileData) return;
        setProfileData({
            ...profileData,
            subjects: [...subjectsBackup]
        });
    };

    const handleRevertCourses = () => {
        if (!profileData) return;
        setProfileData({
            ...profileData,
            courses: [...coursesBackup]
        });
    };

    const handleRevertStatuses = () => {
        // This reverts the "selectedStatuses" array
        setSelectedStatuses([...statusesBackup]);
    };

    // -------------------------------------------------------
    //  Toggle Panel Handlers
    //  (When opening a panel, store backup)
    // -------------------------------------------------------
    const toggleEditPicturePanel = () => {
        // If we are about to OPEN the picture panel, store the backup
        if (!editPicturePanelOpen && profileData) {
            setProfilePictureBackup(profilePictureFile);
        }
        setEditPicturePanelOpen(!editPicturePanelOpen);
    };

    const togglePersonalPanel = () => {
        if (!personalPanelOpen && profileData) {
            setPersonalBackup({
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                age: profileData.age,
                institution: profileData.institution,
                work: profileData.work
            });
        }
        setPersonalPanelOpen(!personalPanelOpen);
    };

    const toggleLocationPanel = () => {
        if (!locationPanelOpen && profileData) {
            setLocationBackup({
                country: profileData.location.country,
                city: profileData.location.city
            });
        }
        setLocationPanelOpen(!locationPanelOpen);
    };

    const toggleAboutPanel = () => {
        if (!aboutPanelOpen && profileData) {
            setAboutBackup(profileData.aboutMe);
        }
        setAboutPanelOpen(!aboutPanelOpen);
    };

    const toggleSubjectsPanel = () => {
        if (!subjectsPanelOpen && profileData) {
            setSubjectsBackup([...profileData.subjects]);
        }
        setSubjectsPanelOpen(!subjectsPanelOpen);
    };

    const toggleCoursesPanel = () => {
        if (!coursesPanelOpen && profileData) {
            setCoursesBackup([...profileData.courses]);
        }
        setCoursesPanelOpen(!coursesPanelOpen);
    };

    const toggleStatusesPanel = () => {
        if (!statusesPanelOpen) {
            setStatusesBackup([...selectedStatuses]);
        }
        setStatusesPanelOpen(!statusesPanelOpen);
    };

    // -----------------------------------
    //    Render
    // -----------------------------------
    if (!profileData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <FaSpinner className="animate-spin text-4xl text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-card">
                {/* Top section: Profile Picture & Username */}
                <div className="flex flex-col gap-8 sm:items-center">
                    <div className="relative flex flex-col items-center ">
                        <div className="profile-picture mr-auto ml-auto">
                            <img
                                src={
                                    profilePictureFile
                                        ? URL.createObjectURL(profilePictureFile)
                                        : profileData.profilePictureUrl
                                }
                                alt="Profile"
                            />
                            {editPicturePanelOpen && (
                                <div className="profile-picture-overlay flex justify-center">
                                    <input
                                        type="file"
                                        name="profileImage"
                                        accept="image/*"
                                        onChange={handleProfilePictureChange}
                                        className="hidden-file-input"
                                    />
                                    <div className="overlay-content">
                                        <FaRegHandPointer className="cursor-icon" />
                                        <span>Change Picture</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            className="save-button bg-emerald-400 hover:bg-emerald-300 text-white dark:hover:bg-emerald-400 dark:text-white dark:bg-emerald-500 mt-2"
                            onClick={() => {
                                setError(null);
                                setFieldErrors({});
                                toggleEditPicturePanel();
                            }}
                        >
                            {editPicturePanelOpen ? 'Cancel' : 'Edit Picture'}
                        </button>
                        {editPicturePanelOpen && (
                            <div className="flex gap-2 mt-2">
                                {/* Conditionally render buttons or spinner */}
                                {isSavingPicture ? (
                                    <div className="flex items-center justify-center w-full">
                                        <FaSpinner className="animate-spin text-emerald-500 text-xl" />
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            className="save-button bg-emerald-400 text-white hover:bg-emerald-300 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-sm"
                                            onClick={handleSavePicture}
                                        >
                                            Save Picture
                                        </button>
                                        <button
                                            className="save-button transform hover:scale-105 dark:text-white text-gray-500 text-sm flex items-center gap-1"
                                            onClick={handleRevertPicture}
                                        >
                                            <FaArrowLeft />
                                            Revert
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-4 items-center">
                        <p className="font-bold text-xl dark:text-white">@{profileData.userName}</p>
                        <button className="text-center text-sm font-semibold hover:underline dark:text-gray-200" onClick={()=>handleUserSelect()}>
                            Preview Profile
                        </button>
                    </div>
                </div>


                {/* Personal Info Panel */}
                <div className="panel-container mt-6">
                    <div className="panel-header bg-emerald-50 cursor-pointer" onClick={togglePersonalPanel}>
                        <h3 className="panel-title">Personal Info</h3>
                    </div>
                    {personalPanelOpen && (
                        <div className="panel-body">
                            <div className="profile-row">
                                <div className="profile-field half-width">
                                    <label>First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={profileData.firstName}
                                        onChange={handleInputChange}
                                        className={fieldErrors.firstName ? 'border border-red-500' : ''}
                                    />
                                    {fieldErrors.firstName && (
                                        <p className="text-red-500 text-sm">{fieldErrors.firstName}</p>
                                    )}
                                </div>
                                <div className="profile-field half-width">
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={profileData.lastName}
                                        onChange={handleInputChange}
                                        className={fieldErrors.lastName ? 'border border-red-500' : ''}
                                    />
                                    {fieldErrors.lastName && (
                                        <p className="text-red-500 text-sm">{fieldErrors.lastName}</p>
                                    )}
                                </div>
                            </div>
                            <div className="profile-row">
                                <div className="profile-field half-width">
                                    <label>Age</label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={profileData.age}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="profile-field half-width">
                                    <label>Institution</label>
                                    <input
                                        type="text"
                                        name="institution"
                                        value={profileData.institution}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="profile-row">
                                <div className="profile-field half-width">
                                    <label>Work</label>
                                    <input
                                        type="text"
                                        name="work"
                                        value={profileData.work}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button
                                    className="save-button bg-emerald-400 text-white hover:bg-emerald-300 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-sm"
                                    onClick={handleSavePersonal}
                                >
                                    Save
                                </button>
                                <button
                                    className="save-button text-gray-500 dark:text-gray-300 text-sm flex items-center gap-1"
                                    onClick={handleRevertPersonal}
                                >
                                    <FaArrowLeft size={12}/>
                                    Revert Back
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Location Panel */}
                <div className="panel-container">
                    <div className="panel-header bg-emerald-50 cursor-pointer" onClick={toggleLocationPanel}>
                        <h3 className="panel-title">Location</h3>
                    </div>
                    {locationPanelOpen && (
                        <div className="panel-body">
                            <div className="profile-row">
                                <div className="profile-field half-width">
                                    <label>Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={profileData.location.country}
                                        onChange={handleLocationChange}
                                        className={fieldErrors.country ? 'border border-red-500' : ''}
                                    />
                                    {fieldErrors.country && (
                                        <p className="text-red-500 text-sm">{fieldErrors.country}</p>
                                    )}
                                </div>
                                <div className="profile-field half-width">
                                    <label>City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={profileData.location.city}
                                        onChange={handleLocationChange}
                                        className={fieldErrors.city ? 'border border-red-500' : ''}
                                    />
                                    {fieldErrors.city && (
                                        <p className="text-red-500 text-sm">{fieldErrors.city}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button
                                    className="save-button bg-emerald-400 text-white hover:bg-emerald-300 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-sm"
                                    onClick={handleSaveLocation}
                                >
                                    Save
                                </button>
                                <button
                                    className="save-button text-gray-500 dark:text-gray-300 text-sm flex items-center gap-1"
                                    onClick={handleRevertLocation}
                                >
                                    <FaArrowLeft size={12}/>
                                    Revert Back
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* About Me Panel */}
                <div className="panel-container">
                    <div className="panel-header bg-emerald-50 cursor-pointer" onClick={toggleAboutPanel}>
                        <h3 className="panel-title">About Me</h3>
                    </div>
                    {aboutPanelOpen && (
                        <div className="panel-body">
                            <p className="dark:text-white font-medium  text-sm mb-1 flex items-center gap-1 text-gray-700">
                                Characters: {aboutMeCharCount}
                                <span className="text-xs text-gray-500 dark:text-gray-200">(min. 150, max. 300)</span>
                            </p>
                            <textarea
                                name="aboutMe"
                                value={profileData.aboutMe}
                                onChange={handleInputChange}
                                rows={5}
                                minLength={150}
                                maxLength={300}
                                className={`w-full text-sm rounded-md h-[200px] border border-gray-300 ${fieldErrors.aboutMe ? 'border border-red-500' : ''}`}
                            />
                            {fieldErrors.aboutMe && (
                                <p className="text-red-500 text-sm">{fieldErrors.aboutMe}</p>
                            )}
                            <div className="flex gap-2 mt-3">
                                <button
                                    className="save-button bg-emerald-400 text-white hover:bg-emerald-300 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-sm"
                                    onClick={handleSaveAbout}
                                >
                                    Save
                                </button>
                                <button
                                    className="save-button text-gray-500 dark:text-gray-300 text-sm flex items-center gap-1"
                                    onClick={handleRevertAbout}
                                >
                                    <FaArrowLeft size={12} />
                                    Revert Back
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Subjects Panel */}
                <div className="panel-container">
                    <div className="panel-header bg-emerald-50 cursor-pointer" onClick={toggleSubjectsPanel}>
                        <h3 className="panel-title">Subjects</h3>
                    </div>
                    {subjectsPanelOpen && (
                        <div className="panel-body">
                            <div className="flex flex-col gap-2">
                                {profileData.subjects.map((subject, index) => (
                                    <div key={index} className="subject-item flex">
                                        <input
                                            type="text"
                                            value={subject}
                                            onChange={(e) => handleSubjectChange(index, e.target.value)}
                                            className={fieldErrors.subjects ? 'border border-red-500 w-full bg-slate-100 text-sm' : 'w-full bg-slate-100 text-sm'}
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
                                <div className="flex items-center">
                                    <button
                                        type="button"
                                        onClick={addSubject}
                                        className="profile-icon-button bg-emerald-200"
                                    >
                                        <FaPlus />
                                    </button>
                                    <p className="text-gray-500 dark:text-gray-200 text-xs font-semibold">New Subject</p>
                                </div>
                            </div>
                            {fieldErrors.subjects && (
                                <p className="text-red-500 text-sm">{fieldErrors.subjects}</p>
                            )}
                            <div className="flex gap-2 mt-3">
                                <button
                                    className="save-button bg-emerald-400 text-white hover:bg-emerald-300 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-sm"
                                    onClick={handleSaveSubjects}
                                >
                                    Save
                                </button>
                                <button
                                    className="save-button text-gray-500 dark:text-gray-300 text-sm flex items-center gap-1"
                                    onClick={handleRevertSubjects}
                                >
                                    <FaArrowLeft size={12}/>
                                    Revert Back
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Courses Panel */}
                <div className="panel-container">
                    <div className="panel-header bg-emerald-50 cursor-pointer" onClick={toggleCoursesPanel}>
                        <h3 className="panel-title">Courses</h3>
                    </div>
                    {coursesPanelOpen && (
                        <div className="panel-body">
                            {profileData.courses.map((course, index) => (
                                <div key={index} className="course-item dark:text-emerald-400 gap-2 flex items-center">
                                    <div className="w-full flex flex-col gap-1">
                                        <div className="flex gap-2 items-center w-full">
                                            <p className="w-[100px] text-sm text-gray-500 dark:text-gray-200 font-medium">Name</p>
                                            <input
                                                type="text"
                                                placeholder="Course Name"
                                                value={course.courseName}
                                                onChange={(e) => handleCourseChange(index, 'courseName', e.target.value)}
                                                className={fieldErrors.courses ? 'border border-red-500 flex-1 text-sm' : 'bg-slate-100 flex-1 text-sm'}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 w-full">
                                            <p className="w-[100px] text-sm text-gray-500 dark:text-gray-200 font-medium">Link</p>
                                            <input
                                                type="text"
                                                placeholder="Course Link"
                                                value={course.courseLink}
                                                onChange={(e) => handleCourseChange(index, 'courseLink', e.target.value)}
                                                className={fieldErrors.courses ? 'border border-red-500 flex-1 text-sm' : ' text-sm bg-slate-100 flex-1'}
                                            />
                                        </div>
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
                                    className="profile-icon-button bg-emerald-200"
                                >
                                    <FaPlus />
                                </button>
                                <p className="text-gray-500 dark:text-gray-200 text-xs font-semibold">New Course</p>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button
                                    className="save-button bg-emerald-400 text-white hover:bg-emerald-300 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-sm"
                                    onClick={handleSaveCourses}
                                >
                                    Save
                                </button>
                                <button
                                    className="save-button text-gray-500 dark:text-gray-300 text-sm flex items-center gap-1"
                                    onClick={handleRevertCourses}
                                >
                                    <FaArrowLeft size={12}/>
                                    Revert Back
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Statuses Panel */}
                <div className="panel-container">
                    <div className="panel-header bg-emerald-50 cursor-pointer" onClick={toggleStatusesPanel}>
                        <h3 className="panel-title">Status</h3>
                    </div>
                    {statusesPanelOpen && (
                        <div className="panel-body">
                            <div className="status-tags-container-profile">
                                {allStatuses.map((st, i) => (
                                    <span
                                        key={i}
                                        className={`status-tag hover:scale-105 transform  ${
                                            selectedStatuses.includes(st)
                                                ? 'text-white bg-emerald-500 dark:bg-emerald-900'
                                                : 'bg-emerald-400/80 text-white'
                                        }`}
                                        onClick={() => {
                                            setError(null);
                                            handleStatusSelect(st);
                                        }}
                                    >
                                            {st}
                                        </span>
                                ))}
                            </div>
                            {fieldErrors.statuses && (
                                <p className="text-red-500 text-sm">{fieldErrors.statuses}</p>
                            )}
                            <div className="flex gap-2 mt-3">
                                <button
                                    className="save-button bg-emerald-400 text-white hover:bg-emerald-300 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-sm"
                                    onClick={handleSaveStatuses}
                                >
                                    Save
                                </button>
                                <button
                                    className="save-button text-gray-500 dark:text-gray-300 text-sm flex items-center gap-1"
                                    onClick={handleRevertStatuses}
                                >
                                    <FaArrowLeft size={12}/>
                                    Revert Back
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {error && <p className="error-message text-center text-red-500">{error}</p>}
            </div>
            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile} />
            )}
        </div>
    );
};

export default Profile;
