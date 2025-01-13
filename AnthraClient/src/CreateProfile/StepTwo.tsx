// StepTwo.tsx
import React, { useEffect, useRef, useState } from 'react';
import { FaTimes, FaExternalLinkAlt, FaPlusCircle } from 'react-icons/fa';
import cbsCourses from './cbs/cbsCourses.json';
import dtuCourses from './dtu/dtuCourses.json';
import lawCourses from './ku/lawCourses.json';
import humanitiesCourses from './ku/humanitiesCourses.json';
import sciencesCourses from './ku/sciencesCourses.json';
import socialSciencesCourses from './ku/socialSciencesCourses.json';
import healthAndMedicalCourses from './ku/healthAndMedicalCourses.json';
import theologyCourses from './ku/theologyCourses.json';
import universitiesData from './universities.json';
import axios from "axios";

interface Course {
    courseName: string;
    courseLink: string;
}

interface University {
    name: string;
    domains: string[];
    web_pages: string[];
    country: string;
    alpha_two_code: string;
    "state-province": string | null;
}

interface StepTwoProps {
    handleNext: () => void;
    handleBack: () => void;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    message: string | null;
    firstName: string;
    lastName: string;
    age: number | '';
    aboutMe: string;
    country: string;
    city: string;
    profilePictureFile: File | null;
    onProfileCreated: () => void;
    token: string | null;
    setMessage: React.Dispatch<React.SetStateAction<string | null>>;
    setStep: React.Dispatch<React.SetStateAction<number>>;
}

