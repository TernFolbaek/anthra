import React, {useState} from "react";
import axios from "axios";

interface ReportUserProps {
    userId: string | undefined,
    onShowReportFalse: () => void,
}

const ReportUserComponent: React.FC<ReportUserProps> = ({userId, onShowReportFalse}) => {
    const [reportDescription, setReportDescription] = useState('');
    const [reportFiles, setReportFiles] = useState<File[]>([]);
    const token = localStorage.getItem('token');

    const handleCloseReportPopup = () => {
        onShowReportFalse();
        setReportDescription('');
        setReportFiles([]);
    };

    const handleSendReport = async () => {
        if (!reportDescription.trim()) return;
        try {
            const formData = new FormData();
            formData.append('ReportedUserId', userId || '');
            formData.append('Description', reportDescription);

            reportFiles.forEach((file) => {
                formData.append('Screenshots', file);
            });

            await axios.post('/Report/SendReport', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            alert('Your report has been sent successfully. Thank you!');
            setReportDescription('');
            setReportFiles([]);
            onShowReportFalse();
        } catch (error) {
            console.error('Error sending report: ', error);
            alert('Failed to send report. Please try again later.');
        }
    };

    return (
        <div className="report-popup-overlay" onClick={handleCloseReportPopup}>
            <div className="report-popup-content" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col">
                    <h2 className="report-popup-title">Report User</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-200">{reportDescription.length}/50</p>
                </div>
                <textarea
                    className="report-textarea text-gray-600"
                    rows={4}
                    maxLength={50}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Describe the issue..."
                />
                <label className="screenshot-label">
                    Attach Screenshots (optional)
                    <input
                        className="report-file-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files) {
                                setReportFiles(Array.from(e.target.files));
                            }
                        }}
                    />
                </label>

                <div className="report-btn-group">
                    <button
                        className="font-medium text-sm dark:text-white text-black rounded-lg"
                        onClick={handleCloseReportPopup}
                    >
                        Cancel
                    </button>
                    <button
                        className={`bg-emerald-400 text-white font-medium px-3 rounded-lg py-2 ${
                            !reportDescription.trim() ? 'disabled-btn' : ''
                        }`}
                        onClick={handleSendReport}
                        disabled={!reportDescription.trim()}
                    >
                        Send Report
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ReportUserComponent;