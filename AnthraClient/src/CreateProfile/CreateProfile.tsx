import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import './CreateProfile.css';
import StepOne from './StepOne';
import StepTwo from './StepTwo';
import useWindowWidth from "../Dashboard/hooks/useWindowWidth";

interface CreateProfileProps {
    onProfileCreated: () => void;
    onBackClick: () => void;
}

const CreateProfile: React.FC<CreateProfileProps> = ({
                                                         onProfileCreated,
                                                         onBackClick
                                                     }) => {
    const [step, setStep] = useState(1);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState<number | ''>('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [aboutMe, setAboutMe] = useState('');
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const location = useLocation();
    const windowWidth = useWindowWidth();

    // Typically, we'd do isMobile = windowWidth <= 480
    const isMobile = windowWidth <= 480;

    useEffect(() => {
        if (
            !location.pathname.includes('step-one') &&
            !location.pathname.includes('step-two')
        ) {
            navigate('step-one', { replace: true });
        }
    }, [location, navigate]);

    useEffect(() => {
        if (location.pathname.includes('step-two')) {
            setStep(2);
        } else {
            setStep(1);
        }
    }, [location.pathname]);

    const handleNext = () => {
        if (step === 1) {
            if (!firstName || !lastName || !age || !country || !city || !profilePictureFile) {
                setError('Please fill in all required fields');
                return;
            }
            setError(null);
            setStep(2);
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
        <div className="create-profile-page">
            {!isMobile && (
                <button
                    className="bg-black/100 text-gray-200 rounded-md py-2 px-3 absolute top-5 left-5 border-0 cursor-pointer text-base font-medium"
                    onClick={onBackClick}
                >
                    Home
                </button>
            )}

            <div className="progress-bar">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>

            <div className="create-profile-container">
                {!isMobile && <h2 className="text-white">Create Your Profile</h2>}

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}

                <Routes>
                    <Route
                        path="step-one"
                        element={
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleNext();
                                }}
                            >
                                <StepOne
                                    firstName={firstName}
                                    setFirstName={setFirstName}
                                    lastName={lastName}
                                    setLastName={setLastName}
                                    age={age}
                                    setAge={setAge}
                                    country={country}
                                    setCountry={setCountry}
                                    aboutMe={aboutMe}
                                    setAboutMe={setAboutMe}
                                    city={city}
                                    setCity={setCity}
                                    profilePictureFile={profilePictureFile}
                                    setProfilePictureFile={setProfilePictureFile}
                                />
                                <div className="create-profile-button-container">
                                    <button
                                        type="submit"
                                        className="create-profile-next-button border-2 border-emerald-400 transform hover:scale-105 text-emerald-400"
                                    >
                                        Next
                                    </button>
                                </div>
                            </form>
                        }
                    />
                    <Route
                        path="step-two"
                        element={
                            <StepTwo
                                handleNext={handleNext}
                                handleBack={handleBackToStepOne}
                                error={error}
                                setError={setError}
                                message={message}
                                firstName={firstName}
                                lastName={lastName}
                                age={age}
                                country={country}
                                aboutMe={aboutMe}
                                city={city}
                                profilePictureFile={profilePictureFile}
                                onProfileCreated={onProfileCreated}
                                token={token}
                                setMessage={setMessage}
                                setStep={setStep}
                            />
                        }
                    />
                    <Route path="*" element={<Navigate to="step-one" replace />} />
                </Routes>
            </div>
        </div>
    );
};

export default CreateProfile;