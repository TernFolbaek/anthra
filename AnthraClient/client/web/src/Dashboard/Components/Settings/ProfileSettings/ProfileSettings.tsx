import React, { useState } from 'react';
import './ProfileSettings.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ProfileSettings: React.FC = () => {
    const [email, setEmail] = useState('user@example.com');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [username, setUsername] = useState('UserName');
    const [deleteUsernameInput, setDeleteUsernameInput] = useState('');
    const navigate = useNavigate();

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const saveChanges = () => {
        alert('Profile updated!');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.reload();
    };

    const openDeleteModal = () => {
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeleteUsernameInput('');
    };

    const handleDeleteAccount = async () => {
        if (deleteUsernameInput !== username) {
            alert('Username does not match.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.delete('http://localhost:5001/api/Account/DeleteAccount', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            localStorage.removeItem('token');
            navigate('/login');
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('An error occurred while deleting your account.');
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
                <button className="delete-button" onClick={openDeleteModal}>Delete Account</button>
            </div>

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Confirm Delete Account</h3>
                        <p>Type your username to confirm account deletion:</p>
                        <input
                            type="text"
                            value={deleteUsernameInput}
                            onChange={(e) => setDeleteUsernameInput(e.target.value)}
                            placeholder="Username"
                        />
                        <div className="modal-actions">
                            <button className="confirm-delete-button" onClick={handleDeleteAccount}>
                                Delete
                            </button>
                            <button className="cancel-button" onClick={closeDeleteModal}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileSettings;
