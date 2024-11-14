import {FaArrowRight, FaPaperclip, FaRegTimesCircle} from "react-icons/fa";
import React, {useRef, useState} from "react";
import axios from "axios";

interface GroupMessageProps {
    groupId: number;
}

const GroupMessageInput: React.FC<GroupMessageProps> = ({groupId}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [newMessage, setNewMessage] = useState('');
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    /* useEffect(() => {
      // Autofocus input when user starts typing
      const handleKeyDown = (event: KeyboardEvent) => {
          if (inputRef.current && !inputRef.current.contains(document.activeElement)) {
              inputRef.current.focus();
          }
          if (event.key === 'Enter') {
              sendMessage();
          }
          // Scroll to bottom when user starts typing
          scrollToBottom();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
          document.removeEventListener('keydown', handleKeyDown);
      };
  }, []); */

    const handleRemoveSelectedFile = () => {
        if (selectedImagePreview) {
            URL.revokeObjectURL(selectedImagePreview);
        }
        setSelectedFile(null);
        setSelectedImagePreview(null);
    };

    const sendMessage = async () => {
        if (!groupId || !userId) {
            console.error('Group ID or user ID is undefined');
            return;
        }

        if (newMessage.trim() === '' && !selectedFile) return;

        const formData = new FormData();
        formData.append('SenderId', userId);
        formData.append('Content', newMessage);
        formData.append('GroupId', groupId.toString());

        if (selectedFile) {
            formData.append('File', selectedFile);
        }

        try {
            await axios.post('http://localhost:5001/api/GroupMessages/SendGroupMessage', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            setNewMessage('');
            setSelectedFile(null);
            if (selectedImagePreview) {
                URL.revokeObjectURL(selectedImagePreview);
                setSelectedImagePreview(null);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            setSelectedFile(file);

            // Check if the file is an image
            if (file.type.startsWith('image/')) {
                const imageUrl = URL.createObjectURL(file);
                setSelectedImagePreview(imageUrl);
            } else {
                setSelectedImagePreview(null);
            }
        }
    };

    return (
        <>        {selectedFile && (
            <div className="selected-file-preview">
                {selectedImagePreview ? (
                    <div className="image-preview-container">
                        <img
                            src={selectedImagePreview}
                            alt="Selected"
                            className="image-preview-attachment"
                        />
                        <FaRegTimesCircle onClick={handleRemoveSelectedFile}/>
                    </div>
                ) : (
                    <div className="file-preview-container">
                        <span>{selectedFile.name}</span>
                        <FaRegTimesCircle onClick={handleRemoveSelectedFile}/>
                    </div>
                )}
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
                    style={{display: 'none'}}
                    onChange={handleFileChange}
                />
                <input
                    type="text"
                    className="group-message-input"
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Aa"
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <FaArrowRight onClick={sendMessage} className="group-message-send-button"/>
            </div>
        </>

    )
}

export default GroupMessageInput;