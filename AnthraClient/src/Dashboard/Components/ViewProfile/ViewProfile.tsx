import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './ViewProfile.css';

interface ViewProfileProps {
    userId: string;
    onClose: () => void;
}

interface Course {
    courseName: string;
    courseLink: string;
}

interface UserProfile {
    firstName: string;
    lastName: string;
    age: number;
    location: string;
    institution: string;
    work: string;
    courses: Course[];
    subjects: string[];
    statuses: string[];
    aboutMe: string;
    profilePictureUrl: string;
}

const ViewProfile: React.FC<ViewProfileProps> = ({ userId, onClose }) => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const token = localStorage.getItem('token');

    // State to track connection status
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [requestPending, setRequestPending] = useState<boolean>(false);
    const [hasUserSentRequest, setHasUserSentRequest] = useState<boolean>(false);
    const [hasUserAcceptedRequest, setHasUserAcceptedRequest] = useState<boolean>(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await axios.get(`/Profile/GetProfileById?userId=${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUserProfile(response.data);
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
                setError('Failed to fetch user profile. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        const fetchConnectionStatus = async () => {
            try {
                const response = await axios.get(`/Connections/Status?targetUserId=${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setIsConnected(response.data.isConnected);
                setRequestPending(response.data.requestPending);
                setHasUserSentRequest(response.data.hasUserSentRequest);
                setHasUserAcceptedRequest(response.data.hasUserAcceptedRequest);

            } catch (error) {
                console.error('Failed to fetch connection status:', error);
            }
        };

        fetchUserProfile().then(() => {
            // After user profile is fetched, fetch connection status
            fetchConnectionStatus();
        });
    }, [userId, token]);

    const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            onClose();
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleConnect = async () => {
        try {
            await axios.post(
                '/Connections/SendRequest',
                { targetUserId: userId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setRequestPending(true);
            setHasUserSentRequest(true); // The user has now sent a request
        } catch (error) {
            console.error('Error sending connection request:', error);
        }
    };

    const handleCancelRequest = async () => {
        try {
            await axios.post(
                '/Connections/RevokeRequest',
                { targetUserId: userId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setRequestPending(false);
            setHasUserSentRequest(false);
        } catch (error) {
            console.error('Error revoking connection request:', error);
        }
    };

    if (loading) {
        return null;
    }

    if (error) {
        return null;
    }

    if (!userProfile) {
        return null;
    }

    return (
        <div id="viewprofile" className="viewprofile-overlay">
            <div className="viewprofile-modal" ref={modalRef}>
                <button className="viewprofile-close-button" onClick={onClose}>
                    &times;
                </button>
                <div className="viewprofile-content">
                    <div className="flex">
                        <img
                            src={`${userProfile.profilePictureUrl}`}
                            alt={`${userProfile.firstName} ${userProfile.lastName}`}
                            className="viewprofile-profile-picture"
                        />
                        <div>
                            <h2 className="viewprofile-name sm:text-red">
                                {userProfile.firstName} {userProfile.lastName}{userProfile.age ? ` ${userProfile.age}` : ''}
                            </h2>
                            <p className="text-left viewprofile-location">{userProfile.location}</p>
                        </div>
                    </div>
                    <p className="viewprofile-institution">{userProfile.institution}</p>
                    <p className="viewprofile-work">{userProfile.work}</p>
                    <h3 className="viewprofile-section-title">About Me</h3>
                    <p className="viewprofile-aboutme">{userProfile.aboutMe}</p>
                    <h3 className="viewprofile-section-title">Courses</h3>
                    <ul className="viewprofile-list">
                        {userProfile.courses.map((course, index) => (
                            <li key={index}>
                                <a href={course.courseLink} className="dark:text-emerald-400 text-blue-400 hover:font-semibold" target="_blank"
                                   rel="noopener noreferrer">
                                    {course.courseName}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <h3 className="viewprofile-section-title">Subjects</h3>
                    <ul className="viewprofile-list">
                        {userProfile.subjects.map((subject, index) => (
                            <li key={index}>{subject}</li>
                        ))}
                    </ul>
                    {userProfile.statuses && userProfile.statuses.length > 0 && (
                        <div className="user-explore-statuses mt-[10px]">
                            <h3 className="viewprofile-section-title">Status</h3>
                            <div className="flex">
                                {userProfile.statuses.map((st, i) => (
                                    <p key={i} className="status-tag-explore mr-1">{st}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Connection button logic based on isConnected, requestPending, and hasUserSentRequest */}
                    {!isConnected && (
                        <div className="viewprofile-action-button">
                            {hasUserAcceptedRequest && !isConnected ? (
                                <p className="bg-slate-100 p-1 rounded-md text-sm font-semibold mt-2">You have removed or been removed from this profile</p>
                            ) : hasUserSentRequest && requestPending ? (
                                <button
                                    className="viewprofile-connect-button dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-400"
                                    onClick={handleCancelRequest}
                                >
                                    Cancel Request
                                </button>
                            ) : !requestPending ? (
                                <button
                                    className="viewprofile-connect-button dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-400"
                                    onClick={handleConnect}
                                >
                                Connect
                                </button>
                            ) : (
                                <button
                                    className="viewprofile-connect-button dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-400 "
                                    onClick={handleCancelRequest}
                                >
                                    Cancel Request
                                </button>
                            )}
                        </div>

                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewProfile;
