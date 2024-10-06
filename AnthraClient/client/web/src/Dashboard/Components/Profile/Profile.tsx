import React, { useState, useEffect, ChangeEvent } from 'react';
import axios from 'axios';
import './Profile.css';

interface UserProfile {
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    location: string;
    institution: string;
    work: string;
    courses: string[];
    subjects: string[];
    aboutMe: string;
    age: number;
    profilePictureUrl: string;
    createdProfile: boolean;
}

const Profile: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [updatedProfile, setUpdatedProfile] = useState<Partial<UserProfile>>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch user profile on component mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5001/api/Profile/GetProfile', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setProfile(response.data);
            } catch (error: any) {
                console.error('Error fetching profile:', error);
                setErrorMessage('Error fetching profile.');
            }
        };

        fetchProfile();
    }, []);

    const handleInputChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setUpdatedProfile({
            ...updatedProfile,
            [name]: value,
        });
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();

            // Append updated fields
            formData.append('FirstName', profile!.firstName);
            formData.append('LastName', profile!.lastName);
            formData.append('Location', updatedProfile.location || profile!.location || '');
            formData.append('Institution', profile!.institution || '');
            formData.append('Work', updatedProfile.work || profile!.work || '');
            formData.append('Courses', JSON.stringify(profile!.courses || []));
            formData.append('Subjects', JSON.stringify(profile!.subjects || []));
            formData.append('AboutMe', updatedProfile.aboutMe || profile!.aboutMe || '');
            formData.append('Age', profile!.age.toString());
            formData.append('CreatedProfile', 'true');

            // **Always append the ProfilePicture field**
            formData.append('ProfilePicture', selectedFile || '');

            await axios.post(
                'http://localhost:5001/api/Profile/UpdateProfile',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            // Update the local state
            setProfile({
                ...profile!,
                location: updatedProfile.location || profile!.location,
                work: updatedProfile.work || profile!.work,
                aboutMe: updatedProfile.aboutMe || profile!.aboutMe,
                profilePictureUrl: selectedFile
                    ? URL.createObjectURL(selectedFile)
                    : profile!.profilePictureUrl,
            });

            // Reset edit mode
            setIsEditing(false);
            setErrorMessage('');
            setSelectedFile(null);
            setUpdatedProfile({});
        } catch (error: any) {
            console.error('Error updating profile:', error);
            setErrorMessage('Error updating profile.');
        }
    };


    if (!profile) {
        return <div>Loading...</div>;
    }

    return (
        <div className="profile-card">
            <div className="profile-header">
                <button onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancel' : 'Edit'}
                </button>
            </div>
            <div className="profile-content">
                <div className="profile-picture">
                    <img
                        src={
                            selectedFile
                                ? URL.createObjectURL(selectedFile)
                                : `http://localhost:5001/${profile.profilePictureUrl}` || '/default-profile.png'
                        }
                        alt="Profile Picture"
                    />
                    {isEditing && (
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                    )}
                </div>
                <div className="profile-info">
                    <div>
                        <label>Name:</label>
                        <span>
              {profile.firstName} {profile.lastName}
            </span>
                    </div>
                    <div>
                        <label>Email:</label>
                        <span>{profile.email}</span>
                    </div>
                    <div>
                        <label>Location:</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="location"
                                value={updatedProfile.location || profile.location || ''}
                                onChange={handleInputChange}
                            />
                        ) : (
                            <span>{profile.location}</span>
                        )}
                    </div>
                    <div>
                        <label>Work:</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="work"
                                value={updatedProfile.work || profile.work || ''}
                                onChange={handleInputChange}
                            />
                        ) : (
                            <span>{profile.work}</span>
                        )}
                    </div>
                    <div>
                        <label>About Me:</label>
                        {isEditing ? (
                            <textarea
                                name="aboutMe"
                                value={updatedProfile.aboutMe || profile.aboutMe || ''}
                                onChange={handleInputChange}
                            />
                        ) : (
                            <span>{profile.aboutMe}</span>
                        )}
                    </div>
                </div>
            </div>
            {isEditing && (
                <button onClick={handleSave} className="save-button">
                    Save Changes
                </button>
            )}
            {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
    );
};

export default Profile;
