import React from 'react';
import { useNavigate } from 'react-router-dom'; // Updated hook
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
    const navigate = useNavigate(); // Using useNavigate for navigation

    const handleBackClick = () => {
        navigate(-1); // Go back to the previous page
    };

    return (
        <div className="privacy-policy">
            <button className="back-button" onClick={handleBackClick}>Back</button>
            <h1>Privacy Policy</h1>
            <section>
                <h2>Introduction</h2>
                <p>
                    Welcome to Anthra. This Privacy Policy explains how we collect, use, and protect your personal information when you use our services.
                    We respect your privacy and are committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR).
                </p>
            </section>
            <section>
                <h2>What Information We Collect</h2>
                <p>
                    We collect the following personal information when you create an account with us:
                </p>
                <ul>
                    <li><strong>Personal Information:</strong> Your name, email address, age, location, institution, work, and profile details.</li>
                    <li><strong>Login Information:</strong> Your password and the token generated for user authentication.</li>
                    <li><strong>Profile Information:</strong> Courses, subjects, and statuses that you provide as part of your profile.</li>
                    <li><strong>Email Verification:</strong> We collect an email verification code and its expiration time.</li>
                    <li><strong>Profile Picture:</strong> If provided, we store your profile picture URL for display purposes.</li>
                </ul>
            </section>
            <section>
                <h2>How We Use Your Information</h2>
                <p>
                    We use your personal information to:
                </p>
                <ul>
                    <li>Create and manage your account</li>
                    <li>Authenticate your identity for secure login</li>
                    <li>Send you verification emails to confirm your email address</li>
                    <li>Provide you with personalized features and recommendations</li>
                    <li>Improve our services and user experience</li>
                </ul>
            </section>
            <section>
                <h2>Data Retention</h2>
                <p>
                    We retain your personal data for as long as your account is active or as needed to provide you with our services. You can request to delete your account at any time.
                </p>
            </section>
            <section>
                <h2>Your Rights Under GDPR</h2>
                <p>
                    Under the General Data Protection Regulation (GDPR), you have the following rights regarding your personal data:
                </p>
                <ul>
                    <li><strong>Right to Access:</strong> You can request a copy of the personal data we hold about you.</li>
                    <li><strong>Right to Rectification:</strong> You can request that we correct any incorrect or incomplete information.</li>
                    <li><strong>Right to Erasure:</strong> You can request that we delete your personal data from our systems.</li>
                    <li><strong>Right to Restrict Processing:</strong> You can request that we limit the processing of your data in certain circumstances.</li>
                    <li><strong>Right to Object:</strong> You can object to the processing of your personal data for specific purposes.</li>
                    <li><strong>Right to Data Portability:</strong> You can request your data in a machine-readable format.</li>
                </ul>
            </section>
            <section>
                <h2>How We Protect Your Data</h2>
                <p>
                    We implement appropriate technical and organizational measures to safeguard your personal data, including encryption and secure storage methods.
                </p>
            </section>
            <section>
                <h2>Changes to This Policy</h2>
                <p>
                    We may update this Privacy Policy from time to time. When we do, we will notify you by posting the new policy on this page and updating the effective date.
                </p>
            </section>
            <section>
                <h2>Contact Us</h2>
                <p>
                    If you have any questions or concerns about your privacy or this Privacy Policy, please contact us at support@anthra.dk.
                </p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
