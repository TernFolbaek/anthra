import React from 'react';
import './ProfileSettings.css';

const ProfileSettings: React.FC = () => {
    const [email, setEmail] = React.useState('user@example.com');

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const saveChanges = () => {
        // Implement save functionality here
        alert('Profile updated!');
    };

    return (
        <div className="profile-settings">
            <h2>Edit Profile</h2>
            <div className="form-group">
                <label>Email:</label>
                <input type="email" value={email} onChange={handleEmailChange} />
            </div>
            <button onClick={saveChanges}>Save Changes</button>
        </div>
    );
};

export default ProfileSettings;
