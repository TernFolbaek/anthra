import React, { useState } from 'react';
import './Contact.css';
import { useLanguage } from '../../../LanguageContext'; // Import useLanguage hook
import translations from '../../../languages/landingPageTranslations.json'; // Import translations

const Contact: React.FC = () => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const { language } = useLanguage(); // Get the current language
    const t = translations[language as keyof typeof translations].contact; // Get the Contact translations

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log('Submitted:', { subject, body });
    };

    return (
        <div className="contact-container">
            <div className="contact-content">
                <h2 className="contact-title">{t.title}</h2> {/* Use translated title */}
                <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-group">
                        <label htmlFor="subject" className="form-label">
                            {t.subjectLabel} {/* Use translated subject label */}
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
                            {t.messageLabel} {/* Use translated message label */}
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
                        {t.submitButton} {/* Use translated button text */}
                    </button>
                </form>
            </div>
            <footer className="contact-footer">
                <p>&copy; {new Date().getFullYear()} {t.footer} {/* Use translated footer text */}</p>
            </footer>
        </div>
    );
};

export default Contact;
