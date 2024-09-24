import React, { useState } from 'react';
import axios from 'axios';
import './CreateProfile.css';

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
    const [institution, setInstitution] = useState('');
    const [work, setWork] = useState('');
    const [course, setCourse] = useState('');
    const [subjects, setSubjects] = useState('');
    const [aboutMe, setAboutMe] = useState('');
    const [age, setAge] = useState<number | ''>('');
    const [profilePictureUrl, setProfilePictureUrl] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Handle form submission
    const handleSubmit = async () => {
        const payload = {
            firstName,
            lastName,
            location,
            institution,
            work,
            course,
            subjects,
            aboutMe,
            age: age === '' ? null : age,
            profilePictureUrl,
        };

        try {
            await axios.post(
                'http://localhost:5001/api/Profile/UpdateProfile',
                payload,
                { withCredentials: true }
            );

            // Notify App.tsx that the profile has been created
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
            if (!firstName || !lastName || !age || !location || !profilePictureUrl) {
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
                            type="text"
                            placeholder="Profile Picture URL"
                            required
                            value={profilePictureUrl}
                            onChange={(e) => setProfilePictureUrl(e.target.value)}
                        />
                    </div>
                )}

                {step === 2 && (
                    <div className="form-step">
                        <textarea
                            placeholder="About Me"
                            value={aboutMe}
                            onChange={(e) => setAboutMe(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Institution"
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Work"
                            value={work}
                            onChange={(e) => setWork(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Course"
                            value={course}
                            onChange={(e) => setCourse(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Subjects"
                            value={subjects}
                            onChange={(e) => setSubjects(e.target.value)}
                        />
                    </div>
                )}

                <div className="button-container">
                    {step > 1 && (
                        <button type="button" className="back-button-profile" onClick={handleBack}>
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
