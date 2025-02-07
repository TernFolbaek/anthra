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
import axios from 'axios';

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
    'state-province': string | null;
}

interface StepTwoProps {
    // Nav
    handleNext: () => void;
    handleBack: () => void;
    setStep: React.Dispatch<React.SetStateAction<number>>;

    // Error/Message
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    message: string | null;
    setMessage: React.Dispatch<React.SetStateAction<string | null>>;

    // StepOne data
    firstName: string;
    lastName: string;
    age: number | '';
    aboutMe: string;
    country: string;
    city: string;
    profilePictureFile: File | null;

    // StepTwo data (lifted from parent or managed here)
    institution: string;
    setInstitution: React.Dispatch<React.SetStateAction<string>>;
    faculty: string;
    setFaculty: React.Dispatch<React.SetStateAction<string>>;
    courses: Course[];
    setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
    subjects: string[];
    setSubjects: React.Dispatch<React.SetStateAction<string[]>>;
    selectedStatuses: string[];
    setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>;
    work: string;
    setWork: React.Dispatch<React.SetStateAction<string>>;
    allowEmailUpdates: boolean;
    setAllowEmailUpdates: React.Dispatch<React.SetStateAction<boolean>>;
    stageOfLife: string;
    setStageOfLife: React.Dispatch<React.SetStateAction<string>>;
    selfStudySubjects: string[];
    setSelfStudySubjects: React.Dispatch<React.SetStateAction<string[]>>;

    // Misc
    onProfileCreated: () => void;
    token: string | null;
}

