import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './CreateProfile.css';
import cbsCourses from './cbs/cbsCourses.json';
import dtuCourses from './dtu/dtuCourses.json';
import lawCourses from './ku/lawCourses.json';
import humanitiesCourses from './ku/humanitiesCourses.json';
import sciencesCourses from './ku/sciencesCourses.json';
import socialSciencesCourses from './ku/socialSciencesCourses.json';
import healthAndMedicalCourses from './ku/healthAndMedicalCourses.json';
import theologyCourses from './ku/theologyCourses.json';


interface CreateProfileProps {
    onProfileCreated: () => void;
}

const CreateProfile: React.FC<CreateProfileProps> = ({ onProfileCreated }) => {
    // Step management
    const [step, setStep] = useState(1);

    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [location, setLocation] = useState('');
    const [work, setWork] = useState('');
    const [courses, setCourses] = useState<string[]>([]);
    const [courseInput, setCourseInput] = useState('');
    const [courseSuggestions, setCourseSuggestions] = useState<string[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [aboutMe, setAboutMe] = useState('');
    const [age, setAge] = useState<number | ''>('');
    const [profilePictureUrl, setProfilePictureUrl] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [institution, setInstitution] = useState<string>("");
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState<boolean>(false);
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null); // New state for profile picture

    const [faculty, setFaculty] = useState<string>("");
    const institutions: string[] = ["CBS", "DTU", "KU"];
    const faculties: string[] = ['Health & Medical','Humanities','Sciences','Theology','Social Sciences', 'Law'];

    const token = localStorage.getItem('token');
    const handleDropdownClick = () => {
        setIsOpen(!isOpen);
    };

    const handleOptionClick = (institution: string) => {
        setInstitution(institution);
        setIsOpen(false);
    };

    const handleFacultyDropdownClick = () => {
        setIsFacultyDropdownOpen(!isFacultyDropdownOpen);
    }

    const handleFacultyOptionClick = (selectedFaculty: string) => {
        setFaculty(selectedFaculty);
        setIsFacultyDropdownOpen(false);
    };

    // File input ref for profile picture upload
    const fileInputRef = useRef<HTMLInputElement>(null);


    // Handle form submission
    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append('FirstName', firstName);
        formData.append('LastName', lastName);
        formData.append('Location', location);
        formData.append('Institution', institution);
        formData.append('Work', work);
        formData.append('AboutMe', aboutMe);
        formData.append('Age', age === '' ? '' : age.toString());
        formData.append('Courses', JSON.stringify(courses));
        subjects.forEach((subject) => formData.append('Subjects', subject));

        if (profilePictureFile) {
            formData.append('ProfilePicture', profilePictureFile); // Append the profile picture from state
        } else {
            setError('Profile picture is required.');
            return;
        }

        try {
            await axios.post('http://localhost:5001/api/Profile/UpdateProfile', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            });
            onProfileCreated();
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
            setMessage(null);
        }
    };

    // Handle next button click
    const handleNext = () => {
        if (step === 1) {
            // Basic validation for step 1 fields
            if (
                !firstName ||
                !lastName ||
                !age ||
                !location ||
                !fileInputRef.current?.files?.[0]
            ) {
                setError('Please fill in all required fields.');
                return;
            }
            setError(null);
            setStep(2);
        } else {
            handleSubmit();
        }
    };

    // Handle back button click
    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    // Calculate progress percentage
    const progressPercentage = (step / 2) * 100;

    // Handle course input change
    const handleCourseInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCourseInput(value);

        if (institution === 'CBS') {
            const suggestions = cbsCourses
                .filter((course) =>
                    course.toLowerCase().includes(value.toLowerCase())
                )
                .slice(0, 5); // Get top 5 suggestions
            setCourseSuggestions(suggestions);
        } else if(institution === 'DTU') {
            const suggestions = dtuCourses
                .filter((course) =>
                    course.toLowerCase().includes(value.toLowerCase())
                )
                .slice(0, 5); // Get top 5 suggestions
            setCourseSuggestions(suggestions);
        } else if(institution === 'KU'){
            if(faculty === 'Health & Medical'){
                const suggestions = healthAndMedicalCourses
                    .filter((course) =>
                        course.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            }else if(faculty === "Law"){
                const suggestions = lawCourses
                    .filter((course) =>
                        course.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            }else if(faculty === "Sciences"){
                const suggestions = sciencesCourses
                    .filter((course) =>
                        course.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            }else if(faculty === "Theology"){
                const suggestions = theologyCourses
                    .filter((course) =>
                        course.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            }else if(faculty === "Social Sciences"){
                const suggestions = socialSciencesCourses
                    .filter((course) =>
                        course.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            }else if(faculty === "Humanities"){
                const suggestions = humanitiesCourses
                    .filter((course) =>
                        course.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            }
        }else{
            setCourseSuggestions([]);
        }

    };


    // Handle course selection from suggestions
    const handleCourseSelect = (courseName: string) => {
        if (!courses.includes(courseName)) {
            setCourses([...courses, courseName]);
        }
        setCourseInput('');
        setCourseSuggestions([]);
    };

    // Handle adding course manually
    const handleAddCourse = () => {
        if (courseInput && !courses.includes(courseInput)) {
            setCourses([...courses, courseInput]);
            setCourseInput('');
            setCourseSuggestions([]);
        }
    };

    // Handle removing a course
    const handleRemoveCourse = (courseName: string) => {
        setCourses(courses.filter((c) => c !== courseName));
    };

    // Handle profile picture preview (optional)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePictureFile(file); // Save the selected file in state
            setPreviewUrl(URL.createObjectURL(file)); // Optionally update preview URL
        }
    };



    return (
        <div className="create-profile-page">
            <div className="progress-bar">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>
            <div className="create-profile-container">
                <h2>Create Your Profile</h2>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}

                {step === 1 && (
                    <div className="form-step">
                        <input
                            type="text"
                            placeholder="First Name"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Last Name"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Age"
                            required
                            value={age === '' ? '' : age}
                            onChange={(e) =>
                                setAge(e.target.value === '' ? '' : parseInt(e.target.value))
                            }
                        />
                        <input
                            type="text"
                            placeholder="Location"
                            required
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            required
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="choose-pfp"
                        />
                        {previewUrl && (
                            <img src={previewUrl} alt="Preview" className="image-preview" />
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="form-step">
                        <textarea
                            placeholder="About Me"
                            value={aboutMe}
                            onChange={(e) => setAboutMe(e.target.value)}
                        />

                        <div className="flex">
                            <div className="custom-dropdown flex items-center">
                                <div className="dropdown-header mr-5" onClick={handleDropdownClick}>
                                    {institution ? institution : "Select Institution"}
                                    <span className="dropdown-arrow">▼</span>
                                </div>
                                {isOpen && (
                                    <div className="dropdown-menu">
                                        {institutions.map((inst) => (
                                            <div
                                                key={inst}
                                                className="dropdown-item"
                                                onClick={() => handleOptionClick(inst)}
                                            >
                                                {inst}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {institution === 'KU' && (
                                <div className="custom-dropdown flex items-center gap-x-2">
                                    Faculty:
                                    <div className="dropdown-header" onClick={handleFacultyDropdownClick}>
                                        {faculty ? faculty : "Select Faculty"}
                                        <span className="dropdown-arrow">▼</span>
                                    </div>
                                    {isFacultyDropdownOpen && (
                                        <div className="dropdown-menu">
                                            {faculties.map((faculty) => (
                                                <div
                                                    key={faculty}
                                                    className="dropdown-item"
                                                    onClick={() => handleFacultyOptionClick(faculty)}
                                                >
                                                    {faculty}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/*Course input */}
                        <div className="course-input-container">
                            <input
                                type="text"
                                placeholder="Add Course"
                                value={courseInput}
                                onChange={handleCourseInputChange}
                                className="course-input"
                            />
                            <button type="button" onClick={handleAddCourse} className="course-add-button">
                                Add
                            </button>
                            {courseSuggestions.length > 0 && (
                                <ul className="suggestions-list">
                                    {courseSuggestions.map((suggestion, index) => (
                                        <li
                                            className="suggestion-item"
                                            key={index}
                                            onClick={() => handleCourseSelect(suggestion)}
                                        >
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Display selected courses */}
                        {courses.length > 0 && (
                            <div className="selected-courses">
                                {courses.map((courseName, index) => (
                                    <span key={index} className="course-tag">
                                        {courseName}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCourse(courseName)}
                                        >
                                            x
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        {/* Subjects input */}
                        <input
                            type="text"
                            placeholder="Subjects (comma-separated)"
                            value={subjects.join(', ')}
                            onChange={(e) =>
                                setSubjects(e.target.value.split(',').map((s) => s.trim()))
                            }
                        />
                        <input
                            type="text"
                            placeholder="Work"
                            value={work}
                            onChange={(e) => setWork(e.target.value)}
                        />
                    </div>
                )}

                <div className="button-container">
                    {step > 1 && (
                        <button type="button" className="back-button" onClick={handleBack}>
                            Back
                        </button>
                    )}
                    <button type="button" className="next-button" onClick={handleNext}>
                        {step === 2 ? 'Submit' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateProfile;
