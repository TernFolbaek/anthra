// CreateProfile.tsx

import React, { useEffect, useRef, useState } from 'react';
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
import { FaTimes, FaExternalLinkAlt, FaPlusCircle } from 'react-icons/fa';
import StepOne from './StepOne';

interface CreateProfileProps {
    onProfileCreated: () => void;
    onBackClick: () => void;
}

interface Course {
    courseName: string;
    courseLink: string;
}

const CreateProfile: React.FC<CreateProfileProps> = ({ onProfileCreated, onBackClick }) => {
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
    const [subjectInput, setSubjectInput] = useState('');
    const [aboutMe, setAboutMe] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [institution, setInstitution] = useState<string>('');
    const [otherInstitution, setOtherInstitution] = useState<string>('');
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState<boolean>(false);
    const [faculty, setFaculty] = useState<string>('');
    const institutions: string[] = ['CBS', 'DTU', 'KU', 'Other'];
    const faculties: string[] = ['Health & Medical', 'Humanities', 'Sciences', 'Theology', 'Social Sciences', 'Law'];
    const courseSuggestionRef = useRef<HTMLDivElement>(null);
    const institutionDropdownRef = useRef<HTMLDivElement>(null);
    const facultyDropdownRef = useRef<HTMLDivElement>(null);
    const courseLinkInputRef = useRef<HTMLInputElement>(null); // New ref for course link input
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
            setCourses([]);
            setFaculty('');
            setOtherInstitution('');
        }
        setInstitution(selectedInstitution);
        setIsOpen(false);
    };

    const handleFacultyDropdownClick = () => {
        setIsFacultyDropdownOpen(!isFacultyDropdownOpen);
    };

    const handleFacultyOptionClick = (selectedFaculty: string) => {
        if (selectedFaculty !== faculty) {
            setCourses([]);
        }
        setFaculty(selectedFaculty);
        setIsFacultyDropdownOpen(false);
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (courses.length < 2) {
            setError('Please add at least 2 courses.');
            return;
        }
        if (subjects.length === 0) {
            setError('Please add at least one subject.');
            return;
        }

        const formData = new FormData();
        formData.append('FirstName', firstName);
        formData.append('LastName', lastName);
        formData.append('Location', `${city}, ${country}`);
        formData.append('Institution', institution === 'Other' ? otherInstitution : institution);
        formData.append('Work', work);
        formData.append('AboutMe', aboutMe);
        formData.append('Age', age === '' ? '' : age.toString());
        formData.append('Courses', JSON.stringify(courses));
        subjects.forEach((subject) => formData.append('Subjects', subject));

        if (profilePictureFile) {
            formData.append('ProfilePicture', profilePictureFile);
        } else {
            setError('Profile picture is required.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5001/api/Profile/UpdateProfile', formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
            localStorage.setItem('fullName', `${firstName} ${lastName}`);
            localStorage.setItem('userProfilePicture', response.data.profilePictureUrl);
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
            if (!firstName || !lastName || !age || !country || !city || !profilePictureFile) {
                setError('Please fill in all required fields.');
                return;
            }
            setError(null);
            setStep(2);
        } else {
            if (!institution) {
                setError('Please select an institution.');
                return;
            }
            if (institution === 'Other' && !otherInstitution.trim()) {
                setError('Please enter your institution.');
                return;
            }
            handleSubmit();
        }
    };

    // Handle back button click
    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            setError(null);
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
                .slice(0, 5);
            setCourseSuggestions(suggestions);
        } else if (institution === 'DTU') {
            suggestions = dtuCoursesArray
                .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 5);
            setCourseSuggestions(suggestions);
        } else if (institution === 'KU') {
            if (faculty === 'Health & Medical') {
                suggestions = healthAndMedicalCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5);
                setCourseSuggestions(suggestions);
            } else if (faculty === 'Law') {
                suggestions = lawCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5);
                setCourseSuggestions(suggestions);
            } else if (faculty === 'Sciences') {
                suggestions = sciencesCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5);
                setCourseSuggestions(suggestions);
            } else if (faculty === 'Theology') {
                suggestions = theologyCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5);
                setCourseSuggestions(suggestions);
            } else if (faculty === 'Social Sciences') {
                suggestions = socialSciencesCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5);
                setCourseSuggestions(suggestions);
            } else if (faculty === 'Humanities') {
                suggestions = humanitiesCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5);
                setCourseSuggestions(suggestions);
            }
        } else {
            suggestions = [];
        }
        setCourseSuggestions(suggestions);
    };

    const handleCourseSelect = (course: Course) => {
        if (courses.length >= 4) {
            setError('You can only add up to 4 courses.');
            return;
        }
        if (!courses.some((c) => c.courseName === course.courseName)) {
            setCourses([...courses, course]);
            setError(null);
        }
        setCourseInput('');
        setCourseSuggestions([]);
    };

    const handleAddCourse = () => {
        if (courses.length >= 4) {
            setError('You can only add up to 4 courses.');
            return;
        }
        if (courseInput && !courses.some((c) => c.courseName === courseInput)) {
            const newCourse: Course = {
                courseName: courseInput,
                courseLink: courseLinkInput || '',
            };
            setCourses([...courses, newCourse]);
            setError(null);
            setCourseInput('');
            setCourseLinkInput('');
            setCourseSuggestions([]);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                courseSuggestionRef.current &&
                !courseSuggestionRef.current.contains(event.target as Node)
            ) {
                setCourseSuggestions([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutsideDropdowns = (event: MouseEvent) => {
            if (
                isOpen &&
                institutionDropdownRef.current &&
                !institutionDropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
            if (
                isFacultyDropdownOpen &&
                facultyDropdownRef.current &&
                !facultyDropdownRef.current.contains(event.target as Node)
            ) {
                setIsFacultyDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutsideDropdowns);

        return () => {
            document.removeEventListener('mousedown', handleClickOutsideDropdowns);
        };
    }, [isOpen, isFacultyDropdownOpen]);

    // Handle removing a course
    const handleRemoveCourse = (courseName: string) => {
        setCourses(courses.filter((c) => c.courseName !== courseName));
        setError(null);
    };

    // Handle adding a subject
    const handleAddSubject = () => {
        const trimmedInput = subjectInput.trim();
        if (trimmedInput === '') {
            setError('Subject cannot be empty.');
            return;
        }
        if (trimmedInput.length > 15) {
            setError('Subject cannot be longer than 15 characters.');
            return;
        }
        if (subjects.length >= 5) {
            setError('You can only add up to 5 subjects.');
            return;
        }
        if (subjects.includes(trimmedInput)) {
            setError('This subject has already been added.');
            return;
        }
        setSubjects([...subjects, trimmedInput]);
        setSubjectInput('');
        setError(null);
    };

    // Handle removing a subject
    const handleRemoveSubject = (subjectToRemove: string) => {
        setSubjects(subjects.filter((subject) => subject !== subjectToRemove));
        setError(null);
    };

    return (
        <div className="create-profile-page">
            <button className="back-button" onClick={onBackClick}>
                Back
            </button>
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
                    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
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
                        <div className="button-container">
                            <button
                                type="submit"
                                className="create-profile-next-button"
                            >
                                Next
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
                        <div className="form-step">
                            <label htmlFor="aboutMe" className="input-label">
                                About Me<span className="required-asterisk">*</span>
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
                                <div
                                    className="custom-dropdown flex items-center gap-x-2 mb-2"
                                    ref={institutionDropdownRef}
                                >
                                    <label className="input-label">Institution:<span className="required-asterisk">*</span></label>
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
                                    <div
                                        className="custom-dropdown flex items-center gap-x-2"
                                        ref={facultyDropdownRef}
                                    >
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

                            {institution === 'Other' && (
                                <div className="flex items-center gap-x-2 mb-2">
                                    <label className="input-label">Your Inst.</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your institution"
                                        value={otherInstitution}
                                        onChange={(e) => setOtherInstitution(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleNext();
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            {/* Course input */}
                            <label htmlFor="courseInput" className="input-label">
                                Courses<span className="required-asterisk">*</span>{' '}
                                <span className="counter">({courses.length}/4)</span>
                            </label>
                            <div className="course-input-container">
                                <div className="flex items-center gap-1 mb-2">
                                    <input
                                        id="courseInput"
                                        type="text"
                                        placeholder="Add Course"
                                        value={courseInput}
                                        onChange={handleCourseInputChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (courseLinkInputRef.current) {
                                                    courseLinkInputRef.current.focus();
                                                }
                                            }
                                        }}
                                        className="course-input"
                                        disabled={courses.length >= 4}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (courseLinkInputRef.current) {
                                                courseLinkInputRef.current.focus();
                                            }
                                        }}
                                        className="course-add-button"
                                        disabled={courses.length >= 4}
                                    >
                                        <FaPlusCircle />
                                    </button>
                                </div>

                                {courseSuggestions.length > 0 && (
                                    <div className="suggestions-list" ref={courseSuggestionRef}>
                                        {courseSuggestions.map((course, index) => (
                                            <li
                                                className="suggestion-item"
                                                key={index}
                                                onClick={() => handleCourseSelect(course)}
                                            >
                                                {course.courseName}
                                            </li>
                                        ))}
                                    </div>
                                )}
                                {courseInput && courseSuggestions.length === 0 && institution && (
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Course Link (optional)"
                                            value={courseLinkInput}
                                            onChange={(e) => setCourseLinkInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCourse();
                                                }
                                            }}
                                            ref={courseLinkInputRef} // Attach the ref here
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
                                                    <FaExternalLinkAlt className="external-link-icon" />
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
                            <label htmlFor="subjectInput" className="input-label">
                                Subjects<span className="required-asterisk">*</span>{' '}
                                <span className="counter">({subjects.length}/5)</span>
                            </label>
                            <div className="subject-input-container">
                                <div className="flex items-center gap-1 mb-2">
                                    <input
                                        id="subjectInput"
                                        type="text"
                                        placeholder="Add Subject"
                                        value={subjectInput}
                                        onChange={(e) => setSubjectInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddSubject();
                                            }
                                        }}
                                        className="subject-input"
                                        maxLength={15}
                                        disabled={subjects.length >= 5}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddSubject}
                                        className="course-add-button"
                                        disabled={subjects.length >= 5}
                                    >
                                        <FaPlusCircle />
                                    </button>
                                </div>
                            </div>

                            {/* Display selected subjects */}
                            {subjects.length > 0 && (
                                <div className="selected-subjects flex justify-center gap-2">
                                    {subjects.map((subject, index) => (
                                        <span
                                            key={index}
                                            className="course-tag flex items-center justify-center"
                                        >
                                            <p className="mr-1">{subject}</p>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSubject(subject)}
                                                className="remove-subject-button"
                                            >
                                                <FaTimes />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <label htmlFor="work" className="input-label">
                                Work<span className="required-asterisk">*</span>
                            </label>
                            <input
                                id="work"
                                type="text"
                                placeholder="Work"
                                value={work}
                                onChange={(e) => setWork(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleNext();
                                    }
                                }}
                            />
                        </div>

                        <div className="button-container">
                            {step > 1 && (
                                <button
                                    type="button"
                                    className="create-profile-back-button"
                                    onClick={handleBack}
                                >
                                    Back
                                </button>
                            )}
                            <button
                                type="submit"
                                className="create-profile-next-button"
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreateProfile;
