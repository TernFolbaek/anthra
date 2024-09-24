import React, { useState } from 'react';
import './Contact.css';

const Contact: React.FC = () => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log('Submitted:', { subject, body });
    };

    return (
        <div className="contact-container">
            <div className="contact-content">
                <h2 className="contact-title">Contact Us</h2>
                <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-group">
                        <label htmlFor="subject" className="form-label">
                            Subject
                        </label>
                        <input
                            type="text"
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="body" className="form-label">
                            Message
                        </label>
                        <textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="form-textarea"
                            required
                        ></textarea>
                    </div>
                    <button type="submit" className="submit-button">
                        Send Message
                    </button>
                </form>
            </div>
            <footer className="contact-footer">
                <p>&copy; {new Date().getFullYear()} Anthra. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Contact;