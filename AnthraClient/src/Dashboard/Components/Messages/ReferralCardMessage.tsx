// src/components/ReferralCardMessage/ReferralCardMessage.tsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ReferralCardMessage.css';
import ViewProfile from "../ViewProfile/ViewProfile";
import { Message, InvitationActionType, UserProfile } from '../types/types';

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
                    `/Profile/GetProfileById?userId=${msg.content}`,
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
                `/Messages/UpdateMessage`,
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
                `/Messages/UpdateMessage`,
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
        }
    }

    const getActionMessage = () => {
        if (isCurrentUser) {
            switch (message.actionType) {
                case InvitationActionType.Skipped:
                    return `You skipped ${referredUser.firstName}.`;
                case InvitationActionType.Connected:
                    return `You sent a request to ${referredUser.firstName}.`;
                default:
                    return null;
            }
        } else {
            switch (message.actionType) {
                case InvitationActionType.Skipped:
                    return `${referredUser.firstName} was skipped`;
                case InvitationActionType.Connected:
                    return `${referredUser.firstName} was sent a request.`;
                default:
                    return null;
            }
        }
    }

    return (
        <div onClick={() => handleUserSelect(referredUser.id)} className={`cursor-pointer bg-emerald-50 referral-card-container ${isCurrentUser ? 'received' : 'sent'}`}>
            <div className="referral-card-details">

                <div className="referral-user-info">
                    <div className="flex gap-2">
                        <div className="bg-emerald-100 mb-2 p-2 rounded-md flex flex-col items-center">
                            <img
                                src={referredUser.profilePictureUrl}
                                alt={`${referredUser.firstName} ${referredUser.lastName}`}
                                className="referral-user-avatar"
                            />
                            <p className="text-xs font-semibold hover:font-bold hover:cursor-pointer flex"> View
                                Profile</p>
                        </div>
                        <div>
                            <div >
                                {!isCurrentUser ? (
                                    <p className="font-medium text-sm ">
                                        You have referred{' '}
                                        <span
                                            className="p-1 rounded-md bg-emerald-100 font-bold">{referredUser.firstName} {referredUser.lastName}</span>
                                    </p>
                                ) : (
                                    <p className="font-medium text-sm">
                                        You have been referred to{' '}
                                        <span
                                            className="bg-emerald-100 p-1 rounded-md font-bold">{referredUser.firstName} {referredUser.lastName}</span>.
                                    </p>
                                )}
                            </div>
                            <div className="">
                                <p className="bg-emerald-300 w-fit p-1 rounded-md text-left font-semibold dark:text-white referral-user-location">{referredUser.institution}</p>
                                {descriptionPreview && (
                                    <p className="font-medium referral-user-about">{descriptionPreview}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Display Action Message if InvitationStatus is true */}
            {message.invitationStatus && (
                <div className="rounded-md w-full bg-emerald-300 font-semibold text-base text-center p-1">
                    <p className="text-sm text-white">{getActionMessage()}</p>
                </div>
            )}

            {/* Show buttons only if InvitationStatus is not set */}
            {!message.invitationStatus && isCurrentUser && (
                <div className="referral-buttons">
                    <button className="referral-connect-button text-sm bg-emerald-300 text-white hover:bg-emerald-400" onClick={handleConnect}>
                        Connect
                    </button>
                    <button className="referral-skip-button text-sm text-gray-600 w-1/2 border-2 border-gray-300 hover:bg-gray-300 hover:text-white" onClick={handleSkipClick}>
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
                            <button onClick={(e)=>{e.stopPropagation(); confirmSkip()}} className="text-sm font-medium py-2 px-4 rounded-md hover:cursor-pointer bg-gray-400">Yes</button>
                            <button onClick={(e)=>{e.stopPropagation(); cancelSkip()}} className="text-sm font-medium py-2 px-4 rounded-md hover:cursor-pointer bg-emerald-400">No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

};

export default ReferralCardMessage;