const StepTwo: React.FC<StepTwoProps> = ({
                                             handleNext,
                                             handleBack,
                                             error,
                                             setError,
                                             message,
                                             firstName,
                                             lastName,
                                             age,
                                             aboutMe,
                                             country,
                                             city,
                                             profilePictureFile,
                                             onProfileCreated,
                                             token,
                                             setMessage,
                                             setStep,
                                         }) => {
    const [institution, setInstitution] = useState<string>('');
    const [institutionSearch, setInstitutionSearch] = useState<string>('');
    const [filteredUniversities, setFilteredUniversities] = useState<University[]>([]);
    const [isInstitutionDropdownOpen, setIsInstitutionDropdownOpen] = useState<boolean>(false);
    const [selectedInstitutionIndex, setSelectedInstitutionIndex] = useState<number>(-1);
    const [selectedCourseIndex, setSelectedCourseIndex] = useState<number>(-1);
    const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState<boolean>(false);
    const [faculty, setFaculty] = useState<string>('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [courseInput, setCourseInput] = useState('');
    const [courseLinkInput, setCourseLinkInput] = useState('');
    const [courseSuggestions, setCourseSuggestions] = useState<Course[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [subjectInput, setSubjectInput] = useState('');
    const [work, setWork] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

    const faculties: string[] = ['Health & Medical', 'Humanities', 'Sciences', 'Theology', 'Social Sciences', 'Law'];
    const statuses: string[] = [
        "✎ exam preparations",
        "☺ expanding my network",
        "☏ looking for collaboration",
        "❊ general studies",
        "❀ on exchange",
        "☂ seeking mentorship"
    ];

    const courseSuggestionRef = useRef<HTMLDivElement>(null);
    const institutionDropdownRef = useRef<HTMLDivElement>(null);
    const facultyDropdownRef = useRef<HTMLDivElement>(null);
    const courseLinkInputRef = useRef<HTMLInputElement>(null);

    // Convert JSON imports to arrays
    const cbsCoursesArray: Course[] = cbsCourses as Course[];
    const dtuCoursesArray: Course[] = dtuCourses as Course[];
    const lawCoursesArray: Course[] = lawCourses as Course[];
    const humanitiesCoursesArray: Course[] = humanitiesCourses as Course[];
    const sciencesCoursesArray: Course[] = sciencesCourses as Course[];
    const socialSciencesCoursesArray: Course[] = socialSciencesCourses as Course[];
    const theologyCoursesArray: Course[] = theologyCourses as Course[];
    const healthAndMedicalCoursesArray: Course[] = healthAndMedicalCourses as Course[];

    const isCBS = institution === 'Copenhagen Business School' || institution === 'CBS';
    const isKU = institution === 'University of Copenhagen' || institution === 'KU' || institution === 'Københavns Universitet';
    const isDTU = institution === 'Technical University of Denmark' || institution === 'DTU';

    useEffect(() => {
        setFilteredUniversities(universitiesData);
    }, []);

    useEffect(() => {
        if (!institutionSearch.trim()) {
            setFilteredUniversities(universitiesData);
        } else {
            const filtered = universitiesData.filter((uni) =>
                uni.name.toLowerCase().includes(institutionSearch.toLowerCase())
            );
            setFilteredUniversities(filtered.slice(0,5));
        }
        setSelectedInstitutionIndex(-1);
    }, [institutionSearch]);

    const handleInstitutionFocus = () => {
        setIsInstitutionDropdownOpen(true);
    };

    const handleInstitutionSelect = (name: string) => {
        if (name !== institution) {
            setCourses([]);
            setFaculty('');
        }
        setInstitution(name);
        setIsInstitutionDropdownOpen(false);
        setSelectedInstitutionIndex(-1);
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

    const handleSubmit = async () => {
        if (!institution) {
            setError('Please select an institution from the dropdown.');
            return;
        }
        if (courses.length < 2) {
            setError('Please add at least 2 courses.');
            return;
        }
        if (subjects.length === 0) {
            setError('Please add at least one subject.');
            return;
        }
        if (selectedStatuses.length < 2 || selectedStatuses.length > 3) {
            setError('Please select between 2 and 3 statuses.');
            return;
        }
        if (!profilePictureFile) {
            setError('Profile picture is required.');
            return;
        }
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
        selectedStatuses.forEach((status) => formData.append('Statuses', status));
        formData.append('ProfilePicture', profilePictureFile);
        try {
            const response = await axios.post('/Profile/UpdateProfile', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
            });

            const data = response.data;

            localStorage.setItem('fullName', `${firstName} ${lastName}`);
            localStorage.setItem('userProfilePicture', data.profilePictureUrl);
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

    const handleCourseInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCourseInput(value);

        if (value.trim() === '') {
            setCourseSuggestions([]);
            return;
        }
        let suggestions: Course[] = [];

        if (isCBS) {
            suggestions = cbsCoursesArray
                .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 5);
        } else if (isDTU) {
            suggestions = dtuCoursesArray
                .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 5);
        } else if (isKU) {
            if (faculty === 'Health & Medical') {
                suggestions = healthAndMedicalCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5);
            } else if (faculty === 'Law') {
                suggestions = lawCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5);
            } else if (faculty === 'Sciences') {
                suggestions = sciencesCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5);
            } else if (faculty === 'Theology') {
                suggestions = theologyCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5);
            } else if (faculty === 'Social Sciences') {
                suggestions = socialSciencesCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5);
            } else if (faculty === 'Humanities') {
                suggestions = humanitiesCoursesArray
                    .filter((course) => course.courseName.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 5);
            }
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

    useEffect(() => {
        const handleClickOutsideDropdowns = (event: MouseEvent) => {
            if (
                isInstitutionDropdownOpen &&
                institutionDropdownRef.current &&
                !institutionDropdownRef.current.contains(event.target as Node)
            ) {
                setIsInstitutionDropdownOpen(false);
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
    }, [isInstitutionDropdownOpen, isFacultyDropdownOpen]);

    const handleInstitutionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isInstitutionDropdownOpen || filteredUniversities.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedInstitutionIndex((prev) => {
                const newIndex = prev + 1 < filteredUniversities.length ? prev + 1 : prev;
                return newIndex;
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedInstitutionIndex((prev) => {
                const newIndex = prev - 1 >= 0 ? prev - 1 : -1;
                return newIndex;
            });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedInstitutionIndex >= 0 && selectedInstitutionIndex < filteredUniversities.length) {
                const uni = filteredUniversities[selectedInstitutionIndex];
                handleInstitutionSelect(uni.name);
                setInstitutionSearch('');
            }
        }
    };


    const handleInstitutionBlur = () => {
        // If no institution was selected from the dropdown, reset the field
        if (!institution) {
            setInstitutionSearch('');
        }
    };

    const handleRemoveCourse = (courseName: string) => {
        setCourses(courses.filter((c) => c.courseName !== courseName));
        setError(null);
    };

    const handleAddSubject = () => {
        const trimmedInput = subjectInput.trim();
        if (trimmedInput === '') {
            setError('Subject cannot be empty.');
            return;
        }
        if (trimmedInput.length > 10) {
            setError('Subject cannot be longer than 10 characters.');
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

        // Capitalize first letter and lowercase the rest
        const formattedSubject = trimmedInput.charAt(0).toUpperCase() + trimmedInput.slice(1).toLowerCase();

        setSubjects([...subjects, formattedSubject]);
        setSubjectInput('');
        setError(null);
    };

    const handleRemoveSubject = (subjectToRemove: string) => {
        setSubjects(subjects.filter((subject) => subject !== subjectToRemove));
        setError(null);
    };


    // Handle keydown events for course input
    const handleCourseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleAddCourse()
        }
        if (courseSuggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedCourseIndex((prev) => (prev + 1 < courseSuggestions.length ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedCourseIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedCourseIndex >= 0 && selectedCourseIndex < courseSuggestions.length) {
                handleCourseSelect(courseSuggestions[selectedCourseIndex]);
            } else {
                handleAddCourse();
            }
        } else if (e.key === 'Escape') {
            setCourseSuggestions([]);
        }
    };

    const handleStatusSelect = (st: string) => {
        if (selectedStatuses.includes(st)) {
            setSelectedStatuses(selectedStatuses.filter(status => status !== st));
            setError(null);
        } else {
            if (selectedStatuses.length < 3) {
                setSelectedStatuses([...selectedStatuses, st]);
                setError(null);
            } else {
                setError('');
            }
        }
    };

    const onFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit();
    };

    // Handle work input with capitalization and max length
    const handleWorkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.slice(0, 25); // enforce max length 25
        if (val) {
            val = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        }
        setWork(val);
    };

    return (
        <form onSubmit={onFormSubmit}>
            <div className="form-step">

                {/* Institution */}
                <label className="input-label" htmlFor="institutionSearch">
                    Institution:<span className="required-asterisk">*</span>
                </label>
                <div className="relative mb-2" ref={institutionDropdownRef}>
                    <input
                        id="institutionSearch"
                        type="text"
                        placeholder="Search Institution"
                        value={institution ? institution : institutionSearch}
                        autoComplete="off"
                        onChange={(e) => {
                            setInstitution('');
                            setInstitutionSearch(e.target.value);
                            setIsInstitutionDropdownOpen(true);
                        }}
                        onFocus={handleInstitutionFocus}
                        onKeyDown={handleInstitutionKeyDown}
                        onBlur={handleInstitutionBlur}
                        className="w-full border p-2 rounded"
                    />
                    {isInstitutionDropdownOpen && filteredUniversities.length > 0 && (
                        <div className="uni-dropdown-menu absolute z-10 bg-white border shadow-md w-full max-h-60 overflow-auto">
                            {filteredUniversities.map((uni, idx) => (
                                <div
                                    key={idx}
                                    className={`suggestion-item p-2 hover:bg-gray-200 cursor-pointer ${
                                        idx === selectedInstitutionIndex ? 'bg-gray-200' : ''
                                    }`}
                                    onClick={() => {
                                        handleInstitutionSelect(uni.name);
                                        setInstitutionSearch('');
                                    }}
                                >
                                    {uni.name}
                                </div>
                            ))}
                        </div>
                    )}
                    {isInstitutionDropdownOpen && filteredUniversities.length === 0 && (
                        <div className="uni-dropdown-menu absolute z-10 bg-white border shadow-md w-full max-h-60 overflow-auto p-2">
                            No institutions found.
                        </div>
                    )}
                </div>

                {isKU && (
                    <div
                        className="custom-dropdown flex items-center gap-x-2 mb-2"
                        ref={facultyDropdownRef}
                    >
                        <label className="input-label">Faculty</label>
                        <div
                            className="create-profile-dropdown-header text-gray-600 font-semibold border p-2 rounded cursor-pointer"
                            onClick={handleFacultyDropdownClick}
                        >
                            {faculty ? faculty : 'Select Faculty'}
                            <span
                                className={`dropdown-arrow transition-transform duration-300 ${
                                    isFacultyDropdownOpen ? 'rotate-180' : ''
                                }`}
                            >
                                ▼
                            </span>
                        </div>
                        {isFacultyDropdownOpen && (
                            <div className="uni-dropdown-menu absolute z-10 bg-white border shadow-md">
                                {faculties.map((fac) => (
                                    <div
                                        key={fac}
                                        className="uni-dropdown-item p-2 hover:bg-gray-200 cursor-pointer"
                                        onClick={() => handleFacultyOptionClick(fac)}
                                    >
                                        {fac}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Courses */}
                <label htmlFor="courseInput" className="input-label">
                    Courses <span className="text-xs font-medium">(online or in school)</span>
                    <span className="required-asterisk">*</span>{' '}
                    <span className="counter">({courses.length}/4)</span> <span
                    className="font-medium text-xs">min. 2</span>
                </label>
                <div className="course-input-container">
                    <div className="flex items-center gap-1 mb-2">
                        <input
                            id="courseInput"
                            type="text"
                            placeholder="Add Course"
                            value={courseInput}
                            onChange={handleCourseInputChange}
                            className="course-input"
                            onKeyDown={handleCourseKeyDown}
                            autoComplete="off"
                            disabled={courses.length >= 4}
                        />
                        <button
                            type="button"
                            onClick={() => {
                               handleAddCourse()
                            }}
                            className="course-add-button"
                            disabled={courses.length >= 4}
                        >
                            <FaPlusCircle/>
                        </button>
                    </div>

                    {courseSuggestions.length > 0 && (
                        <div className="suggestions-list" ref={courseSuggestionRef}>
                            {courseSuggestions.map((course, index) => (
                                <li
                                    className={`suggestion-item p-2 cursor-pointer ${
                                        index === selectedCourseIndex ? 'bg-gray-300' : 'hover:bg-gray-200'
                                    }`}                                    key={index}
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
                                ref={courseLinkInputRef}
                            />
                        </div>
                    )}
                </div>

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
                                        <FaExternalLinkAlt size={16} className="external-link-icon"/>
                                    </a>
                                ) : (
                                    <span>{course.courseName}</span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveCourse(course.courseName)}
                                    className="remove-course-button"
                                >
                                    <FaTimes size={16}/>
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Subjects */}
                <label htmlFor="subjectInput" className="input-label">
                    Subjects of interest<span className="required-asterisk">*</span>{' '}
                    <span className="counter">({subjects.length}/5)</span> <span className="font-medium text-xs">min. 2</span>
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
                            maxLength={10}
                            disabled={subjects.length >= 5}
                        />
                        <button
                            type="button"
                            onClick={handleAddSubject}
                            className="course-add-button"
                            disabled={subjects.length >= 5}
                        >
                            <FaPlusCircle/>
                        </button>
                    </div>
                </div>

                {subjects.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                        {subjects.map((subject, index) => (
                            <span
                                key={index}
                                className="course-tag flex items-center justify-center"
                            >
                                <p className="mr-1">{subject}</p>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSubject(subject)}
                                    className="remove-course-button"
                                >
                                    <FaTimes size={16}/>
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <label htmlFor="work" className="input-label">
                    Job Title<span className="required-asterisk">*</span>
                </label>
                <input
                    id="work"
                    type="text"
                    placeholder="Student"
                    value={work}
                    onChange={handleWorkChange}
                    maxLength={25}
                />

                {/* Status selection */}
                <label className="mt-2 input-label status-label" htmlFor="status">
                    Current Status (Select 2-3)<span className="required-asterisk">*</span>
                </label>
                <div className="status-tags-container">
                    {statuses.map((st, i) => (
                        <span
                            key={i}
                            className={`status-tag ${selectedStatuses.includes(st) ? 'status-tag-selected' : ''}`}
                            onClick={() => handleStatusSelect(st)}
                        >
                            {st}
                        </span>
                    ))}
                </div>
            </div>

            <div className="create-profile-button-container">
                <button
                    type="button"
                    className="create-profile-back-button"
                    onClick={handleBack}
                >
                    Back
                </button>
                <button
                    type="submit"
                    className="create-profile-next-button"
                >
                    Submit
                </button>
            </div>
        </form>
    );
};

export default StepTwo;
