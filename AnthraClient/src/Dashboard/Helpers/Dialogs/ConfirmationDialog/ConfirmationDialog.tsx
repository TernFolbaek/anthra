import React from 'react';
import './ConfirmationDialog.css';

interface ConfirmationDialogProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="confirmation-dialog-overlay">
            <div className="confirmation-dialog dark-background-item-color">
                <p className="text-base font-medium dark:text-white ">{message}</p>
                <div className="confirmation-dialog-buttons justify-center flex gap-2">
                    <button onClick={onConfirm} className="text-white hover:bg-emerald-300 px-4 py-2 rounded-md text-sm font-medium bg-emerald-400">Confirm</button>
                    <button onClick={onCancel} className="text-white hover:bg-gray-500 px-4 py-2 rounded-md text-sm font-medium bg-gray-400">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;
