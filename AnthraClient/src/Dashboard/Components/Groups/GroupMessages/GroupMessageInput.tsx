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

interface GroupMessageProps {
    groupId: number;
    showModal: boolean;
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

const GroupMessageInput: React.FC<GroupMessageProps> = ({ groupId, showModal }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [newMessage, setNewMessage] = useState("");
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    // Loading state to track if a message is being sent
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (!showModal) {
            const handleKeyDown = (event: KeyboardEvent) => {
                const activeElement = document.activeElement as HTMLElement;
                if (
                    activeElement &&
                    (activeElement.tagName === "INPUT" ||
                        activeElement.tagName === "TEXTAREA" ||
                        activeElement.isContentEditable)
                ) {
                    // Don't shift focus if the user is typing in an input/textarea
                    return;
                }

                if (inputRef.current && !inputRef.current.contains(activeElement)) {
                    inputRef.current.focus();
                }
                if (event.key === "Enter" && !isSending) {
                    sendMessage();
                }
            };
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [showModal, isSending]);

    const handleRemoveSelectedFile = () => {
        if (selectedImagePreview) {
            URL.revokeObjectURL(selectedImagePreview);
        }
        setSelectedFile(null);
        setSelectedImagePreview(null);
    };

    const sendMessage = async () => {
        if (!groupId || !userId) {
            console.error("Group ID or user ID is undefined");
            return;
        }

        // If there's no text and no file, do nothing
        if (newMessage.trim() === "" && !selectedFile) return;

        setIsSending(true); // Start loading

        const formData = new FormData();
        formData.append("SenderId", userId);
        formData.append("Content", newMessage);
        formData.append("GroupId", groupId.toString());

        if (selectedFile) {
            formData.append("File", selectedFile);
        }

        try {
            const response = await axios.post("/GroupMessages/SendGroupMessage", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.status !== 200) {
                console.error("Error sending group message:", response.data);
                alert("Failed to send group message. Please try again.");
                return;
            }

            // Reset input fields after successful send
            setNewMessage("");
            if (selectedImagePreview) {
                URL.revokeObjectURL(selectedImagePreview);
            }
            setSelectedFile(null);
            setSelectedImagePreview(null);
        } catch (error) {
            console.error("Error sending group message:", error);
            alert("An error occurred while sending the group message.");
        } finally {
            setIsSending(false); // Stop loading
        }
    };

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
            // If it's an image, create an object URL for preview
            if (isImageFile(file)) {
                const imageUrl = URL.createObjectURL(file);
                setSelectedImagePreview(imageUrl);
            } else {
                setSelectedImagePreview(null);
            }
        }
    };

    // For rendering a file preview (image vs. doc icon)
    const renderFilePreview = () => {
        if (!selectedFile) return null;
        if (selectedImagePreview) {
            // It's an image
            return (
                <div className="image-preview-container relative mb-2">
                    <img
                        src={selectedImagePreview}
                        alt="Selected"
                        className="image-preview-attachment rounded"
                    />
                    <FaRegTimesCircle
                        onClick={handleRemoveSelectedFile}
                        className="absolute top-0 right-0 text-red-500 cursor-pointer"
                        title="Remove file"
                    />
                </div>
            );
        } else {
            // It's a document
            const ext = getFileExtension(selectedFile.name);
            return (
                <div className="flex items-center justify-between p-2 bg-gray-100 rounded mb-2">
                    <div className="flex items-center">
                        {getFileIcon(ext)}
                        <span className="text-sm ml-2">
                            {selectedFile.name.length > 15 ? `${selectedFile.name.substring(0, 15)}...` : selectedFile.name}
                        </span>
                    </div>
                    <FaRegTimesCircle
                        onClick={handleRemoveSelectedFile}
                        className="text-red-500 cursor-pointer"
                        title="Remove file"
                    />
                </div>
            );
        }
    };

    return (
        <>
            {/* Show the preview if file is selected */}
            {selectedFile && (
                <div className="selected-file-preview">
                    {renderFilePreview()}
                </div>
            )}
            <div className="group-message-input-container flex items-center p-2">
                <FaPaperclip
                    className={`paperclip-icon cursor-pointer ${isSending ? 'text-gray-400' : 'text-blue-500'}`}
                    onClick={() => {
                        if (!isSending) fileInputRef.current?.click();
                    }}
                    title="Attach a file"
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                    disabled={isSending}
                />
                <input
                    type="text"
                    className={`group-message-input flex-1 mx-2 p-2 border rounded ${
                        isSending ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    }`}
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Aa"
                    disabled={isSending || !groupId}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !isSending) {
                            sendMessage();
                        }
                    }}
                />
                <button
                    onClick={sendMessage}
                    className="group-message-send-button flex items-center justify-center p-2 rounded bg-emerald-400 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSending || (newMessage.trim() === "" && !selectedFile)}
                    title="Send message"
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

export default GroupMessageInput;