import {
    FaArrowRight,
    FaPaperclip,
    FaRegTimesCircle,
    FaFileAlt,
    FaFilePdf,
    FaFileWord,
    FaFileExcel,
    FaSpinner
} from "react-icons/fa";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

interface ConnectionUserId {
    userId: string | undefined;
}

function isImageFile(file: File): boolean {
    return file.type.startsWith("image/");
}

function getFileExtension(fileName: string): string {
    const parts = fileName.split(".");
    return (parts.pop() || "").toLowerCase();
}

function getFileIcon(extension: string) {
    switch (extension) {
        case "pdf":
            return <FaFilePdf className="file-icon pdf" />;
        case "doc":
        case "docx":
            return <FaFileWord className="file-icon word" />;
        case "xls":
        case "xlsx":
            return <FaFileExcel className="file-icon excel" />;
        default:
            return <FaFileAlt className="file-icon generic" />;
    }
}

const MessageInput: React.FC<ConnectionUserId> = ({ userId }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [messageInput, setMessageInput] = useState('');
    const currentUserId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    // Loading state to track if a message is being sent
    const [isSending, setIsSending] = useState(false);

    const sendMessage = async () => {
        if (!userId) return;
        if (messageInput.trim() === "" && !selectedFile) return;

        setIsSending(true); // Start loading

        const formData = new FormData();
        formData.append('SenderId', currentUserId!);
        formData.append('ReceiverId', userId);
        formData.append('Content', messageInput);

        if (selectedFile) {
            formData.append('File', selectedFile);
        }

        try {
            const response = await axios.post(
                '/Messages/SendMessage',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status !== 200) {
                console.error('Error sending message:', response.data);
                alert("Failed to send message. Please try again.");
                return;
            }

            // Reset input fields after successful send
            setMessageInput('');
            if (selectedImagePreview) {
                URL.revokeObjectURL(selectedImagePreview);
            }
            setSelectedFile(null);
            setSelectedImagePreview(null);
        } catch (error) {
            console.error('Error sending message:', error);
            alert("An error occurred while sending the message.");
        } finally {
            setIsSending(false); // Stop loading
        }
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // If focus isn't in the input, focus it
            if (
                inputRef.current &&
                document.activeElement !== inputRef.current &&
                document.activeElement !== document.querySelector('.search-input') &&
                document.activeElement !== document.querySelector('.modal-input') &&
                document.activeElement !== document.querySelector('.report-textarea')
            ) {
                inputRef.current.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [messageInput]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];

            const maxSizeInBytes = 5 * 1024 * 1024;
            if (file.size > maxSizeInBytes) {
                alert("File size must be less than 5MB.");
                event.target.value = "";
                return;
            }

            setSelectedFile(file);

            if (isImageFile(file)) {
                const imageUrl = URL.createObjectURL(file);
                setSelectedImagePreview(imageUrl);
            } else {
                setSelectedImagePreview(null);
            }
        }
    };

    const handleRemoveSelectedFile = () => {
        if (selectedImagePreview) {
            URL.revokeObjectURL(selectedImagePreview);
        }
        setSelectedFile(null);
        setSelectedImagePreview(null);
    };

    // For non-image files, optionally render an icon preview
    const renderFilePreview = (file: File) => {
        const extension = getFileExtension(file.name);
        if (isImageFile(file)) {
            return (
                <div className="image-preview-container">
                    <img
                        src={selectedImagePreview || ""}
                        alt="Selected"
                        className="image-preview-attachment"
                    />
                    <FaRegTimesCircle onClick={handleRemoveSelectedFile} className="remove-file-icon" />
                </div>
            );
        } else {
            return (
                <div className="flex items-center p-2 w-full justify-between bg-gray-100 rounded">
                    <div className="flex items-center">
                        {getFileIcon(extension)}
                        <span className="file-preview-name ml-2">
                            {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                        </span>
                    </div>
                    <FaRegTimesCircle onClick={handleRemoveSelectedFile} className="remove-file-icon" />
                </div>
            );
        }
    };

    return (
        <>
            {selectedFile && (
                <div className="selected-file-preview mb-2">
                    {renderFilePreview(selectedFile)}
                </div>
            )}
            <div className="message-input-container flex items-center p-2">
                <FaPaperclip
                    className={`paperclip-icon cursor-pointer ${isSending ? 'text-gray-400' : 'text-blue-500'}`}
                    onClick={() => {
                        if (!isSending) fileInputRef.current?.click();
                    }}
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={isSending}
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Aa"
                    disabled={isSending || !userId}
                    className={`group-message-input flex-1 mx-2 p-2 border rounded ${
                        isSending ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    }`}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !isSending) {
                            sendMessage();
                        }
                    }}
                />
                <button
                    onClick={sendMessage}
                    className=" flex items-center justify-center p-2 rounded bg-emerald-400 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSending || (!messageInput.trim() && !selectedFile)}
                >
                    {isSending ? (
                        <FaSpinner className="animate-spin" />
                    ) : (
                        <FaArrowRight />
                    )}
                </button>
            </div>
        </>
    );
};

export default MessageInput;
