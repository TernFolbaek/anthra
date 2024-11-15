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
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
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
    const [faculty, setFaculty] = useState<string>("");
    const institutions: string[] = ["CBS", "DTU", "KU"];
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

    // New states for country and city autocomplete
    const [countries, setCountries] = useState<string[]>([]);
    const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
    const countryInputRef = useRef<HTMLInputElement>(null);
    const cityInputRef = useRef<HTMLInputElement>(null);

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

    // Fetch countries on component mount
    useEffect(() => {
        axios.get('https://countriesnow.space/api/v0.1/countries/iso', {
            withCredentials: false, // Ensure credentials are not sent
        })
            .then(response => {
                const countryList = response.data.data.map((country: any) => country.name);
                setCountries(countryList);
            })
            .catch(error => {
                console.error('Error fetching countries:', error);
            });
    }, []);

    useEffect(() => {
        // Add event listener to detect clicks outside
        const handleClickOutside = (event: MouseEvent) => {
            if (
                countryInputRef.current && !countryInputRef.current.contains(event.target as Node) &&
                cityInputRef.current && !cityInputRef.current.contains(event.target as Node)
            ) {
                setCountrySuggestions([]);
                setCitySuggestions([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    // Handle country input change
    const handleCountryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCountry(value);

        if (value.trim() === '') {
            setCountrySuggestions([]);
            return;
        }

        const suggestions = countries.filter(countryName =>
            countryName.toLowerCase().startsWith(value.toLowerCase())
        ).slice(0, 5); // Limit to 5 suggestions

        setCountrySuggestions(suggestions);

    };


    const handleCountrySelect = (countryName: string) => {
        setCountry(countryName);
        setCountrySuggestions([]);

        // Fetch cities for the selected country
        axios.post('https://countriesnow.space/api/v0.1/countries/cities', {
            country: countryName
        }, {
            withCredentials: false, // Ensure credentials are not sent
        })
            .then(response => {
                const cityList = response.data.data;
                setCities(cityList);
            })
            .catch(error => {
                console.error('Error fetching cities:', error);
            });

    };

    // Handle city input change
    const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCity(value);

        if (value.trim() === '') {
            setCitySuggestions([]);
            return;
        }

        const suggestions = cities.filter(cityName =>
            cityName.toLowerCase().startsWith(value.toLowerCase())
        ).slice(0, 5); // Limit to 5 suggestions

        setCitySuggestions(suggestions);

        // Add this line
    };


    const handleCitySelect = (cityName: string) => {
        setCity(cityName);
        setCitySuggestions([]);
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
                    'Authorization': `Bearer ${token}`,
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
            if (
                !firstName ||
                !lastName ||
                !age ||
                !country ||
                !city ||
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
        } else if (institution === 'DTU') {
            suggestions = dtuCoursesArray
                .filter((course) =>
                    course.courseName.toLowerCase().includes(value.toLowerCase())
                )
                .slice(0, 5); // Get top 5 suggestions
            setCourseSuggestions(suggestions);
        } else if (institution === 'KU') {
            if (faculty === 'Health & Medical') {
                suggestions = healthAndMedicalCoursesArray
                    .filter((course) =>
                        course.courseName.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            } else if (faculty === "Law") {
                suggestions = lawCoursesArray
                    .filter((course) =>
                        course.courseName.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            } else if (faculty === "Sciences") {
                suggestions = sciencesCoursesArray
                    .filter((course) =>
                        course.courseName.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            } else if (faculty === "Theology") {
                suggestions = theologyCoursesArray
                    .filter((course) =>
                        course.courseName.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            } else if (faculty === "Social Sciences") {
                suggestions = socialSciencesCoursesArray
                    .filter((course) =>
                        course.courseName.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            } else if (faculty === "Humanities") {
                suggestions = humanitiesCoursesArray
                    .filter((course) =>
                        course.courseName.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 5); // Get top 5 suggestions
                setCourseSuggestions(suggestions);
            }
        } else {
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

                        {/* Country Input */}
                        <div className="autocomplete-container">
                            <input
                                type="text"
                                placeholder="Country"
                                required
                                value={country}
                                onChange={handleCountryInputChange}
                            />
                            {countrySuggestions.length > 0 && (
                                <ul className="suggestions-list">
                                    {countrySuggestions.map((countryName, index) => (
                                        <li
                                            className="suggestion-item"
                                            key={index}
                                            onClick={() => handleCountrySelect(countryName)}
                                        >
                                            {countryName}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* City Input */}
                        <div className="autocomplete-container" ref={cityInputRef}>
                            <input
                                type="text"
                                placeholder="City"
                                required
                                value={city}
                                onChange={handleCityInputChange}
                            />
                            {citySuggestions.length > 0 && (
                                <ul className="suggestions-list">
                                    {citySuggestions.map((cityName, index) => (
                                        <li
                                            className="suggestion-item"
                                            key={index}
                                            onClick={() => handleCitySelect(cityName)}
                                        >
                                            {cityName}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

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
                                    <div className="create-profile-dropdown-header"
                                         onClick={handleFacultyDropdownClick}>
                                        {faculty ? faculty : "Select Faculty"}
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
                                                    : `${course.courseLink}`
                                            }
                                            className="course-link"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {course.courseName}
                                            <FaExternalLinkAlt className="external-link-icon" />
                                        </a>
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
