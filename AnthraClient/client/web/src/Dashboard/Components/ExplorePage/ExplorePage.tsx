import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ExplorePage.css';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    location: string;
    institution: string;
    work: string;
    course: string;
    subjects: string[];
    aboutMe: string;
    age: number;
    profilePictureUrl: string;
}

const ExplorePage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        // Fetch users from the backend
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/Explore/GetUsers', {
                    withCredentials: true,
                });
                setUsers(response.data);
                setCurrentIndex(0);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        // Update the current user based on currentIndex
        if (users.length > 0 && currentIndex < users.length) {
            setCurrentUser(users[currentIndex]);
        } else {
            setCurrentUser(null);
        }
    }, [users, currentIndex]);

    const handleConnect = async () => {
        if (currentUser) {
            // Send a connection request to the frontend
            try {
                await axios.post(
                    'http://localhost:5001/api/Connections/SendRequest',
                    { targetUserId: currentUser.id },
                    { withCredentials: true }
                );
            } catch (error) {
                console.error('Error sending connection request:', error);
            }
        }
        // Move to the next user
        setCurrentIndex(currentIndex + 1);
    };

    const handleSkip = () => {

        // Move to the next user
        if(currentUser){
            try {
                 axios.post(
                    'http://localhost:5001/api/Explore/SkipUser',
                    { UserIdToSkip: currentUser.id },
                );
                // Update your UI accordingly
            } catch (error) {
                console.error('Error skipping user:', error);
            }
        };

        setCurrentIndex(currentIndex + 1);
    };

    return (
        <div className="explore-page">
            {currentUser ? (
                <div className="explore-user-card">
                    <img className="explore-user-card-img" src={`http://localhost:5001${currentUser.profilePictureUrl}`} alt="Profile" />
                    <h2>
                        {currentUser.firstName} {currentUser.lastName}, {currentUser.age}
                    </h2>
                    <p>{currentUser.location}</p>
                    <p>{currentUser.institution}</p>
                    <p>{currentUser.work}</p>
                    <p>{currentUser.course}</p>
                    <p>{currentUser.aboutMe}</p>
                    {currentUser.subjects &&
                        (<p>Subjects: {currentUser.subjects.join(', ')}</p>)
                    }
                    <div className="button-container">
                    <button className="connect-button" onClick={handleConnect}>
                            Connect
                        </button>
                        <button className="skip-button" onClick={handleSkip}>
                            Skip
                        </button>
                    </div>
                </div>
            ) : (
                <p>No more users to display.</p>
            )}
        </div>
    );
};

export default ExplorePage;
