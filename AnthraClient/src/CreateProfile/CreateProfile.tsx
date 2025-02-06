// CreateProfile.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import './CreateProfile.css';
import StepOne from './StepOne';
import StepTwo from './StepTwo';
import ProfilePreview from './ProfilePreview'; // Import new preview
import useWindowWidth from "../Dashboard/hooks/useWindowWidth";
import { FaHouseUser } from "react-icons/fa";

interface Course {
    courseName: string;
    courseLink: string;
}

interface CreateProfileProps {
    onProfileCreated: () => void;
    onBackClick: () => void;
}

const CreateProfile: React.FC<CreateProfileProps> = ({ onProfileCreated, onBackClick }) => {
    const [step, setStep] = useState(1);

    // StepOne states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState<number | ''>('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [aboutMe, setAboutMe] = useState('');
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

    // StepTwo states (lift them up from StepTwo!)
    const [institution, setInstitution] = useState('');
    const [faculty, setFaculty] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [work, setWork] = useState('');
    const [allowEmailUpdates, setAllowEmailUpdates] = useState(true);

    // Misc
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const token = localStorage.getItem('token');

    const navigate = useNavigate();
    const location = useLocation();
    const windowWidth = useWindowWidth();
    const isMobile = windowWidth <= 480;
    const isTablet = windowWidth <= 1000;

    // Force routing to step-one if no path is matched
    useEffect(() => {
        if (
            !location.pathname.includes('step-one') &&
            !location.pathname.includes('step-two')
        ) {
            navigate('step-one', { replace: true });
        }
    }, [location, navigate]);

    // Keep track of which step user is on
    useEffect(() => {
        if (location.pathname.includes('step-two')) {
            setStep(2);
        } else {
            setStep(1);
        }
    }, [location.pathname]);

    const handleNext = () => {
        if (step === 1) {
            if(aboutMe.length < 60){
                setError('Minimum 60 characters for about me');
                return;
            }
            // Basic validation for step one
            if (!firstName || !lastName || !age || !country || !city || !profilePictureFile) {
                setError('Please fill in all required fields');
                return;
            }
            setError(null);
            navigate('step-two');
        }
    };

    const handleBackToStepOne = () => {
        if (step > 1) {
            setStep(1);
            setError(null);
            navigate('step-one');
        }
    };

    const progressPercentage = (step / 2) * 100;

    return (
        <div className="create-profile-page gap-5 flex px-2">
            {!isMobile && (
                <button
                    className=" text-gray-200 transform hover:scale-105 rounded-md py-2 px-3 absolute top-5 left-5 border-0 cursor-pointer text-base font-medium"
                    onClick={onBackClick}
                >
                    <FaHouseUser size={24} />
                </button>
            )}

            {/* Left Section: Form Steps */}
            <div className="create-profile-wrapper flex-1 flex flex-col w-full h-full justify-center items-center">
                <div className="progress-bar  mb-4">
                    <div
                        className="progress-bar-fill h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>

                <Routes>
                    <Route
                        path="step-one"
                        element={
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
                                aboutMe={aboutMe}
                                setAboutMe={setAboutMe}
                                profilePictureFile={profilePictureFile}
                                setProfilePictureFile={setProfilePictureFile}
                                onNext={handleNext}
                                error={error}
                            />
                        }
                    />
                    <Route
                        path="step-two"
                        element={
                            <StepTwo
                                handleNext={handleNext}
                                handleBack={handleBackToStepOne}
                                setStep={setStep}
                                error={error}
                                setError={setError}
                                message={message}
                                setMessage={setMessage}
                                firstName={firstName}
                                lastName={lastName}
                                age={age}
                                aboutMe={aboutMe}
                                country={country}
                                city={city}
                                profilePictureFile={profilePictureFile}
                                institution={institution}
                                setInstitution={setInstitution}
                                faculty={faculty}
                                setFaculty={setFaculty}
                                courses={courses}
                                setCourses={setCourses}
                                subjects={subjects}
                                setSubjects={setSubjects}
                                selectedStatuses={selectedStatuses}
                                setSelectedStatuses={setSelectedStatuses}
                                work={work}
                                setWork={setWork}
                                allowEmailUpdates={allowEmailUpdates}
                                setAllowEmailUpdates={setAllowEmailUpdates}
                                onProfileCreated={onProfileCreated}
                                token={token}
                            />
                        }
                    />
                    <Route path="*" element={<Navigate to="step-one" replace />} />
                </Routes>
            </div>

            {/* Right Section: Divider and Profile Preview */}
            {!isTablet && (
                <>
                    {/* Vertical Divider */}

                    <div className="flex-1 flex justify-center">
                        <ProfilePreview
                            firstName={firstName}
                            lastName={lastName}
                            age={age}
                            country={country}
                            city={city}
                            aboutMe={aboutMe}
                            profilePictureFile={profilePictureFile}
                            // StepTwo data
                            institution={institution}
                            faculty={faculty}
                            courses={courses}
                            subjects={subjects}
                            selectedStatuses={selectedStatuses}
                            work={work}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default CreateProfile;
