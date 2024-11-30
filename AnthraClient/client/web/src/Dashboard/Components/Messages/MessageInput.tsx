import { FaArrowRight, FaPaperclip, FaRegTimesCircle } from "react-icons/fa";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

interface ConnectionUserId {
    userId: string | undefined;
}

const MessageInput: React.FC<ConnectionUserId> = ({ userId }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [messageInput, setMessageInput] = useState('');
    const currentUserId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    const sendMessage = async () => {
        if ((!messageInput.trim() && !selectedFile) || !userId) return;

        const formData = new FormData();
        formData.append('SenderId', currentUserId!);
        formData.append('ReceiverId', userId);
        formData.append('Content', messageInput);

        if (selectedFile) {
            formData.append('File', selectedFile);
        }

        try {
            const response = await axios.post(
                'http://localhost:5001/api/Messages/SendMessage',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (response.status !== 200) {
                console.error('Error sending message:', response.data);
                return;
            }
            setMessageInput('');
            setSelectedFile(null);
            if (selectedImagePreview) {
                URL.revokeObjectURL(selectedImagePreview);
                setSelectedImagePreview(null);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (inputRef.current && document.activeElement !== inputRef.current && document.activeElement !== document.querySelector('.search-input')) {
                inputRef.current.focus();
            }
            if (event.key === 'Enter') {
                sendMessage();
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
            setSelectedFile(file);

            if (file.type.startsWith('image/')) {
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

    return (
        <>
            {selectedFile && (
                <div className="selected-file-preview">
                    {selectedImagePreview ? (
                        <div className="image-preview-container">
                            <img
                                src={selectedImagePreview}
                                alt="Selected"
                                className="image-preview-attachment"
                            />
                            <FaRegTimesCircle onClick={handleRemoveSelectedFile} />
                        </div>
                    ) : (
                        <div className="file-preview-container">
                            <span>{selectedFile.name}</span>
                            <FaRegTimesCircle onClick={handleRemoveSelectedFile} />
                        </div>
                    )}
                </div>
            )}
            <div className="message-input-container">
                <FaPaperclip
                    className="paperclip-icon"
                    onClick={() => fileInputRef.current?.click()}
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Aa"
                    disabled={!userId}
                />
                <FaArrowRight onClick={sendMessage} className="send-icon" />
            </div>
        </>
    );
};

export default MessageInput;
