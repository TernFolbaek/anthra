// src/components/ReferralCardMessage/ReferralCardMessage.tsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ReferralCardMessage.css';
import ViewProfile from "../ViewProfile/ViewProfile";
import { Message, InvitationActionType, UserProfile } from '../../Components/types/types';

interface ReferralCardMessageProps {
    msg: Message; // Use the shared Message interface
    isCurrentUser: boolean;
    onConnect: (referredUserId: string) => void;
    onSkip: (referredUserId: string) => void;
    onRenderComplete: () => void; // New prop
}

const ReferralCardMessage: React.FC<ReferralCardMessageProps> = ({ msg, isCurrentUser, onConnect, onSkip, onRenderComplete }) => {
    const [referredUser, setReferredUser] = useState<UserProfile | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [showConfirmSkip, setShowConfirmSkip] = useState<boolean>(false);
    const [message, setMessage] = useState<Message>({
        ...msg,
        actionType: msg.actionType ?? InvitationActionType.None
    }); // Local state for the message
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
                onRenderComplete(); // Notify parent after fetching data
            } catch (error) {
                console.error('Error fetching referred user profile:', error);
            }
        };

        fetchReferredUser();
    }, [msg.content, token, onRenderComplete]);

    // Synchronize local message state with msg prop in case of external updates
    useEffect(() => {
        setMessage({
            ...msg,
            actionType: msg.actionType ?? InvitationActionType.None
        });
    }, [msg]);

    if (!referredUser) {
        return <div className={`referral-card-container ${isCurrentUser ? 'sent' : 'received'}`}>Loading...</div>;
    }

    const descriptionPreview = referredUser.aboutMe && referredUser.aboutMe.length > 50
        ? `${referredUser.aboutMe.substring(0, 85)}...`
        : referredUser.aboutMe;

    const handleUserSelect = (userId: string) => {
        setSelectedUserId(userId);
    }

    const handleCloseProfile = () => {
        setSelectedUserId(null);
    }

    // Function to handle skip confirmation
    const handleSkipClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation(); // Stop event propagation
        setShowConfirmSkip(true); // Show confirmation dialog
    }

    // Function to confirm skipping
    const confirmSkip = async () => {
        setShowConfirmSkip(false); // Hide confirmation dialog
        try {
            // Call the UpdateMessage API to set InvitationStatus and ActionType
            await axios.patch(
                `http://localhost:5001/api/Messages/UpdateMessage`,
                {
                    messageId: message.id,
                    actionType: InvitationActionType.Skipped
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Update local state to reflect the changes
            setMessage(prev => ({
                ...prev,
                invitationStatus: true,
                actionType: InvitationActionType.Skipped
            }));

            // Call the onSkip prop to handle any additional UI updates
            onSkip(msg.content);
        } catch (error) {
            console.error('Error updating message:', error);
            alert('Failed to skip this user. Please try again later.');
        }
    }

    // Function to cancel skipping
    const cancelSkip = () => {
        setShowConfirmSkip(false); // Hide confirmation dialog
    }

    // Function to handle connect action
    const handleConnect = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        try {
            await axios.patch(
                `http://localhost:5001/api/Messages/UpdateMessage`,
                {
                    messageId: message.id,
                    actionType: InvitationActionType.Connected
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Update local state to reflect the changes
            setMessage(prev => ({
                ...prev,
                invitationStatus: true,
                actionType: InvitationActionType.Connected
            }));

            // Call the onConnect prop to handle any additional UI updates
            onConnect(msg.content);
        } catch (error) {
            console.error('Error updating message:', error);
            alert('Failed to connect with this user. Please try again later.');
        }
    }

    // Determine the action message based on the ActionType
    const getActionMessage = () => {
        const otherUser = isCurrentUser ? "You" : "Someone"; // Replace with dynamic current user name if available
        if (isCurrentUser) {
            switch (message.actionType) {
                case InvitationActionType.Skipped:
                    return `You skipped ${referredUser.firstName}.`;
                case InvitationActionType.Connected:
                    return `Connection request sent to ${referredUser.firstName}.`;
                default:
                    return null;
            }
        } else {
            switch (message.actionType) {
                case InvitationActionType.Skipped:
                    return `You were skipped by ${otherUser}.`;
                case InvitationActionType.Connected:
                    return `${otherUser} sent you a connection request.`;
                default:
                    return null;
            }
        }
    }

    return (
        <div onClick={() => handleUserSelect(referredUser.id)} className={`cursor-pointer referral-card-container ${isCurrentUser ? 'received' : 'sent'}`}>
            <div className="referral-card-details">
                <div className="referral-user-info">
                    <div className="referral-user-text">
                        {!isCurrentUser ? (
                            <p className="font-medium text-base ">
                                You have referred{' '}
                                <span className="p-1 rounded-md bg-sky-100 font-bold">{referredUser.firstName} {referredUser.lastName}</span>
                            </p>
                        ) : (
                            <p className="font-medium text-base">
                                You have been referred to{' '}
                                <span className="bg-sky-100 p-1 rounded-md font-bold">{referredUser.firstName} {referredUser.lastName}</span>.
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="flex flex-col items-center">
                            <img
                                src={referredUser.profilePictureUrl}
                                alt={`${referredUser.firstName} ${referredUser.lastName}`}
                                className="referral-user-avatar"
                            />
                            <p className="text-xs font-semibold hover:font-bold hover:cursor-pointer flex"> View Profile</p>
                        </div>
                        <div className="flex flex-col justify-start ">
                            <p className="text-left font-semibold dark:text-white referral-user-location">{referredUser.institution}</p>
                            {descriptionPreview && (
                                <p className="font-medium referral-user-about">{descriptionPreview}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Display Action Message if InvitationStatus is true */}
            {message.invitationStatus && (
                <div className="rounded-md w-full bg-slate-100 font-semibold text-base text-center p-1">
                    <p className="text-sm text-gray-600">{getActionMessage()}</p>
                </div>
            )}

            {/* Show buttons only if InvitationStatus is not set */}
            {!message.invitationStatus && isCurrentUser && (
                <div className="referral-buttons">
                    <button className="referral-connect-button" onClick={handleConnect}>
                        Connect
                    </button>
                    <button className="referral-skip-button" onClick={handleSkipClick}>
                        Skip
                    </button>
                </div>
            )}

            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile} />
            )}

            {/* Confirmation Dialog */}
            {showConfirmSkip && (
                <div className="referral-confirm-dialog-overlay">
                    <div className="referral-confirm-dialog">
                        <p className="text-base font-semibold">Are you sure you want to skip this user?</p>
                        <div className="flex justify-center gap-2">
                            <button onClick={confirmSkip} className="text-sm font-medium py-2 px-4 rounded-md bg-gray-100">Yes</button>
                            <button onClick={cancelSkip} className="text-sm font-medium py-2 px-4 rounded-md bg-sky-100">No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

};

export default ReferralCardMessage;
