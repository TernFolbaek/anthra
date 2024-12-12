import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ReferralCardMessage.css';
import ViewProfile from "../ViewProfile/ViewProfile";

interface ReferralCardMessageProps {
    msg: any;
    isCurrentUser: boolean;
    onConnect: (referredUserId: string) => void;
    onSkip: (referredUserId: string) => void;
}

interface UserProfile {
    id: string;
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
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
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

    const handleUserSelect = (userId: string) => {
        setSelectedUserId(userId);
    }

    const handleCloseProfile = () => {
        setSelectedUserId(null);
    }



    return (
        <div onClick={()=>handleUserSelect(referredUser.id)} className={`cursor-pointer referral-card-container ${isCurrentUser ? 'sent' : 'received'}`}>
            <div className="referral-card-details">
                <div className="referral-user-info">
                    <div className="flex flex-col items-center">
                        <img
                            src={referredUser.profilePictureUrl}
                            alt={`${referredUser.firstName} ${referredUser.lastName}`}
                            className="referral-user-avatar"
                        />
                        <p className="text-xs font-semibold hover:font-bold hover:cursor-pointer flex" > View Profile</p>
                    </div>

                    <div className="referral-user-text">
                        {isCurrentUser ? (
                            <p className="font-medium text-sm">
                                You have referred{' '}
                                <span className="font-bold">{referredUser.firstName} {referredUser.lastName}</span>
                            </p>
                        ) : (
                            <p className="font-medium text-base">
                                You have been referred to{' '}
                                <span className="font-bold">{referredUser.firstName} {referredUser.lastName}</span>.
                            </p>
                        )}
                        <p className="dark:text-white referral-user-location">{referredUser.institution}</p>
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
            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile}/>
            )}
        </div>
    );
};

export default ReferralCardMessage;
