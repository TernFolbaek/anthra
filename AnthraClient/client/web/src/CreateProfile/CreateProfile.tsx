import React, {useRef, useState} from 'react';
import axios from 'axios';
import './CreateProfile.css';

interface CreateProfileProps {
    onProfileCreated: () => void;
}

const CreateProfile: React.FC<CreateProfileProps> = ({ onProfileCreated }) => {
    // Step management
    const [step, setStep] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [location, setLocation] = useState('');
    const [institution, setInstitution] = useState('');
    const [work, setWork] = useState('');
    const [course, setCourse] = useState('');
    const [subjects, setSubjects] = useState<string[]>([]);
    const [aboutMe, setAboutMe] = useState('');
    const [age, setAge] = useState<number | ''>('');
    const [profilePicture, setProfilePicture] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string|null>(null);

    const handleSubjectsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSubjects(value.split(',').map(s => s.trim()));
    };


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPreviewUrl(URL.createObjectURL(file));
            setProfilePicture(file.name)
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        const formData = new FormData();

        formData.append('FirstName', firstName);
        formData.append('LastName', lastName);
        formData.append('Location', location);
        formData.append('Institution', institution);
        formData.append('Work', work);
        formData.append('Course', course);
        formData.append('AboutMe', aboutMe);
        formData.append('Age', age === '' ? '' : age.toString());

        // Handle Subjects
        subjects.forEach((subject) => formData.append('Subjects', subject));

        // Append the file
        if (fileInputRef.current && fileInputRef.current.files) {
            formData.append('ProfilePicture', fileInputRef.current.files[0]);
        }

        try {
            await axios.post('http://localhost:5001/api/Profile/UpdateProfile', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            onProfileCreated();
        }
        catch (err: any) {
            if (err.response && err.response.data) {
                console.log(err.response);
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
            console.log(firstName, lastName, location, age, profilePicture);
            // Basic validation for step 1 fields
            if (!firstName || !lastName || !age || !location || !profilePicture) {
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
                            type="file"
                            accept="image/*"
                            required
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        {previewUrl && <img src={previewUrl} alt="Preview" className="image-preview" />}
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
                            placeholder="Subjects (separated by commas)"
                            value={subjects.join(', ')}
                            onChange={handleSubjectsChange}
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
