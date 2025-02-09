import React, { useState } from 'react';
import axios from 'axios';
import './Contact.css';
import { useLanguage } from '../../../LanguageContext';
import translations from '../../../languages/landingPageTranslations.json';
import { useNavigate } from 'react-router-dom';

const Contact: React.FC = () => {
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations].contact;

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        setSubmitMessage('');

        try {
            // Construct the support message including email
            const message = `From: ${email}\n\nSubject: ${subject}\n\nMessage: ${body}`;

            // Use a non-authenticated endpoint
            await axios.post('/Support/SendSupportEmailGuest',
                {
                    email,
                    subject,
                    message
                }
            );

            // Clear form and show success message
            setEmail('');
            setSubject('');
            setBody('');
            setSubmitMessage(t.submitSuccess || 'Message sent successfully!');
        } catch (error) {
            console.error('Error sending support message:', error);
            setSubmitMessage(t.submitError || 'Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Function to navigate to the Privacy Policy page
    const handlePrivacyPolicyClick = () => {
        navigate('/privacy-policy'); // Navigate to the Privacy Policy page
    };

    return (
        <div className="contact-container">
            <div className="contact-content">
                <h2 className="contact-title">{t.title}</h2>
                <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-group">
                        <label htmlFor="email" className="form-label-contact">
                            {t.emailLabel || 'Your Email'}
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="subject" className="form-label-contact">
                            {t.subjectLabel}
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
                        <label htmlFor="body" className="form-label-contact">
                            {t.messageLabel}
                        </label>
                        <textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="form-textarea"
                            required
                        ></textarea>
                    </div>
                    {submitMessage && (
                        <div className={`submit-message ${submitMessage.includes('Successfully') || submitMessage.includes('sendt') ? 'text-white' : 'text-red-500'}`}>
                            {submitMessage}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="px-3 py-2 font-semibold text-white rounded-lg w-full transform hover:scale-105 hover:bg-emerald-400 flex justify-center bg-emerald-500"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? t.submitting || 'Sending...' : t.submitButton}
                    </button>
                </form>


            </div>
            <footer className="contact-footer">
                <button onClick={handlePrivacyPolicyClick} className="privacy-policy-button underline">
                    {t.privacyPolicyButton || 'Privacy Policy'}
                </button>
                <p>&copy; {new Date().getFullYear()} {t.footer}</p>
            </footer>
        </div>
    );
};

export default Contact;
