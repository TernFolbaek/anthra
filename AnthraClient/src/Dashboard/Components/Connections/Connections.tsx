// Connections.tsx
import React, {useEffect, useState, useRef, useContext} from 'react';
import axios from 'axios';
import './Connections.css';
import { useNavigate } from 'react-router-dom';
import NoConnectionsRive from "../../Helpers/Animations/NoConnections";
import ViewProfile from '../ViewProfile/ViewProfile';
import {FaEllipsisV, FaEnvelope, FaUserMinus} from 'react-icons/fa';
import { FaUser, FaUsers } from "react-icons/fa";
import { ApplicationUser } from "../types/types";
import ViewGroupProfile from "../ViewGroupProfile/ViewGroupProfile";
import Snackbar from "../../Helpers/Snackbar/Snackbar";
import {NotificationContext} from "../../context/NotificationsContext";
import ConfirmationDialog from "../../Helpers/Dialogs/ConfirmationDialog/ConfirmationDialog";
interface ConnectionRequestDTO {
    id: number;
    senderId: string;
    senderName: string;
    senderFirstName: string;
    senderLastName: string;
    senderEmail: string;
    senderProfilePicture?: string;
    senderInstitution: string;
    receiverId: string;
    status: number;
    requestedAt: string;
    respondedAt?: string;
    connectionNote?: string;
}

interface GroupApplicationRequestDTO {
    groupId: number;
    groupName: string;
    applications: {
        requestId: number;
        applicantId: string;
        applicantName: string;
        applicantInstitution: string;
        applicantProfilePictureUrl: string;
        requestedAt: string;
    }[];
}