const StepTwo: React.FC<StepTwoProps> = ({
                                             handleNext,
                                             handleBack,
                                             setStep,
                                             error,
                                             setError,
                                             message,
                                             setMessage,
                                             firstName,
                                             lastName,
                                             age,
                                             aboutMe,
                                             country,
                                             city,
                                             profilePictureFile,
                                             institution,
                                             setInstitution,
                                             faculty,
                                             setFaculty,
                                             courses,
                                             setCourses,
                                             subjects,
                                             setSubjects,
                                             selectedStatuses,
                                             setSelectedStatuses,
                                             work,
                                             setWork,
                                             allowEmailUpdates,
                                             setAllowEmailUpdates,
                                             onProfileCreated,
                                            stageOfLife,
                                            setStageOfLife,
                                            selfStudySubjects,
                                            setSelfStudySubjects,
                                             token,
                                         }) => {
    // ---------------- STAGE OF LIFE ----------------

    // --------------- Institution Autosuggest ---------------
    const [institutionSearch, setInstitutionSearch] = useState('');
    const [filteredUniversities, setFilteredUniversities] = useState<University[]>([]);
    const [isInstitutionDropdownOpen, setIsInstitutionDropdownOpen] = useState(false);
    const [selectedInstitutionIndex, setSelectedInstitutionIndex] = useState<number>(-1);

    // --------------- Faculty ---------------
    const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState(false);

    // --------------- Courses ---------------
    const [selectedCourseIndex, setSelectedCourseIndex] = useState<number>(-1);
    const [courseInput, setCourseInput] = useState('');
    const [courseLinkInput, setCourseLinkInput] = useState('');
    const [courseSuggestions, setCourseSuggestions] = useState<Course[]>([]);

    // --------------- Self-Study Focus Topics ---------------
    // If you want a separate array instead of reusing courses, do this:
    const [focusTopicInput, setFocusTopicInput] = useState('');

    // --------------- Subjects (existing) ---------------
    const [subjectInput, setSubjectInput] = useState('');

    // --------------- Status tags ---------------
    const statuses: string[] = [
        '✎ exam preparations',
        '☺ expanding my network',
        '☏ looking for collaboration',
        '❊ general studies',
        '❀ on exchange',
        '☂ seeking mentorship',
    ];

    // --------------- JSON => array ---------------
    const cbsCoursesArray: Course[] = cbsCourses as Course[];
    const dtuCoursesArray: Course[] = dtuCourses as Course[];
    const lawCoursesArray: Course[] = lawCourses as Course[];
    const humanitiesCoursesArray: Course[] = humanitiesCourses as Course[];
    const sciencesCoursesArray: Course[] = sciencesCourses as Course[];
    const socialSciencesCoursesArray: Course[] = socialSciencesCourses as Course[];
    const theologyCoursesArray: Course[] = theologyCourses as Course[];
    const healthAndMedicalCoursesArray: Course[] = healthAndMedicalCourses as Course[];

    // --------------- Refs ---------------
    const courseSuggestionRef = useRef<HTMLDivElement>(null);
    const institutionDropdownRef = useRef<HTMLDivElement>(null);
    const facultyDropdownRef = useRef<HTMLDivElement>(null);

    // --------------- Helpers for Institution Logic ---------------
    const isCBS =
        institution === 'Copenhagen Business School' ||
        institution === 'CBS';
    const isKU =
        institution === 'University of Copenhagen' ||
        institution === 'KU' ||
        institution === 'Københavns Universitet';
    const isDTU =
        institution === 'Technical University of Denmark' ||
        institution === 'DTU';

    // --------------- Faculties (used only if isKU = true) ---------------
    const faculties: string[] = [
        'Health & Medical',
        'Humanities',
        'Sciences',
        'Theology',
        'Social Sciences',
        'Law',
    ];

    // On mount, show a few universities
    useEffect(() => {
        setFilteredUniversities(universitiesData.slice(0, 5));
    }, []);

    // Filter unis on search
    useEffect(() => {
        if (!institutionSearch.trim()) {
            setFilteredUniversities(universitiesData.slice(0, 5));
        } else {
            const filtered = universitiesData.filter((uni) =>
                uni.name.toLowerCase().includes(institutionSearch.toLowerCase())
            );
            setFilteredUniversities(filtered.slice(0, 5));
        }
        setSelectedInstitutionIndex(-1);
    }, [institutionSearch]);

    // Close dropdowns if click outside
    useEffect(() => {
        const handleClickOutsideDropdowns = (event: MouseEvent) => {
            if (
                isInstitutionDropdownOpen &&
                institutionDropdownRef.current &&
                !institutionDropdownRef.current.contains(event.target as Node)
            ) {
                setIsInstitutionDropdownOpen(false);
                // If the user typed a custom institution not in the list, keep it
                if (
                    !universitiesData.some(
                        (uni) => uni.name.toLowerCase() === institution.trim().toLowerCase()
                    )
                ) {
                    setInstitution(institutionSearch.trim());
                }
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
    }, [
        isInstitutionDropdownOpen,
        isFacultyDropdownOpen,
        institutionSearch,
        institution,
        setInstitution,
    ]);

    // ---------------- Institution Handlers ----------------
    const handleInstitutionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isInstitutionDropdownOpen || filteredUniversities.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedInstitutionIndex((prev) =>
                prev + 1 < filteredUniversities.length ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedInstitutionIndex((prev) => (prev - 1 >= 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (
                selectedInstitutionIndex >= 0 &&
                selectedInstitutionIndex < filteredUniversities.length
            ) {
                const uni = filteredUniversities[selectedInstitutionIndex];
                handleInstitutionSelect(uni.name);
                setInstitutionSearch('');
            }
        }
    };

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

    // ---------------- Faculty Handlers (KU only) ----------------
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

    // ---------------- Courses Handlers (for Uni Student) ----------------
    const handleCourseInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCourseInput(value);

        if (!value.trim()) {
            setCourseSuggestions([]);
            return;
        }

        let suggestions: Course[] = [];
        if (isCBS) {
            suggestions = cbsCoursesArray.filter((c) =>
                c.courseName.toLowerCase().includes(value.toLowerCase())
            );
        } else if (isDTU) {
            suggestions = dtuCoursesArray.filter((c) =>
                c.courseName.toLowerCase().includes(value.toLowerCase())
            );
        } else if (isKU) {
            // Filter based on the selected faculty
            if (faculty === 'Health & Medical') {
                suggestions = healthAndMedicalCoursesArray;
            } else if (faculty === 'Law') {
                suggestions = lawCoursesArray;
            } else if (faculty === 'Sciences') {
                suggestions = sciencesCoursesArray;
            } else if (faculty === 'Theology') {
                suggestions = theologyCoursesArray;
            } else if (faculty === 'Social Sciences') {
                suggestions = socialSciencesCoursesArray;
            } else if (faculty === 'Humanities') {
                suggestions = humanitiesCoursesArray;
            }
            suggestions = suggestions.filter((c) =>
                c.courseName.toLowerCase().includes(value.toLowerCase())
            );
        }
        setCourseSuggestions(suggestions.slice(0, 5));
    };

    const handleCourseSelect = (course: Course) => {
        if (courses.length >= 4) {
            setError('You can only add up to 4 courses.');
            return;
        }
        // Avoid duplicates
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

    const handleCourseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedCourseIndex >= 0 && selectedCourseIndex < courseSuggestions.length) {
                handleCourseSelect(courseSuggestions[selectedCourseIndex]);
            } else {
                handleAddCourse();
            }
        }
        if (courseSuggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedCourseIndex((prev) =>
                prev + 1 < courseSuggestions.length ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedCourseIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
        } else if (e.key === 'Escape') {
            setCourseSuggestions([]);
        }
    };

    const handleRemoveCourse = (courseName: string) => {
        setCourses(courses.filter((c) => c.courseName !== courseName));
        setError(null);
    };

    // ---------------- Self Studying: Focus Topics Handlers ----------------
    const handleAddFocusTopic = () => {
        const trimmed = focusTopicInput.trim();
        if (!trimmed) {
            setError('Focus topic cannot be empty.');
            return;
        }
        if (trimmed.length < 2) {
            setError('Please enter a focus topic of at least 2 characters.');
            return;
        }
        if (selfStudySubjects.length >= 5) {
            setError('You can only add up to 5 focus topics.');
            return;
        }
        if (selfStudySubjects.includes(trimmed)) {
            setError('This focus topic has already been added.');
            return;
        }
        setSelfStudySubjects([...selfStudySubjects, trimmed]);
        setFocusTopicInput('');
        setError(null);
    };

    const handleRemoveFocusTopic = (topic: string) => {
        setSelfStudySubjects(selfStudySubjects.filter((t) => t !== topic));
    };

    // ---------------- Subjects (Common to all) ----------------
    const handleAddSubject = () => {
        const trimmedInput = subjectInput.trim();
        if (!trimmedInput) {
            setError('Subject cannot be empty.');
            return;
        }
        if (trimmedInput.length < 3) {
            setError('Subject should be at least 3 characters long.');
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
        const formattedSubject =
            trimmedInput.charAt(0).toUpperCase() + trimmedInput.slice(1).toLowerCase();
        setSubjects([...subjects, formattedSubject]);
        setSubjectInput('');
        setError(null);
    };

    const handleRemoveSubject = (subject: string) => {
        setSubjects(subjects.filter((s) => s !== subject));
        setError(null);
    };

    // ---------------- Status selection (Common to all) ----------------
    const handleStatusSelect = (st: string) => {
        if (selectedStatuses.includes(st)) {
            // unselect
            setSelectedStatuses(selectedStatuses.filter((status) => status !== st));
            setError(null);
        } else {
            // select
            if (selectedStatuses.length < 3) {
                setSelectedStatuses([...selectedStatuses, st]);
                setError(null);
            } else {
                setError('You can select up to 3 statuses in total.');
            }
        }
    };

    // ---------------- Work / Job Title => "Area of work" for Fulltime Worker ----------------
    const handleWorkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.slice(0, 25);
        if (val) {
            val = val.charAt(0).toUpperCase() + val.slice(1);
        }
        setWork(val);
    };

    // ---------------- Final Submit ----------------
    const onFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validations differ by stageOfLife
        if (!stageOfLife) {
            setError('Please select your stage of life.');
            return;
        }


        // Validate each stage
        if (stageOfLife === 'Student') {
            if (!institution.trim()) {
                setError('Please enter your institution.');
                return;
            }
            if (courses.length < 2) {
                setError('Please add at least 2 courses.');
                return;
            }
        } else if (stageOfLife === 'Professional') {
            if (!work.trim()) {
                setError('Please enter your area of work.');
                return;
            }
        } else if (stageOfLife === 'SelfStudying') {
            // Validate that we have enough focus topics
            if (selfStudySubjects.length < 2) {
                setError('Please add at least 2 Focus Topics.');
                return;
            }
        }

        if (subjects.length < 2) {
            setError('Please add at least 2 subjects of interest.');
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

        // Gather form data
        const formData = new FormData();
        formData.append('FirstName', firstName);
        formData.append('LastName', lastName);
        formData.append('Location', `${city}, ${country}`);
        formData.append('AboutMe', aboutMe);
        formData.append('Age', age === '' ? '' : age.toString());
        formData.append('ProfilePicture', profilePictureFile);
        formData.append('AllowEmailUpdates', allowEmailUpdates.toString());
        formData.append('StageOfLife', stageOfLife);

        // If Uni. Student, append institution, courses
        if (stageOfLife === 'Student') {
            formData.append('Institution', institution.trim());
            formData.append('Courses', JSON.stringify(courses));
        }

        // If Fulltime Worker, append area of work
        if (stageOfLife === 'Professional') {
            formData.append('Work', work.trim());
        }

        // If Self Studying, append focusTopics
        if (stageOfLife === 'SelfStudying') {
            formData.append('SelfStudyingSubjects', JSON.stringify(selfStudySubjects));
        }

        // Append subjects (common)
        subjects.forEach((subject) => formData.append('Subjects', subject));
        // Append statuses (common)
        selectedStatuses.forEach((status) => formData.append('Statuses', status));

        // Submit to API
        axios
            .post('/Profile/UpdateProfile', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
            })
            .then((response) => {
                const data = response.data;
                localStorage.setItem('fullName', `${firstName} ${lastName}`);
                localStorage.setItem('userProfilePicture', data.profilePictureUrl);
                onProfileCreated();
            })
            .catch((err: any) => {
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
            });
    };

    // --------------------------------- RENDER ---------------------------------
    return (
        <div className="form-step">
            {/* ---------- 1) STAGE OF LIFE BUBBLES  ---------- */}
            <label className="input-label">Stage of life</label>
            <div className="flex flex-wrap gap-2 mb-4 justify-center mt-1">
                {/* A simple approach: three clickable bubbles */}
                <div
                    className={`px-3 py-2 text-sm rounded-full cursor-pointer 
            ${
                        stageOfLife === 'Student'
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-400/20 text-emerald-200'
                    }`}
                    onClick={() => {
                        setStageOfLife('Student');
                        // optionally reset fields:
                        setInstitution('');
                        setFaculty('');
                        setCourses([]);
                        setWork('');
                        setSelfStudySubjects([]);
                    }}
                >
                    Student
                </div>
                <div
                    className={`px-3 py-2 text-sm rounded-full cursor-pointer 
            ${
                        stageOfLife === 'Professional'
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-400/20 text-emerald-200'
                    }`}
                    onClick={() => {
                        setStageOfLife('Professional');
                        // optionally reset fields:
                        setInstitution('');
                        setFaculty('');
                        setCourses([]);
                        setWork('');
                        setSelfStudySubjects([]);
                    }}
                >
                    Professional
                </div>
                <div
                    className={`px-3 py-2 text-sm rounded-full cursor-pointer 
            ${
                        stageOfLife === 'SelfStudying'
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-400/20 text-emerald-200'
                    }`}
                    onClick={() => {
                        setStageOfLife('SelfStudying');
                        // optionally reset fields:
                        setInstitution('');
                        setFaculty('');
                        setCourses([]);
                        setWork('');
                        setSelfStudySubjects([]);
                    }}
                >
                    Self Studying
                </div>
            </div>

            {/* ---------- UNI STUDENT FIELDS  ---------- */}
            {stageOfLife === 'Student' && (
                <>
                    {/* Institution */}
                    <div className="floating-label-group" ref={institutionDropdownRef}>
                        <input
                            id="institution"
                            type="text"
                            placeholder=" "
                            value={institution}
                            onChange={(e) => {
                                setInstitution(e.target.value);
                                setInstitutionSearch(e.target.value);
                                setIsInstitutionDropdownOpen(true);
                            }}
                            onFocus={handleInstitutionFocus}
                            onKeyDown={handleInstitutionKeyDown}
                            className="floating-label-input"
                            autoComplete="off"
                        />
                        <label htmlFor="institution" className="floating-label">
                            Institution
                        </label>
                        {isInstitutionDropdownOpen && filteredUniversities.length > 0 && (
                            <ul className="uni-dropdown-menu">
                                {filteredUniversities.map((uni, idx) => (
                                    <li
                                        key={idx}
                                        className={`suggestion-item ${
                                            idx === selectedInstitutionIndex ? 'active' : ''
                                        }`}
                                        onMouseDown={() => {
                                            handleInstitutionSelect(uni.name);
                                            setInstitutionSearch('');
                                        }}
                                    >
                                        {uni.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* KU Faculty Dropdown – only show for KU */}
                    {isKU && (
                        <div
                            className="floating-label-group w-[200px] mt-1"
                            ref={facultyDropdownRef}
                        >
                            <div
                                className="floating-label-input text-center cursor-pointer"
                                onClick={handleFacultyDropdownClick}
                            >
                                {faculty ? faculty : 'Select Faculty'}
                            </div>
                            <label className="floating-label">Select Faculty</label>
                            {isFacultyDropdownOpen && (
                                <ul className="uni-dropdown-menu">
                                    {faculties.map((fac) => (
                                        <li
                                            key={fac}
                                            className="suggestion-item"
                                            onMouseDown={() => handleFacultyOptionClick(fac)}
                                        >
                                            {fac}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Courses */}
                    <label className="input-label mb-2" htmlFor="courseInput">
                        Courses <span className="counter">({courses.length}/4)</span>{' '}
                        <span className="font-medium text-xs">min. 2</span>
                    </label>
                    <div
                        className="course-input-container"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        ref={courseSuggestionRef}
                    >
                        <div style={{ flex: 1 }} className="floating-label-group w-full">
                            <input
                                id="courseInput"
                                type="text"
                                placeholder=" "
                                value={courseInput}
                                onChange={handleCourseInputChange}
                                onKeyDown={handleCourseKeyDown}
                                className="floating-label-input disabled:bg-gray-700/30 disabled:cursor-not-allowed"
                                autoComplete="off"
                                disabled={!institution.trim() || courses.length >= 4}
                            />
                            {courseSuggestions.length > 0 && (
                                <ul className="uni-dropdown-menu">
                                    {courseSuggestions.map((course, index) => (
                                        <li
                                            className={`suggestion-item p-2 cursor-pointer ${
                                                index === selectedCourseIndex ? 'bg-gray-600/50' : ''
                                            }`}
                                            key={index}
                                            onMouseDown={() => handleCourseSelect(course)}
                                        >
                                            {course.courseName}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleAddCourse}
                            className="course-add-button"
                            disabled={!institution.trim() || courses.length >= 4}
                        >
                            <FaPlusCircle />
                        </button>
                    </div>
                    {courses.length > 0 && (
                        <div className="selected-courses">
                            {courses.map((c, i) => (
                                <span key={i} className="course-tag">
                  {c.courseLink ? (
                      <a
                          href={
                              c.courseLink.startsWith('http')
                                  ? c.courseLink
                                  : `https://${c.courseLink}`
                          }
                          className="course-link text-xs"
                          target="_blank"
                          rel="noopener noreferrer"
                      >
                          {c.courseName}
                          <FaExternalLinkAlt size={16} className="external-link-icon" />
                      </a>
                  ) : (
                      <span>{c.courseName}</span>
                  )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveCourse(c.courseName)}
                                        className="remove-course-button"
                                    >
                    <FaTimes size={16} />
                  </button>
                </span>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ---------- FULLTIME WORKER FIELDS  ---------- */}
            {stageOfLife === 'Professional' && (
                <div className="floating-label-group mt-1">
                    <input
                        id="work"
                        type="text"
                        placeholder=" "
                        value={work}
                        onChange={handleWorkChange}
                        maxLength={25}
                        className="floating-label-input"
                    />
                    <label htmlFor="work" className="floating-label">
                        Job Title
                    </label>
                </div>
            )}

            {/* ---------- SELF STUDYING FIELDS  ---------- */}
            {stageOfLife === 'SelfStudying' && (
                <>
                    <label className="input-label mb-2 flex items-center gap-2" htmlFor="focusTopicInput">
                        Which subjects are you studying
                        <span className="font-medium text-xs">2 - 5</span>
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="floating-label-group w-full">
                            <input
                                id="focusTopicInput"
                                type="text"
                                placeholder=" "
                                value={focusTopicInput}
                                onChange={(e) => setFocusTopicInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddFocusTopic();
                                    }
                                }}
                                className="floating-label-input"
                                disabled={selfStudySubjects.length >= 5}
                                maxLength={35}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleAddFocusTopic}
                            className="course-add-button"
                            disabled={selfStudySubjects.length >= 5}
                        >
                            <FaPlusCircle />
                        </button>
                    </div>
                    {selfStudySubjects.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {selfStudySubjects.map((topic, index) => (
                                <span key={index} className="course-tag flex items-center justify-center">
                  <p className="mr-1 text-xs font-medium">{topic}</p>
                  <button
                      type="button"
                      onClick={() => handleRemoveFocusTopic(topic)}
                      className="remove-course-button"
                  >
                    <FaTimes size={16} />
                  </button>
                </span>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ---------- SUBJECTS (Common for all) ---------- */}
            <label className="input-label mt-4 flex items-center gap-2" htmlFor="subjectInput">
                Areas of interest / Hobbies
                <span className="font-medium text-xs"> 2 - 5</span>
            </label>
            <div className="flex items-center gap-2 mb-2">
                <div className="floating-label-group w-full">
                    <input
                        id="subjectInput"
                        type="text"
                        placeholder=" "
                        value={subjectInput}
                        onChange={(e) => setSubjectInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSubject();
                            }
                        }}
                        className="floating-label-input"
                        disabled={subjects.length >= 5}
                        maxLength={35}
                    />
                    <label htmlFor="subjectInput" className="floating-label" />
                </div>
                <button
                    type="button"
                    onClick={handleAddSubject}
                    className="course-add-button"
                    disabled={subjects.length >= 5}
                >
                    <FaPlusCircle />
                </button>
            </div>
            {subjects.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-2">
                    {subjects.map((subject, index) => (
                        <span key={index} className="course-tag flex items-center justify-center">
              <p className="mr-1 text-xs font-medium">{subject}</p>
              <button
                  type="button"
                  onClick={() => handleRemoveSubject(subject)}
                  className="remove-course-button"
              >
                <FaTimes size={16} />
              </button>
            </span>
                    ))}
                </div>
            )}

            {/* ---------- STATUS (Common for all) ---------- */}
            <label className="input-label status-label flex items-center gap-2 mt-4" htmlFor="status">
                Status <span className="font-medium text-xs">2 - 3</span>
            </label>
            <div className="status-tags-container">
                {statuses.map((st, i) => (
                    <span
                        key={i}
                        className={`status-tag text-emerald-400 ${
                            selectedStatuses.includes(st)
                                ? 'status-tag-selected bg-emerald-700'
                                : 'bg-emerald-400/20'
                        }`}
                        onClick={() => handleStatusSelect(st)}
                    >
            {st}
          </span>
                ))}
            </div>

            {/* ---------- Allow Email Updates (Common) ---------- */}
            <div className="allow-emails-step-two flex items-center my-4">
                <input
                    id="allowEmails"
                    type="checkbox"
                    checked={allowEmailUpdates}
                    onChange={(e) => setAllowEmailUpdates(e.target.checked)}
                    className="mr-2 cursor-pointer"
                />
                <p className="font-medium bg-black/30 p-2 rounded-md text-sm cursor-pointer text-center text-gray-200">
                    Allow email updates about new features and new user sign-ups?
                </p>
            </div>

            {/* ---------- Nav Buttons ---------- */}
            <div className="create-profile-button-container">
                <button
                    type="button"
                    className="create-profile-back-button bg-emerald-400/20 w-[80px] transform hover:scale-105 text-emerald-400"
                    onClick={handleBack}
                >
                    Back
                </button>
                <button
                    type="submit"
                    onClick={(e) => onFormSubmit(e)}
                    className="create-profile-next-button bg-emerald-400/20 w-[80px] transform hover:scale-105 text-emerald-400"
                >
                    Create
                </button>
            </div>

            {error && <p className="text-sm text-white text-center mt-1">{error}</p>}
        </div>
    );
};

export default StepTwo;
