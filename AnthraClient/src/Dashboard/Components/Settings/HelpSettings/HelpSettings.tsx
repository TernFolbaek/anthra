import React, { useState } from 'react';
import './HelpSettings.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {FaEnvelope, FaSignOutAlt} from "react-icons/fa";

const HelpSettings: React.FC = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // Existing modals / states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [answerInput, setAnswerInput] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [supportMessage, setSupportMessage] = useState('');

    const [allowEmailUpdates, setAllowEmailUpdates] = useState<boolean>(true);
    const [isProfileVisible, setIsProfileVisible] = useState<boolean>(true);

    const [showVisibilityConfirm, setShowVisibilityConfirm] = useState(false);
    const [pendingVisibilityValue, setPendingVisibilityValue] = useState<boolean>(true);

    const generateMathQuestion = () => {
        const newNum1 = Math.floor(Math.random() * 10) + 1;
        const newNum2 = Math.floor(Math.random() * 10) + 1;
        setNum1(newNum1);
        setNum2(newNum2);
        setCorrectAnswer(newNum1 + newNum2);
    };

    const handleEmailUpdatesToggle = async (checked: boolean) => {
        setAllowEmailUpdates(checked);
        try {
            // Convert boolean to string "true"/"false"
            const payload = JSON.stringify(checked.toString());
            await axios.post(
                '/Profile/SetEmailUpdates',
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                }
            );
        } catch (error) {
            console.error('Error toggling email updates:', error);
        }
    };

    const handleVisibilityCheckboxChange = (checked: boolean) => {
        setPendingVisibilityValue(checked);
        setShowVisibilityConfirm(true);
    };

    const confirmProfileVisibilityToggle = async () => {
        setIsProfileVisible(pendingVisibilityValue);
        setShowVisibilityConfirm(false);

        try {
            await axios.post(
                '/Profile/SetProfileVisibility',
                pendingVisibilityValue,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                }
            );
        } catch (error) {
            console.error('Error toggling profile visibility:', error);
        }
    };

    const cancelProfileVisibilityToggle = () => {
        setShowVisibilityConfirm(false);
        setPendingVisibilityValue(isProfileVisible);
    };

    // Logout
    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
        window.location.reload();
    };

    // Support
    const openSupportModal = () => setShowSupportModal(true);
    const closeSupportModal = () => {
        setShowSupportModal(false);
        setSupportMessage('');
    };
    const handleContactSupport = async () => {
        if (!supportMessage.trim()) return;

        try {
            await axios.post(
                '/Support/SendSupportEmail',
                { message: supportMessage },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            closeSupportModal();
        } catch (error) {
            console.error('Error sending support message:', error);
        }
    };

    // Delete account
    const openDeleteModal = () => {
        generateMathQuestion();
        setShowDeleteModal(true);
    };
    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setAnswerInput('');
        setErrorMessage('');
    };
    const handleDeleteAccount = async () => {
        if (parseInt(answerInput, 10) !== correctAnswer) {
            setErrorMessage('Incorrect answer. Please solve the question correctly.');
            return;
        }
        try {
            await axios.delete('/Account/DeleteAccount', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            localStorage.clear();
            navigate('/');
            window.location.reload();
        } catch (error) {
            console.error('Error deleting account:', error);
            setErrorMessage('An error occurred while deleting your account.');
        }
    };

    return (
        <div>
            <div className="profile-settings-actions">
                <div className="flex items-start w-full flex-col gap-4 mb-4">
                    <label className="flex items-center justify-between w-full text-sm">
                        <span className="text-sm font-medium">Allow Email Updates</span>
                        <label className="help-settings-toggle-switch">
                            <input
                                type="checkbox"
                                checked={allowEmailUpdates}
                                onChange={(e) => handleEmailUpdatesToggle(e.target.checked)}
                            />
                            <span className="help-settings-slider"></span>
                        </label>
                    </label>

                    <label className="flex items-center justify-between w-full text-sm">
                        <span className="text-sm font-medium">Profile Visibility</span>
                        <label className="help-settings-toggle-switch">
                            <input
                                type="checkbox"
                                checked={isProfileVisible}
                                onChange={(e) => handleVisibilityCheckboxChange(e.target.checked)}
                            />
                            <span className="help-settings-slider"></span>
                        </label>
                    </label>
                    <label className="flex items-center justify-between w-full text-sm">
                        <span className="text-sm font-medium">Contact Support</span>
                         <button onClick={openSupportModal} className="dark:text-emerald-300 w-[42px] flex justify-center text-emerald-400 rounded-md">
                             <FaEnvelope size={24}/>
                         </button>
                    </label>
                    <label className="flex items-center justify-between w-full text-sm">
                        <span className="text-sm font-medium">Log Out</span>
                         <button onClick={handleLogout} className="dark:text-emerald-300 w-[42px] flex justify-center text-emerald-400 rounded-md">
                             <FaSignOutAlt size={24}/>
                         </button>
                    </label>
                </div>
                <button
                    className={`text-gray-500 dark:text-white hover:underline delete-button 
                                ${answerInput.trim() === '' ? 'delete-button-disabled' : ''}`}
                    onClick={openDeleteModal}
                >
                    Delete Account
                </button>
            </div>

            {showVisibilityConfirm && (
                <div className="connection-note-modal-overlay">
                    <div className="connection-note-modal plop-animation">
                        <h2 className="font-semibold mb-2">Confirm Profile Visibility</h2>
                        <p className="mb-4">
                            Are you sure you want to make your profile
                            {pendingVisibilityValue ? ' visible' : ' hidden'}?
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                className="bg-gray-300 px-4 py-2 rounded"
                                onClick={cancelProfileVisibilityToggle}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-emerald-400 text-white px-4 py-2 rounded"
                                onClick={confirmProfileVisibilityToggle}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSupportModal && (
                <div className="profile-modal-overlay">
                    <div className="modal">
                        <p className="font-semibold text-gray-600 dark:text-gray-200">Contact Support</p>
                        <textarea
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            placeholder="Describe your issue in detail"
                            rows={4}
                            className="w-full dark:bg-stone-800/50 p-2 border rounded resize-none modal-input"
                        />
                        <div className="modal-actions">
                            <button
                                className="text-sm px-2 rounded-md hover:bg-emerald-500 bg-emerald-400 font-medium text-white"
                                onClick={handleContactSupport}
                            >
                                Send Message
                            </button>
                            <button
                                className="text-sm dark:bg-emerald-500  bg-gray-300 font-medium dark:text-white text-black dark:hover:bg-emerald-400 delete-account-cancel-button"
                                onClick={closeSupportModal}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== 3) Delete Account Modal ===== */}
            {showDeleteModal && (
                <div className="profile-modal-overlay">
                    <div className="modal">
                        <h3 className="text-lg font-semibold">Confirm Delete Account</h3>
                        <p>Solve this math equation to confirm account deletion:</p>
                        <p>{num1} + {num2} = ?</p>
                        <input
                            type="number"
                            value={answerInput}
                            onChange={(e) => {
                                setAnswerInput(e.target.value);
                                if (errorMessage) setErrorMessage('');
                            }}
                            placeholder="Your answer"
                            className="modal-input"
                        />
                        {errorMessage && (
                            <p className="error-message">{errorMessage}</p>
                        )}
                        <div className="modal-actions">
                            <button
                                className="delete-account-cancel-button text-white font-medium
                                           bg-emerald-400 hover:bg-emerald-300 dark:bg-emerald-500
                                           dark:hover:bg-emerald-400 transform hover:scale-105 dark:text-white"
                                onClick={closeDeleteModal}
                            >
                                Cancel
                            </button>
                            <button
                                className={`confirm-delete-button font-medium bg-gray-300 
                                            ${answerInput.trim() === '' ? 'delete-button-disabled' : ''}`}
                                onClick={handleDeleteAccount}
                                disabled={answerInput.trim() === ''}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HelpSettings;
