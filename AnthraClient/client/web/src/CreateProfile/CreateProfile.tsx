// CreateProfile.tsx

import React, { useState } from 'react';
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
import {FaTimes, FaExternalLinkAlt, FaPlusCircle} from 'react-icons/fa';
import StepOne from './StepOne';

interface CreateProfileProps {
    onProfileCreated: () => void;
}

interface Course {
    courseName: string;
    courseLink: string;
}

const CreateProfile: React.FC<CreateProfileProps> = ({ onProfileCreated }) => {
    // Step management
    const [step, setStep] = useState(1);

    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState<number | ''>('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

    const [work, setWork] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [courseInput, setCourseInput] = useState('');
    const [courseLinkInput, setCourseLinkInput] = useState('');
    const [courseSuggestions, setCourseSuggestions] = useState<Course[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [aboutMe, setAboutMe] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [institution, setInstitution] = useState<string>('');
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState<boolean>(false);
    const [faculty, setFaculty] = useState<string>('');
    const institutions: string[] = ['CBS', 'DTU', 'KU'];
    const faculties: string[] = ['Health & Medical', 'Humanities', 'Sciences', 'Theology', 'Social Sciences', 'Law'];

    const token = localStorage.getItem('token');
    const cbsCoursesArray: Course[] = cbsCourses as Course[];
    const dtuCoursesArray: Course[] = dtuCourses as Course[];
    const lawCoursesArray: Course[] = lawCourses as Course[];
    const humanitiesCoursesArray: Course[] = humanitiesCourses as Course[];
    const sciencesCoursesArray: Course[] = sciencesCourses as Course[];
    const socialSciencesCoursesArray: Course[] = socialSciencesCourses as Course[];
    const theologyCoursesArray: Course[] = theologyCourses as Course[];
    const healthAndMedicalCoursesArray: Course[] = healthAndMedicalCourses as Course[];

    const handleDropdownClick = () => {
        setIsOpen(!isOpen);
    };

    const handleOptionClick = (selectedInstitution: string) => {
        if (selectedInstitution !== institution) {
            setCourses([]); // Clear courses
            setFaculty(''); // Reset faculty
        }
        setInstitution(selectedInstitution);
        setIsOpen(false);
    };

    const handleFacultyDropdownClick = () => {
        setIsFacultyDropdownOpen(!isFacultyDropdownOpen);
    };

    const handleFacultyOptionClick = (selectedFaculty: string) => {
        if (selectedFaculty !== faculty) {
            setCourses([]); // Clear courses
        }
        setFaculty(selectedFaculty);
        setIsFacultyDropdownOpen(false);
    };

    // Handle form submission
    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append('FirstName', firstName);
        formData.append('LastName', lastName);
        formData.append('Location', `${city}, ${country}`);
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
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
            localStorage.setItem('fullName', `${firstName} ${lastName}`);
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
            if (!firstName || !lastName || !age || !country || !city || !profilePictureFile) {
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

        if (value.trim() === '') {
            setCourseSuggestions([]);
            return;
        }
        let suggestions: Course[] = [];

        if (institution === 'CBS') {
            suggestions = cbsCoursesArray
                .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 5); // Get top 5 suggestions
            setCourseSuggestions(suggestions);
        } else if (institution === 'DTU') {
            suggestions = dtuCoursesArray
                .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 5); // Get top 5 suggestions
            setCourseSuggestions(suggestions);
        } else if (institution === 'KU') {
            if (faculty === 'Health & Medical') {
                suggestions = healthAndMedicalCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            } else if (faculty === 'Law') {
                suggestions = lawCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            } else if (faculty === 'Sciences') {
                suggestions = sciencesCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            } else if (faculty === 'Theology') {
                suggestions = theologyCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            } else if (faculty === 'Social Sciences') {
                suggestions = socialSciencesCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            } else if (faculty === 'Humanities') {
                suggestions = humanitiesCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            }
        } else {
            suggestions = [];
        }
        setCourseSuggestions(suggestions);
    };

    const handleCourseSelect = (course: Course) => {
        if (!courses.some((c) => c.courseName === course.courseName)) {
            setCourses([...courses, course]);
        }
        setCourseInput('');
        setCourseSuggestions([]);
    };

    const handleAddCourse = () => {
        if (courseInput && !courses.some((c) => c.courseName === courseInput)) {
            const newCourse: Course = {
                courseName: courseInput,
                courseLink: courseLinkInput || '',
            };
            setCourses([...courses, newCourse]);
            setCourseInput('');
            setCourseLinkInput('');
            setCourseSuggestions([]);
        }
    };

    // Handle removing a course
    const handleRemoveCourse = (courseName: string) => {
        setCourses(courses.filter((c) => c.courseName !== courseName));
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
                    <StepOne
                        firstName={firstName}
                        setFirstName={setFirstName}
                        lastName={lastName}
                        setLastName={setLastName}
                        age={age}
                        setAge={setAge}
                        country={country}
                        setCountry={setCountry}
                        city={city}
                        setCity={setCity}
                        profilePictureFile={profilePictureFile}
                        setProfilePictureFile={setProfilePictureFile}
                    />
                )}

                {step === 2 && (
                    <div className="form-step">
                        <label htmlFor="aboutMe" className="input-label">
                            About Me
                        </label>
                        <div className="textarea-with-counter">
                            <div className="char-counter">{aboutMe.length}/250</div>
                            <textarea
                                id="aboutMe"
                                placeholder="About Me"
                                maxLength={250}
                                value={aboutMe}
                                onChange={(e) => setAboutMe(e.target.value)}
                            />
                        </div>

                        <div className="flex">
                            <div className="custom-dropdown flex items-center gap-x-2">
                                <label className="input-label">Institution</label>
                                <div
                                    className="create-profile-dropdown-header mr-5"
                                    onClick={handleDropdownClick}
                                >
                                    {institution ? institution : 'Select Institution'}
                                    <span className="dropdown-arrow">▼</span>
                                </div>
                                {isOpen && (
                                    <div className="uni-dropdown-menu">
                                        {institutions.map((inst) => (
                                            <div
                                                key={inst}
                                                className="uni-dropdown-item"
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
                                    <label className="input-label">Faculty</label>
                                    <div
                                        className="create-profile-dropdown-header"
                                        onClick={handleFacultyDropdownClick}
                                    >
                                        {faculty ? faculty : 'Select Faculty'}
                                        <span className="dropdown-arrow">▼</span>
                                    </div>
                                    {isFacultyDropdownOpen && (
                                        <div className="uni-dropdown-menu">
                                            {faculties.map((faculty) => (
                                                <div
                                                    key={faculty}
                                                    className="uni-dropdown-item"
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

                        {/* Course input */}
                        <label htmlFor="courseInput" className="input-label">
                            Courses
                        </label>
                        <div className="course-input-container">
                            <div className="flex items-center gap-1">
                                <input
                                    id="courseInput"
                                    type="text"
                                    placeholder="Add Course"
                                    value={courseInput}
                                    onChange={handleCourseInputChange}
                                    className="course-input"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCourse}
                                    className="course-add-button"
                                >
                                    <FaPlusCircle/>
                                </button>
                            </div>

                        {courseSuggestions.length > 0 && (
                            <ul className="suggestions-list">
                                {courseSuggestions.map((course, index) => (
                                    <li
                                        className="suggestion-item"
                                        key={index}
                                        onClick={() => handleCourseSelect(course)}
                                    >
                                            {course.courseName}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {courseInput && courseSuggestions.length === 0 && institution && (
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Course Link (optional)"
                                        value={courseLinkInput}
                                        onChange={(e) => setCourseLinkInput(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Display selected courses */}
                        {courses.length > 0 && (
                            <div className="selected-courses">
                                {courses.map((course, index) => (
                                    <span key={index} className="course-tag">
                                        {course.courseLink ? (
                                            <a
                                                href={
                                                    course.courseLink.startsWith('http')
                                                        ? course.courseLink
                                                        : `https://${course.courseLink}`
                                                }
                                                className="course-link"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {course.courseName}
                                                <FaExternalLinkAlt className="external-link-icon"/>
                                            </a>
                                        ) : (
                                            <span>{course.courseName}</span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCourse(course.courseName)}
                                            className="remove-course-button"
                                        >
                                            <FaTimes />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Subjects input */}
                        <label htmlFor="subjects" className="input-label">
                            Subjects
                        </label>
                        <input
                            id="subjects"
                            type="text"
                            placeholder="Subjects (comma-separated)"
                            value={subjects.join(', ')}
                            onChange={(e) =>
                                setSubjects(e.target.value.split(',').map((s) => s.trim()))
                            }
                        />

                        <label htmlFor="work" className="input-label">
                            Work
                        </label>
                        <input
                            id="work"
                            type="text"
                            placeholder="Work"
                            value={work}
                            onChange={(e) => setWork(e.target.value)}
                        />
                    </div>
                )}

                <div className="button-container">
                    {step > 1 && (
                        <button type="button" className="create-profile-back-button" onClick={handleBack}>
                            Back
                        </button>
                    )}
                    <button type="button" className="create-profile-next-button" onClick={handleNext}>
                        {step === 2 ? 'Submit' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateProfile;
