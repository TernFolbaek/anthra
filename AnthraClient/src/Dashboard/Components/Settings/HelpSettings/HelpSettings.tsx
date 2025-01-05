import React, { useState, useEffect, useRef } from 'react';
import './HelpSettings.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const HelpSettings: React.FC = () => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [answerInput, setAnswerInput] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState(0);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [supportMessage, setSupportMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const generateMathQuestion = () => {
        const newNum1 = Math.floor(Math.random() * 10) + 1;
        const newNum2 = Math.floor(Math.random() * 10) + 1;
        setNum1(newNum1);
        setNum2(newNum2);
        setCorrectAnswer(newNum1 + newNum2);
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.reload();
    };

    const openDeleteModal = () => {
        generateMathQuestion();
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setAnswerInput('');
        setErrorMessage('');
    };

    const openSupportModal = () => {
        setShowSupportModal(true);
    };

    const closeSupportModal = () => {
        setShowSupportModal(false);
        setSupportMessage('');
    };

    const handleContactSupport = async () => {
        if (!supportMessage.trim()) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'https://api.anthra.dk/api/Support/SendSupportEmail',
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

    const handleDeleteAccount = async () => {
        if (parseInt(answerInput, 10) !== correctAnswer) {
            setErrorMessage('Incorrect answer. Please solve the question correctly.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.delete('https://api.anthra.dk/api/Account/DeleteAccount', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            localStorage.removeItem('token');
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
                <div className="flex gap-2 w-full">
                    <button
                        className="help-settings-buttons bg-blue-500"
                        onClick={() => setShowSupportModal(true)}
                    >
                        Contact Support
                    </button>
                    <button
                        className="help-settings-buttons bg-blue-500"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
                <button
                    className={`text-gray-500 delete-button ${answerInput.trim() === '' ? 'delete-button-disabled' : ''}`}
                    onClick={openDeleteModal}
                >
                    Delete Account
                </button>
            </div>

            {/* Support Modal */}
            {showSupportModal && (
                <div className="profile-modal-overlay">
                    <div className="modal">
                        <h3>Contact Support</h3>
                        <textarea
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            placeholder="Describe your issue in detail"
                            rows={4}
                            className="w-full p-2 border rounded resize-none modal-input"
                        />
                        <div className="modal-actions">
                            <button
                                className="confirm-delete-button"
                                onClick={handleContactSupport}
                            >
                                Send Message
                            </button>
                            <button
                                className="delete-account-cancel-button"
                                onClick={closeSupportModal}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Account Modal */}
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
                                if (errorMessage) setErrorMessage(''); // Clear error message on input change
                            }}
                            placeholder="Your answer"
                            className="modal-input"
                        />
                        {/* Display error message if exists */}
                        {errorMessage && (
                            <p className="error-message">{errorMessage}</p>
                        )}
                        <div className="modal-actions">
                            <button
                                className="delete-account-cancel-button"
                                onClick={closeDeleteModal}
                            >
                                Cancel
                            </button>
                            <button
                                className={`confirm-delete-button ${answerInput.trim() === '' ? 'delete-button-disabled' : ''}`}
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
