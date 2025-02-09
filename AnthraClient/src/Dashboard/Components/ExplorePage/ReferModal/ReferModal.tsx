// ReferModal.tsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './ReferModal.css';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string;
}

interface ReferModalProps {
    currentUser: User | null;
    onClose: () => void;
}

const ReferModal: React.FC<ReferModalProps> = ({ currentUser, onClose }) => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const modalRef = useRef<HTMLDivElement>(null);

    const [connections, setConnections] = useState<User[]>([]);
    const [filteredConnections, setFilteredConnections] = useState<User[]>([]);
    const [selectedConnections, setSelectedConnections] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [referralCount, setReferralCount] = useState<number>(0);
    const [referredConnections, setReferredConnections] = useState<string[]>([]); // Stores IDs of referred users

    // Load referral count and referred connections from localStorage
    useEffect(() => {
        if (currentUser) {
            const storedCount = localStorage.getItem(`referralCount-${currentUser.id}`);
            setReferralCount(storedCount ? parseInt(storedCount, 10) : 0);

            const storedReferred = localStorage.getItem(`referredConnections-${currentUser.id}`);
            setReferredConnections(storedReferred ? JSON.parse(storedReferred) : []);
        } else {
            setReferralCount(0);
            setReferredConnections([]);
        }
    }, [currentUser]);

    // Fetch connections
    useEffect(() => {
        const fetchConnections = async () => {
            if (!token) return;
            try {
                // Fetch the user's connections
                const res = await axios.get('/Connections/ConnectionsGroupList', {
                    params: { userId },
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${token}` },
                });
                setConnections(res.data);
                setFilteredConnections(res.data);
            } catch (err) {
                console.error('Error fetching connections:', err);
            }
        };

        fetchConnections();
    }, [token, userId]);

    // Load selected connections from localStorage
    useEffect(() => {
        if (currentUser) {
            const storedSelections = localStorage.getItem(`referralsSelected-${currentUser.id}`);
            if (storedSelections) {
                const selectedIds: string[] = JSON.parse(storedSelections);
                const selectedUsers = connections.filter(
                    (user) => selectedIds.includes(user.id) && !referredConnections.includes(user.id)
                );
                setSelectedConnections(selectedUsers);
            } else {
                setSelectedConnections([]);
            }
        } else {
            setSelectedConnections([]);
        }
    }, [currentUser, connections, referredConnections]);

    // Save selected connections to localStorage whenever they change
    useEffect(() => {
        if (currentUser) {
            const selectedIds = selectedConnections.map((user) => user.id);
            localStorage.setItem(`referralsSelected-${currentUser.id}`, JSON.stringify(selectedIds));
        }
    }, [selectedConnections, currentUser]);

    // Close modal on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        const filtered = connections.filter((c) =>
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredConnections(filtered);
    };

    const toggleSelectConnection = (connection: User) => {
        // Prevent selecting already referred connections
        if (referredConnections.includes(connection.id)) {
            return;
        }

        const isSelected = selectedConnections.some((sel) => sel.id === connection.id);
        if (isSelected) {
            setSelectedConnections(
                selectedConnections.filter((sel) => sel.id !== connection.id)
            );
        } else {
            // Check referral limit
            const remainingReferrals = 3 - referralCount - selectedConnections.length;
            if (remainingReferrals > 0) {
                setSelectedConnections([...selectedConnections, connection]);
            } else {
                return;
            }
        }
    };

    const handleSendReferral = async () => {
        if (!currentUser || !token || selectedConnections.length === 0) return;

        try {
            for (const conn of selectedConnections) {
                const formData = new FormData();
                formData.append('SenderId', userId!);
                formData.append('ReceiverId', conn.id);
                formData.append('Content', currentUser.id);
                formData.append('IsReferralCard', 'true');

                await axios.post('/Messages/SendMessage', formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }

            // Update referral count & referred connections
            const newReferralCount = referralCount + selectedConnections.length;
            setReferralCount(newReferralCount);
            localStorage.setItem(`referralCount-${currentUser.id}`, newReferralCount.toString());

            const updatedReferred = [
                ...referredConnections,
                ...selectedConnections.map((user) => user.id),
            ];
            setReferredConnections(updatedReferred);
            localStorage.setItem(
                `referredConnections-${currentUser.id}`,
                JSON.stringify(updatedReferred)
            );

            // Clear selected
            setSelectedConnections([]);
            localStorage.removeItem(`referralsSelected-${currentUser.id}`);

            onClose();
        } catch (err) {
            console.error('Error sending referral messages:', err);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="refer-modal-content" ref={modalRef}>
                <button className="refer-close-button" onClick={onClose}>
                    &times;
                </button>
                <p className="refer-title">
                    Refer {currentUser?.firstName} {currentUser?.lastName}
                </p>

                <input
                    type="text"
                    placeholder="Search your connections"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="refer-search-input dark:bg-gray-100"
                />

                {/* Show selected connections (similar to AddMembersModal) */}
                {selectedConnections.length > 0 && (
                    <div className="refer-selected-users">
                        {selectedConnections.map((user) => (
                            <div key={user.id} className="refer-selected-user">
                                <img
                                    src={user.profilePictureUrl}
                                    alt={user.firstName}
                                    className="refer-selected-avatar"
                                />
                                <span className="refer-selected-name">
                                    {user.firstName} {user.lastName}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Referral Counter */}
                <div className="refer-counter">
                    Referrals Sent: {referralCount}/3
                </div>


                    {filteredConnections.length > 0 ? (
                        <div className="refer-connections-container">
                        <ul className="refer-connections-list">
                            {filteredConnections.map((conn) => {
                                const isReferred = referredConnections.includes(conn.id);
                                const isSelected = selectedConnections.some(
                                    (s) => s.id === conn.id
                                );
                                const isDisabled =
                                    referralCount + selectedConnections.length >= 3 &&
                                    !isSelected;

                                return (
                                    <li
                                        key={conn.id}
                                        onClick={() =>
                                            !isReferred && !isDisabled && toggleSelectConnection(conn)
                                        }
                                        className={`refer-connection-item dark:hover:bg-black/30 dark:bg-black/50 hover:bg-emerald-100 bg-slate-100 
                                            ${isSelected ? 'selected' : ''} 
                                            ${isReferred ? 'referred' : ''} 
                                            ${isDisabled ? 'disabled' : ''}`}
                                    >
                                        <img
                                            src={conn.profilePictureUrl}
                                            alt={`${conn.firstName} ${conn.lastName}`}
                                            className="refer-avatar"
                                        />
                                        <span className=" refer-connection-name">
                                            {conn.firstName} {conn.lastName}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                        </div>
                        ) : (
                        <p className="font-semibold bg-transparent text-center text-base text-gray-500 dark:text-gray-300">
                            No connections to refer to
                        </p>
                    )}

                {/* Modal Buttons */}
                <div className="refer-modal-buttons">
                    <button
                        className="refer-send-button bg-emerald-400 text-white"
                        onClick={handleSendReferral}
                        disabled={selectedConnections.length === 0}
                    >
                        Send
                    </button>
                    <button className="refer-cancel-button" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReferModal;
