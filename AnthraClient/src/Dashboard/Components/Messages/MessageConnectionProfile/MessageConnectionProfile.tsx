import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MessageConnectionProfile.css';
import {
    FaFileAlt,
    FaFilePdf,
    FaFileWord,
    FaFileExcel
} from 'react-icons/fa';

interface Attachment {
    id: number;
    fileName: string;
    fileUrl: string;
}

interface Course {
    courseName: string;
    courseLink: string;
}

interface ProfileData {
    aboutMe: string;
    age: number;
    courses: Course[];
    email: string;
    firstName: string;
    institution: string;
    lastName: string;
    location: string;
    profilePictureUrl: string;
    subjects: string[];
    statuses: string[];
    userName: string;
    work: string;
}

interface Props {
    userId: string;
}

// 2) Helpers to detect file type and get icons
function isImageFileName(fileName: string) {
    return /\.(jpeg|jpg|gif|png|bmp|webp)$/i.test(fileName);
}

function getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return (parts.pop() || '').toLowerCase();
}

function getFileIcon(extension: string) {
    switch (extension) {
        case 'pdf':
            return <FaFilePdf className="file-icon pdf" />;
        case 'doc':
        case 'docx':
            return <FaFileWord className="file-icon word" />;
        case 'xls':
        case 'xlsx':
            return <FaFileExcel className="file-icon excel" />;
        default:
            return <FaFileAlt className="file-icon generic" />;
    }
}

const MessageConnectionProfile: React.FC<Props> = ({ userId }) => {
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [showModal, setShowModal] = useState(false);

    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('userId');

    useEffect(() => {
        fetchProfile();
        fetchAttachments();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            const response = await axios.get(
                `/Profile/GetProfileById?userId=${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setProfileData(response.data);
        } catch (err) {
            setError('Failed to fetch profile data.');
        }
    };

    const fetchAttachments = async () => {
        if (!currentUserId) return;
        try {
            // Example endpoint: adjust to match your backend
            const response = await axios.get(
                `/Messages/GetAttachmentsForUsers?userA=${currentUserId}&userB=${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setAttachments(response.data); // an array of {id, fileName, fileUrl}
        } catch (err) {
            console.error('Failed to fetch attachments.', err);
        }
    };

    if (error) {
        return <div className="profile-error">{error}</div>;
    }

    if (!profileData) {
        return;
    }

    const renderThumbnail = (attachment: Attachment, size = 120) => {
        const extension = getFileExtension(attachment.fileName);
        const isImage = isImageFileName(attachment.fileName);
        return (
            <div key={attachment.id} className="media-thumb">
                {isImage ? (
                    // For images, show a small thumbnail
                    <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img
                            src={attachment.fileUrl}
                            alt={attachment.fileName}
                            style={{ width: size, height: size, objectFit: 'cover' }}
                        />
                    </a>
                ) : (
                    // For docs, show an icon + fileName
                    <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                    >
                        <div className="doc-thumb-icon" style={{ width: size, height: size }}>
                            {getFileIcon(extension)}
                        </div>
                    </a>
                )}
                <div className="thumb-filename">
                    {attachment.fileName.length > 10
                        ? `${attachment.fileName.substring(0, 10)}...`
                        : attachment.fileName}
                </div>
            </div>
        );
    };

    return (
        <div className="message-connection-profile">
            <div className="profile-picture">
                <img
                    className="profile-picture-image"
                    src={`${profileData.profilePictureUrl}`}
                    alt="Profile"
                />
            </div>
            <div className="profile-info">
                <div className="profile-info-header">
                    {profileData.firstName} {profileData.lastName}
                </div>
                <div className="profile-username">@{profileData.userName}</div>
                <div className="profile-info-text">
                    <span className="profile-location-label">Location:</span> {profileData.location}
                </div>
                <div className="profile-info-text">
                    <span className="profile-work-label">Work:</span> {profileData.work}
                </div>
                <div className="profile-info-text">
                    <span className="profile-institution-label">Institution:</span> {profileData.institution}
                </div>
                <div className="profile-info-text">
                    <span className="profile-age-label">Age:</span> {profileData.age}
                </div>
                <div className="profile-section-title">About Me</div>
                <div className="profile-info-text">{profileData.aboutMe}</div>

                <div className="profile-section-title">Subjects</div>
                <ul className="profile-info-list">
                    {profileData.subjects.map((subject, index) => (
                        <li key={index} className="profile-info-list-item">{subject}</li>
                    ))}
                </ul>

                <div className="profile-section-title">Courses</div>
                <ul className="profile-info-list">
                    {profileData.courses.map((course, index) => (
                        <li key={index} className="profile-info-list-item">
                            <a
                                href={course.courseLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="profile-info-link text-emerald-400"
                            >
                                {course.courseName}
                            </a>
                        </li>
                    ))}
                </ul>

                {profileData.statuses && profileData.statuses.length > 0 && (
                    <div className="user-explore-statuses">
                        <p className="profile-section-title">Status</p>
                        <div className="flex gap-2">
                            {profileData.statuses.map((st, i) => (
                                <p
                                    key={i}
                                    className="status-tag-explore text-white text-center bg-emerald-400 mr-1"
                                >
                                    {st}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* 7) MEDIA SECTION */}
                <div className="profile-section-title">Media</div>
                {attachments.length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>No media found</p>
                ) : (
                    <div className="media-section-grid">
                        {/* Show up to 4 attachments in a small grid */}
                        {attachments.slice(0, 4).map((att) => renderThumbnail(att, 120))}
                    </div>
                )}
                {attachments.length > 4 && (
                    <button
                        className="see-more-button"
                        onClick={() => setShowModal(true)}
                    >
                        See More
                    </button>
                )}
            </div>

            {/* 8) MODAL for "See More" attachments */}
            {showModal && (
                <div
                    className="media-modal-backdrop"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="media-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="font-semibold text-lg">All Attachments</p>
                        <div className="all-attachments-grid">
                            {attachments.map((att) => renderThumbnail(att, 80))}
                        </div>
                        <button
                            className="close-modal-button "
                            onClick={() => setShowModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageConnectionProfile;
