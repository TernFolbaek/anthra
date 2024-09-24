import React, { useState } from 'react';
import axios from 'axios';
import './CreateProfile.css';

interface CreateProfileProps {
    onProfileCreated: () => void;
}

const CreateProfile: React.FC<CreateProfileProps> = ({ onProfileCreated }) => {
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

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

    return (
        <div className="create-profile-page">
            <div className="create-profile-container">
                <h2>Create Your Profile</h2>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>
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
                        type="text"
                        placeholder="Location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
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
                    <textarea
                        placeholder="About Me"
                        value={aboutMe}
                        onChange={(e) => setAboutMe(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Age"
                        value={age === '' ? '' : age}
                        onChange={(e) =>
                            setAge(e.target.value === '' ? '' : parseInt(e.target.value))
                        }
                    />
                    <input
                        type="text"
                        placeholder="Profile Picture URL"
                        value={profilePictureUrl}
                        onChange={(e) => setProfilePictureUrl(e.target.value)}
                    />

                    <button type="submit" className="submit-button">
                        Save Profile
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateProfile;