const Connections: React.FC = () => {
    const [connections, setConnections] = useState<ApplicationUser[]>([]);
    const [connectionRequests, setConnectionRequests] = useState<ConnectionRequestDTO[]>([]);
    const [groupApplicationRequests, setGroupApplicationRequests] = useState<GroupApplicationRequestDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [openMenuConnectionId, setOpenMenuConnectionId] = useState<string | null>(null);
    const [screenWidth, setScreenWidth] = useState<number>(window.innerWidth);
    const [selectedTab, setSelectedTab] = useState<'connections' | 'requests'>('connections');
    const [selectedRequestTab, setSelectedRequestTab] = useState<'personal' | 'groups'>('personal');
    const [groupId, setGroupId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const [isConfirmationDialog, setIsConfirmationDialog] = useState(false);
    const [removeConnectionId, setRemoveConnectionId] = useState<string>('');
    const notificationContext = useContext(NotificationContext);
    const [openNoteRequestId, setOpenNoteRequestId] = useState<number | null>(null);
    const [showNoteModal, setShowNoteModal] = useState<boolean>(false);

    if (!notificationContext) {
        throw new Error("NotificationContext is undefined. Make sure you're inside a NotificationProvider.");
    }
    const { removeNotificationsBySenderId } = notificationContext;

    // Snackbar state
    const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
    const [snackbarTitle, setSnackbarTitle] = useState<string>('');
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');

    const handleUserClick = (userId: string) => {
        setSelectedUserId(userId);
    };

    const handleCloseProfile = () => {
        setSelectedUserId(null);
    };

    // Show the note for a specific request
    const handleShowNote = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        requestId: number
    ) => {
        e.stopPropagation(); // Prevent the parent click (which opens profile)
        setOpenNoteRequestId(requestId);
        setShowNoteModal(true);
    };

    const handleCloseNote = () => {
        setShowNoteModal(false);
        setOpenNoteRequestId(null);
    };


    const handleRemoveConnection = async (connectionId: string) => {
        closeDialog()
        try {
            await axios.post(
                '/Connections/RemoveConnection',
                { connectionId: connectionId, userId: userId },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setConnections(
                connections.filter((user) => user.id !== connectionId)
            );
            setOpenMenuConnectionId(null);
            removeNotificationsBySenderId(connectionId);
            // Update Snackbar state to show success message
            setSnackbarTitle('Connection Removed');
            setSnackbarMessage('You have successfully removed this connection.');
            setSnackbarVisible(true);
        } catch (error) {
            console.error('Error removing connection:', error);
            // Optionally, show an error Snackbar
            setSnackbarTitle('Error');
            setSnackbarMessage('Failed to remove the connection. Please try again.');
            setSnackbarVisible(true);
        }
    };

    const handleAccept = async (request: ConnectionRequestDTO) => {
        try {
            const response = await axios.post(
                `/Request/AcceptRequest`,
                null,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    params: {
                        requestId: request.id,
                    },
                }
            );

            if (response.status === 200) {
                // Remove the request from the connectionRequests state
                setConnectionRequests((prevRequests) =>
                    prevRequests.filter((req) => req.id !== request.id)
                );

                // Create a new connection object
                const newConnection: ApplicationUser = {
                    id: request.senderId,
                    firstName: request.senderFirstName,
                    lastName: request.senderLastName,
                    institution: request.senderInstitution,
                    profilePictureUrl: request.senderProfilePicture || '', // Handle optional profile picture
                    connectedAt: new Date().toISOString(),
                };

                // Add the new connection to the connections state
                setConnections((prevConnections) => [...prevConnections, newConnection]);

                // Optionally, show a success Snackbar
                setSnackbarTitle('Request Accepted');
                setSnackbarMessage(`You are now connected with ${newConnection.firstName} ${newConnection.lastName}.`);
                setSnackbarVisible(true);
            }
        } catch (error) {
            console.error('Error accepting request:', error);
        }
    };


    const handleDecline = async (requestId: number) => {
        try {
            const response = await axios.post(
                `/Request/DeclineRequest`,
                null,
                {
                    params: { requestId },
                }
            );

            if (response.status === 200) {
                setConnectionRequests((prevRequests) =>
                    prevRequests.filter((req) => req.id !== requestId)
                );

                // Optionally, show a decline Snackbar
                setSnackbarTitle('Request Declined');
                setSnackbarMessage('You have declined the connection request.');
                setSnackbarVisible(true);
            }
        } catch (error) {
            console.error('Error declining request:', error);
        }
    };


    const handleGroupApplicationAccept = async (requestId: number) => {
        try {
            const response = await axios.post(
                '/Requests/RespondToGroupApplication',
                { requestId, accept: true },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.status === 200) {
                setGroupApplicationRequests(prevState => {
                    return prevState
                        .map(group => ({
                            ...group,
                            applications: group.applications.filter(app => app.requestId !== requestId),
                        }))
                        .filter(group => group.applications.length > 0);
                });

                // Optionally, show a success Snackbar
                setSnackbarTitle('Group Application Accepted');
                setSnackbarMessage('The user has been added to the group.');
                setSnackbarVisible(true);
            }
        } catch (error) {
            console.error('Error accepting group application:', error);
        }
    };


    const handleGroupApplicationDecline = async (requestId: number) => {
        try {
            const response = await axios.post(
                '/Requests/RespondToGroupApplication',
                { requestId, accept: false },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.status === 200) {
                setGroupApplicationRequests(prevState => {
                    return prevState
                        .map(group => ({
                            ...group,
                            applications: group.applications.filter(app => app.requestId !== requestId),
                        }))
                        .filter(group => group.applications.length > 0);
                });

                setSnackbarTitle('Group Application Declined');
                setSnackbarMessage('The user has been declined from the group application.');
                setSnackbarVisible(true);
            }
        } catch (error) {
            console.error('Error declining group application:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/Connections/List', {
                    params: {
                        userId: userId,
                    },
                    withCredentials: true,
                });

                const connectedUsers: ApplicationUser[] = response.data;
                setConnections(connectedUsers);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to fetch data. Please try again later.');
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, token]);

    useEffect(() => {
        if (!userId) {
            return;
        }

        const fetchPendingRequests = async () => {
            try {
                const response = await axios.get(`/Request/Pending`, {
                    params: { userId }
                });
                setConnectionRequests(response.data);
            } catch (error) {
                console.error('Error fetching pending requests:', error);
            }
        };

        const fetchGroupApplicationRequests = async () => {
            try {
                const response = await axios.get(`/Requests/GetGroupApplicationRequests`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setGroupApplicationRequests(response.data);
            } catch (error) {
                console.error('Error fetching group application requests:', error);
            }
        };

        fetchPendingRequests();
        fetchGroupApplicationRequests();

    }, [userId, token]);

    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                openMenuConnectionId !== null &&
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setOpenMenuConnectionId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuConnectionId]);

    if (loading) {
        return <div className="connections-card-container">
            </div>;
    }

    if (error) {
        return <div className="connections-error">{error}</div>;
    }

    const handleGroupClick = (groupId: number) => {
        setGroupId(groupId);
    }

    const closeGroupProfile = () => {
        setGroupId(null);
    }

    const closeDialog = () => {
        setIsConfirmationDialog(false)
    }

    const openRemoveConfirmationDialog = (userId : string) =>{
        setRemoveConnectionId(userId)
        setIsConfirmationDialog(true)
    }

    const renderConnections = () => (
        <div className="connections-card-container">
            <p className="dark:text-white pl-2 mt-2 pt-1 pb-2 text-xl font-bold">Connections</p>
            {connections.length === 0 ? (
                <NoConnectionsRive />
            ) : (
                <ul className="connections-list">
                    {connections.map((user) => (
                        <li
                            key={user.id}
                            className="connection-item"
                            onClick={() => handleUserClick(user.id)}
                        >
                            <div className="connection-info">
                                <img
                                    src={`${user.profilePictureUrl}`}
                                    alt={user.firstName}
                                    className="connection-profile-picture"
                                />
                                <div className="ml-2 flex flex-col justify-items-start">
                                    <p className="connection-name">{user.firstName} {user.lastName}</p>
                                    <p className="dark:text-gray-200 text-gray-500 text-xs font-light">{user.institution}</p>
                                </div>
                            </div>
                            <button
                                className="message-button text-emerald-400 transform border-emerald-500 hover:scale-105 hover:border-emerald-400 hover:bg-transparent"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/dashboard/messages/${user.id}`);
                                }}
                            >
                                Message
                            </button>
                            <div>
                                <button
                                    className="connections-menu-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuConnectionId(
                                            openMenuConnectionId === user.id ? null : user.id
                                        );
                                    }}
                                >
                                    <FaEllipsisV />
                                </button>
                                {openMenuConnectionId === user.id && (
                                    <div
                                        className="connections-options-menu"
                                        ref={menuRef}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            className="flex items-center gap-2 text-sm font-medium text-black dark:text-white"
                                            onClick={() => openRemoveConfirmationDialog(user.id)}>
                                            <FaUserMinus />
                                            <div>
                                                Remove Connection
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    const renderPersonalRequests = () => (
        <div className="requests-content">
            {connectionRequests.length === 0 ? (
                <h2 className="w-full text-center text-gray-400 text-sm font-medium">
                    No new connection requests
                </h2>
            ) : (
                connectionRequests.map((request) => (
                    <div
                        key={request.id}
                        onClick={() => handleUserClick(request.senderId)}
                        className="requests-user-card"
                    >
                        <div className="requests-user-info">
                            <img
                                className="requests-user-card-img"
                                src={request.senderProfilePicture}
                                alt="Profile"
                            />
                            <div>
                                <div className="ml-2 flex flex-col justify-items-start">
                                    <p className="connection-name">
                                        {request.senderFirstName} {request.senderLastName}
                                    </p>
                                    <p className="text-gray-500 text-xs font-light">
                                        {request.senderInstitution}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="requests-button-container">
                            {/* Only show FaEnvelope if note is present */}
                            {request.connectionNote && request.connectionNote.trim() !== '' && (
                                <button
                                    className="view-note-button mr-2 p-2 dark:text-white text-emerald-400 hover:scale-105"
                                    onClick={(e) => handleShowNote(e, request.id)}
                                    title="View Note"
                                >
                                    <FaEnvelope size={20} />
                                </button>
                            )}

                            <button
                                className="text-sm font-semibold mr-2 text-emerald-400 dark:hover:bg-transparent dark:border-emerald-500 transform dark:hover:border-emerald-400 hover:scale-105"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAccept(request);
                                }}
                            >
                                Accept
                            </button>
                            <button
                                className="requests-skip-button dark:text-gray-300 text-gray-700 hover:scale-105"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDecline(request.id);
                                }}
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                ))
            )}

            {/* MODAL: Show if showNoteModal === true */}
            {showNoteModal && (
                <div className="connection-note-modal-overlay" onClick={handleCloseNote}>
                    <div
                        className="connection-note-modal plop-animation"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                    >
                        <h3 className="font-semibold text-lg mb-2">Connection Note</h3>
                        {/** Find the request with the matching openNoteRequestId */}
                        {(() => {
                            const req = connectionRequests.find(
                                (r) => r.id === openNoteRequestId
                            );
                            return req ? (
                                <p className="whitespace-pre-wrap break-words">
                                    {req.connectionNote}
                                </p>
                            ) : (
                                <p>No note found.</p>
                            );
                        })()}
                        <div className="mt-4 flex justify-end">
                            <button
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-3 py-1 rounded"
                                onClick={handleCloseNote}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderGroupRequests = () => (
        <div className="requests-content">
            {groupApplicationRequests.length === 0 ? (
                <p className="text-gray-400 w-full text-center text-sm font-medium">No group application
                    requests</p>
            ) : (
                groupApplicationRequests.map((group) => (
                    <div key={group.groupId} className="requests-group-section rounded-md dark-background-input bg-sky-50 p-2 mb-2">
                        <h3 className="mb-2 flex items-center text-sm dark:text-white font-semibold">Application to: <p onClick={() => handleGroupClick(group.groupId)} className="p-1 m-2 dark:bg-emerald-200 dark:text-black bg-sky-100 w-fit rounded-md cursor-pointer">{group.groupName}</p></h3>
                        {group.applications.map((application) => (
                            <div key={application.requestId} onClick={() => { handleUserClick(application.applicantId) }} className="requests-user-card dark:hover:bg-black/50 dark-background-border dark-background-input bg-white p-1 rounded-md">
                                <div className="requests-user-info dark:text-white">
                                    <img
                                        className="requests-user-card-img"
                                        src={application.applicantProfilePictureUrl}
                                        alt="Profile"
                                    />
                                    <div className="flex flex-col">
                                        <p className="text-sm font-semibold">{application.applicantName}</p>
                                        <p className="text-gray-500 dark:text-gray-200 text-xs font-light">{application.applicantInstitution}</p>
                                    </div>


                                </div>
                                <div className="requests-button-container">
                                    <button
                                        className="text-sm font-semibold mr-2 dark:border-emerald-500 dark:text-emerald-400 dark:hover:scale-105 transform dark:hover:border-emerald-400"
                                        onClick={(e) => {e.stopPropagation(); handleGroupApplicationAccept(application.requestId)}}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="text-sm font-semibold dark:text-gray-300 text-gray-500 transform hover:scale-105"
                                        onClick={() => handleGroupApplicationDecline(application.requestId)}
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))
            )}
        </div>
    );

    return (
        <div className="connections-page">
            <>
                {screenWidth < 768 && (
                    <div className="connections-toggle-slider" style={{ width: '200px' }}>
                        <div className="slider-background bg-emerald-100 dark:bg-emerald-200">
                            <button
                                onClick={() => setSelectedTab('connections')}
                                className={`z-10 flex justify-center toggle-button ${selectedTab === 'connections' ? 'active' : ''}`}
                            >
                                {screenWidth < 768 ? <FaUser /> : 'Connections'}
                            </button>
                            <button
                                onClick={() => setSelectedTab('requests')}
                                className={`z-10 flex justify-center toggle-button ${selectedTab === 'requests' ? 'active' : ''}`}
                            >
                                {screenWidth < 768 ? <FaUsers /> : 'Requests'}
                            </button>
                        </div>
                        <div className={`connections-slider ${selectedTab === 'connections' ? 'left' : 'right'}`}></div>
                    </div>
                )}

                {screenWidth < 768 ? (
                    selectedTab === 'connections' ? (
                        renderConnections()
                    ) : (
                        <div className="connections-card-container">
                            <p className="dark:text-white pl-2 pt-1 pb-1 text-xl mt-2 font-bold">Requests</p>
                            <div className="slide-toggle dark:text-white bg-emerald-100 dark:bg-emerald-200">
                                <input
                                    type="checkbox"
                                    id="toggle"
                                    checked={selectedRequestTab === 'groups'}
                                    onChange={() =>
                                        setSelectedRequestTab(
                                            selectedRequestTab === 'personal' ? 'groups' : 'personal'
                                        )
                                    }
                                />
                                <label htmlFor="toggle">
                                    <span className="toggle-option personal">Personal</span>
                                    <span className="toggle-option groups">Groups</span>
                                    <span className="toggle-slider bg-emerald-400 dark:bg-emerald-400"></span>
                                </label>
                            </div>
                            {selectedRequestTab === 'personal'
                                ? renderPersonalRequests()
                                : renderGroupRequests()}
                        </div>
                    )
                ) : (
                    <div className="connections-columns">
                        {renderConnections()}
                        <div className="connections-card-container">
                            <p className="dark:text-white pl-2 pt-1 pb-2 text-xl mt-2 font-bold">Requests</p>

                            <div className="slide-toggle dark:text-white bg-emerald-100 dark:bg-emerald-500">
                                <input
                                    type="checkbox"
                                    id="toggle"
                                    checked={selectedRequestTab === 'groups'}
                                    onChange={() =>
                                        setSelectedRequestTab(
                                            selectedRequestTab === 'personal' ? 'groups' : 'personal'
                                        )
                                    }
                                />
                                <label htmlFor="toggle">
                                    <span className="toggle-option  personal">Personal</span>
                                    <span className="toggle-option  groups">Groups</span>
                                    <span className="toggle-slider bg-emerald-300 dark:bg-emerald-400"></span>
                                </label>
                            </div>
                            {selectedRequestTab === 'personal'
                                ? renderPersonalRequests()
                                : renderGroupRequests()}
                        </div>
                    </div>
                )}
            </>
            {selectedUserId && (
                <ViewProfile userId={selectedUserId} onClose={handleCloseProfile} />
            )}

            {groupId && (
                <ViewGroupProfile groupId={groupId} onClose={closeGroupProfile} />
            )}

            {/* Render Snackbar */}
            {snackbarVisible && (
                <Snackbar
                    key={snackbarTitle + snackbarMessage}
                    title={snackbarTitle}
                    message={snackbarMessage}
                    duration={4000}
                    onClose={() => setSnackbarVisible(false)}
                />
            )}
            {isConfirmationDialog && (
                <ConfirmationDialog
                    message="Are you sure you want to remove this user?"
                    onConfirm={() => {
                        void handleRemoveConnection(removeConnectionId);
                    }}
                    onCancel={closeDialog}
                />
            )}
        </div>
    );
};

export default Connections;
