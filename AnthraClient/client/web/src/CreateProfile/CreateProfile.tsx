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
import { FaTimes, FaExternalLinkAlt } from 'react-icons/fa'; // Import icons



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
    const [location, setLocation] = useState('');
    const [work, setWork] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [courseInput, setCourseInput] = useState('');
    const [courseLinkInput, setCourseLinkInput] = useState(''); // New state for manual course link
    const [courseSuggestions, setCourseSuggestions] = useState<Course[]>([]);
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
    const [countryInput, setCountryInput] = useState('');  // New state for country input
    const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);  // New state for suggestions
    // add country suggestions
    const [faculty, setFaculty] = useState<string>("");
    const institutions: string[] = ["CBS", "DTU", "KU"];
    const faculties: string[] = ['Health & Medical','Humanities','Sciences','Theology','Social Sciences', 'Law'];

    const token = localStorage.getItem('token');
    const cbsCoursesArray: Course[] = cbsCourses as Course[];
    const dtuCoursesArray: Course[] = dtuCourses as Course[];
    const lawCoursesArray: Course[] = lawCourses as Course[];
    const humanitiesCoursesArray: Course[] = humanitiesCourses as Course[];
    const sciencesCoursesArray: Course[] = sciencesCourses as Course[];
    const socialSciencesCoursesArray: Course[] = socialSciencesCourses as Course[];
    const theologyCoursesArray: Course[] = theologyCourses as Course[];
    const healthAndMedicalCoursesArray: Course[] = healthAndMedicalCourses as Course[];


    useEffect(() => {
        const fetchCountries = async () => {
            if (countryInput.length < 2) {
                setCountrySuggestions([]);
                return;
            }

            try {
                const response = await axios.get(`https://restcountries.com/v3.1/name/${countryInput}`);
                const countryNames = response.data.map((country: any) => country.name.common);
                setCountrySuggestions(countryNames.slice(0, 5)); // Get top 5 suggestions
            } catch (error) {
                console.error('Error fetching countries:', error);
                setCountrySuggestions([]);
            }
        };

        fetchCountries();
    }, [countryInput]);

    // Handle country input change
    const handleCountryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCountryInput(value);
    };

    const handleCountrySelect = (country: string) => {
        setLocation(country);
        setCountrySuggestions([]); // Hide suggestions after selection
    };

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
    }

    const handleFacultyOptionClick = (selectedFaculty: string) => {
        if (selectedFaculty !== faculty) {
            setCourses([]); // Clear courses
        }
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

        if (value.trim() === '') {
            setCourseSuggestions([]);
            return;
        }
        let suggestions: Course[] = [];


        if (institution === 'CBS') {
            suggestions = cbsCoursesArray
                .filter((course) =>
                    course.courseName.toLowerCase().includes(value.toLowerCase())
                )
                .slice(0, 5); // Get top 5 suggestions
            setCourseSuggestions(suggestions);
        } else if(institution === 'DTU') {
            suggestions = dtuCoursesArray
                .filter((course) =>
                    course.courseName.toLowerCase().includes(value.toLowerCase())
                )
                .slice(0, 5); // Get top 5 suggestions
            setCourseSuggestions(suggestions);
        } else if(institution === 'KU'){
            if(faculty === 'Health & Medical'){
                suggestions = healthAndMedicalCoursesArray
                    .filter((course) =>
                        course.courseName.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            }else if(faculty === "Law"){
                suggestions = lawCoursesArray
                    .filter((course) =>
                        course.courseName.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            }else if(faculty === "Sciences"){
                suggestions = sciencesCoursesArray
                    .filter((course) =>
                        course.courseName.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            }else if(faculty === "Theology"){
                suggestions = theologyCoursesArray
                    .filter((course) =>
                        course.courseName.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            }else if(faculty === "Social Sciences"){
                suggestions = socialSciencesCoursesArray
                    .filter((course) =>
                        course.courseName.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            }else if(faculty === "Humanities"){
                suggestions = humanitiesCoursesArray
                    .filter((course) =>
                        course.courseName.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            }
        }else{
            suggestions = []
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

    // Handle profile picture preview (optional)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePictureFile(file); // Save the selected file in state
            setPreviewUrl(URL.createObjectURL(file)); // Optionally update preview URL
        }
    };

    const getCourseLinkPrefix = () => {
        switch (institution) {
            case 'KU':
                return 'https://kurser.ku.dk';
            case 'CBS':
                return 'https://kursuskatalog.cbs.dk/';
            case 'DTU':
                return 'https://kurser.dtu.dk';
            default:
                return '';
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
                                <div className="create-profile-dropdown-header mr-5" onClick={handleDropdownClick}>
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
                                    <div className="create-profile-dropdown-header"
                                         onClick={handleFacultyDropdownClick}>
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
                         <a
                             href={
                                 course.courseLink.startsWith('http')
                                     ? course.courseLink
                                     : `${getCourseLinkPrefix()}${course.courseLink}`
                             }
                             className="course-link"
                             target="_blank"
                             rel="noopener noreferrer"
                         >
                    {course.courseName}
                             <FaExternalLinkAlt className="external-link-icon"/>
                  </a>
                  <button
                      type="button"
                      onClick={() => handleRemoveCourse(course.courseName)}
                      className="remove-course-button"
                  >
                    <FaTimes/>
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
