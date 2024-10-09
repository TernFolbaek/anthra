// ProfileSettings.tsx
import React from 'react';
import './ProfileSettings.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ProfileSettings: React.FC = () => {
    const [email, setEmail] = React.useState('user@example.com');
    const navigate = useNavigate();

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const saveChanges = () => {
        // Implement save functionality here
        alert('Profile updated!');
    };

    const handleLogout = () => {
        // Clear the token from localStorage
        localStorage.removeItem('token');
        // Redirect to the login page
        window.location.reload();
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
        if (confirmed) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete('http://localhost:5001/api/Account/DeleteAccount', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                // Clear the token and redirect to login
                localStorage.removeItem('token');
                navigate('/login');
            } catch (error) {
                console.error('Error deleting account:', error);
                alert('An error occurred while deleting your account.');
            }
        }
    };

    return (
        <div className="profile-settings">
            <h2>Edit Profile</h2>
            <div className="form-group">
                <label>Email:</label>
                <input type="email" value={email} onChange={handleEmailChange} />
            </div>
            <button className="save-button" onClick={saveChanges}>Save Changes</button>
            <div className="profile-settings-actions">
                <button className="logout-button" onClick={handleLogout}>Logout</button>
                <button className="delete-button" onClick={handleDeleteAccount}>Delete Account</button>
            </div>
        </div>
    );
};

export default ProfileSettings;
