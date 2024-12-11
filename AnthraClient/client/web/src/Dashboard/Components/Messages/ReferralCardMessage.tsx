import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ReferralCardMessage.css';

interface ReferralCardMessageProps {
    msg: any;
    isCurrentUser: boolean;
    onConnect: (referredUserId: string) => void;
    onSkip: (referredUserId: string) => void;
}

interface UserProfile {
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    location: string;
    institution: string;
    work: string;
    courses: { courseName: string; courseLink: string }[];
    subjects: string[];
    aboutMe: string;
    age: number;
    profilePictureUrl: string;
    createdProfile: Date;
}

const ReferralCardMessage: React.FC<ReferralCardMessageProps> = ({ msg, isCurrentUser, onConnect, onSkip }) => {
    const [referredUser, setReferredUser] = useState<UserProfile | null>(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchReferredUser = async () => {
            if (!msg.content) return;
            try {
                const response = await axios.get(
                    `http://localhost:5001/api/Profile/GetProfileById?userId=${msg.content}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setReferredUser(response.data);
            } catch (error) {
                console.error('Error fetching referred user profile:', error);
            }
        };

        fetchReferredUser();
    }, [msg.content, token]);

    if (!referredUser) {
        return <div className={`referral-card-container ${isCurrentUser ? 'sent' : 'received'}`}>Loading...</div>;
    }

    const descriptionPreview = referredUser.aboutMe && referredUser.aboutMe.length > 50
        ? `${referredUser.aboutMe.substring(0, 50)}...`
        : referredUser.aboutMe;

    return (
        <div className={`dark:text-white referral-card-container ${isCurrentUser ? 'sent' : 'received'}`}>
            {isCurrentUser ? (
                <p className=" text-sm text-center">
                    You have referred{' '}
                    <span className="font-bold">{referredUser.firstName} {referredUser.lastName}</span>
                </p>
            ) : (
                <p>
                    You have been referred to{' '}
                    <span className="font-bold">{referredUser.firstName} {referredUser.lastName}</span>.
                </p>
            )}
            <div className="referral-card-details">
                <div className="referral-user-info">
                    <img
                        src={referredUser.profilePictureUrl}
                        alt={`${referredUser.firstName} ${referredUser.lastName}`}
                        className="referral-user-avatar"
                    />
                    <div className="referral-user-text">
                        <p className="referral-user-name">
                            {referredUser.firstName} {referredUser.lastName}, {referredUser.age}
                        </p>
                        <p className="dark:text-white referral-user-location">{referredUser.location}</p>
                        {descriptionPreview && (
                            <p className="dark:text-white referral-user-about">{descriptionPreview}</p>
                        )}
                    </div>
                </div>
            </div>
            {!isCurrentUser && (
                <div className="referral-buttons">
                    <button className="referral-connect-button" onClick={() => onConnect(msg.content)}>
                        Connect
                    </button>
                    <button className="referral-skip-button" onClick={() => onSkip(msg.content)}>
                        Skip
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReferralCardMessage;
