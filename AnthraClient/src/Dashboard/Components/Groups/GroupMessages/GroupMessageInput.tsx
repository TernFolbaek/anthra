import { FaArrowRight, FaPaperclip, FaRegTimesCircle, FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel } from "react-icons/fa";
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
                if (event.key === "Enter") {
                    sendMessage();
                }
            };
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [showModal]);

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

        const formData = new FormData();
        formData.append("SenderId", userId);
        formData.append("Content", newMessage);
        formData.append("GroupId", groupId.toString());

        if (selectedFile) {
            formData.append("File", selectedFile);
        }

        try {
            await axios.post("/GroupMessages/SendGroupMessage", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            setNewMessage("");
            if (selectedImagePreview) {
                URL.revokeObjectURL(selectedImagePreview);
            }
            setSelectedFile(null);
            setSelectedImagePreview(null);
        } catch (error) {
            console.error("Error sending group message:", error);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
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
                <div className="image-preview-container">
                    <img
                        src={selectedImagePreview}
                        alt="Selected"
                        className="image-preview-attachment"
                    />
                    <FaRegTimesCircle onClick={handleRemoveSelectedFile} />
                </div>
            );
        } else {
            // It's a doc
            const ext = getFileExtension(selectedFile.name);
            return (
                <div className="flex items-center justify-around w-full">
                    <div className="flex flex-col items-center">
                        {getFileIcon(ext)}
                        <span className="text-sm">{selectedFile.name}</span>
                    </div>
                    <FaRegTimesCircle onClick={handleRemoveSelectedFile} />
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
            <div className="group-message-input-container">
                <FaPaperclip
                    className="paperclip-icon"
                    onClick={() => fileInputRef.current?.click()}
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                />
                <input
                    type="text"
                    className="group-message-input"
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Aa"
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <FaArrowRight onClick={sendMessage} className="group-message-send-button text-emerald-400" />
            </div>
        </>
    );
};

export default GroupMessageInput;
