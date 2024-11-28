import React, { useState, useEffect } from 'react';
import './HelpSettings.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const HelpSettings: React.FC = () => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [answerInput, setAnswerInput] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState(0);
    const navigate = useNavigate();

    const generateMathQuestion = () => {
        const newNum1 = Math.floor(Math.random() * 10) + 1;
        const newNum2 = Math.floor(Math.random() * 10) + 1;
        setNum1(newNum1);
        setNum2(newNum2);
        setCorrectAnswer(newNum1 + newNum2);
    };


    const handleLogout = () => {
        localStorage.clear()
        window.location.reload();
    };

    const openDeleteModal = () => {
        generateMathQuestion();
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setAnswerInput('');
    };

    const handleDeleteAccount = async () => {
        if (parseInt(answerInput, 10) !== correctAnswer) {
            alert('Incorrect answer. Please solve the question correctly.');
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
            <div className="profile-settings-actions">
                <button className="logout-button" onClick={handleLogout}>Logout</button>
                <button className="delete-button text-gray-500" onClick={openDeleteModal}>Delete Account</button>
            </div>

            {showDeleteModal && (
                <div className="profile-modal-overlay">
                    <div className="modal">
                        <h3>Confirm Delete Account</h3>
                        <p>Solve this math question to confirm account deletion:</p>
                        <p>{num1} + {num2} = ?</p>
                        <input
                            type="number"
                            value={answerInput}
                            onChange={(e) => setAnswerInput(e.target.value)}
                            placeholder="Your answer"
                        />
                        <div className="modal-actions">
                            <button className="confirm-delete-button" onClick={handleDeleteAccount}>
                                Delete
                            </button>
                            <button className="delete-account-cancel-button" onClick={closeDeleteModal}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HelpSettings;
