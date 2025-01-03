// CreateProfile.tsx
import React, { useState } from 'react';
import './CreateProfile.css';
import StepOne from './StepOne';
import StepTwo from './StepTwo';

interface CreateProfileProps {
    onProfileCreated: () => void;
    onBackClick: () => void;
}

const CreateProfile: React.FC<CreateProfileProps> = ({ onProfileCreated, onBackClick }) => {
    const [step, setStep] = useState(1);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState<number | ''>('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const token = localStorage.getItem('token');

    const handleNext = () => {
        if (step === 1) {
            if (!firstName || !lastName || !age || !country || !city || !profilePictureFile) {
                setError('Please fill in all required fields.');
                return;
            }
            setError(null);
            setStep(2);
        }
    };

    const handleBackToStepOne = () => {
        if (step > 1) {
            setStep(step - 1);
            setError(null);
        }
    };

    const progressPercentage = (step / 2) * 100;

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
                <p className="text-base font-semibold">Create your profile</p>
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
                        <div className="create-profile-button-container">
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
                        city={city}
                        profilePictureFile={profilePictureFile}
                        onProfileCreated={onProfileCreated}
                        token={token}
                        setMessage={setMessage}
                        setStep={setStep}
                    />
                )}
            </div>
        </div>
    );
};

export default CreateProfile;
