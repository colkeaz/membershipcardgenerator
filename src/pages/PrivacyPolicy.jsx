import React from 'react';
import './Legal.css';

export default function PrivacyPolicy() {
  return (
    <main className="legal-page page-animate">
      <div className="container">
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-updated">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="legal-content">
          <p>
            The Supreme Student Council of Batangas State University - The National Engineering University, Alangilan Campus ("SSC-AL", "we", "us", or "our") respects your privacy and is committed to protecting your personal data in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173).
          </p>

          <h2>1. Information We Collect</h2>
          <p>When you register for the SSC-AL Digital Membership Card, we collect the following Personally Identifiable Information (PII):</p>
          <ul>
            <li>Full Name</li>
            <li>SR-Code (Student ID Number)</li>
            <li>Program and Year Level</li>
            <li>BatStateU Google Workspace Email Address</li>
            <li>Profile Picture (via Google Account)</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>Your information is collected solely for the following purposes:</p>
          <ul>
            <li>To verify your identity and active enrollment status as a student of BatStateU Alangilan.</li>
            <li>To generate and issue your personalized Digital Membership Card.</li>
            <li>To allow SSC-AL partner establishments to verify your eligibility for discounts and benefits.</li>
            <li>To maintain an internal registry of active council members.</li>
          </ul>

          <h2>3. Information Sharing and Disclosure</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. 
            When a partner establishment scans your Digital Membership Card's QR code, they are presented with a limited, strictly sanitized public profile (Name, SR-Code, Program, Year Level, and Active Status). 
            <strong>Your private email address and other sensitive backend data are never exposed during QR verification.</strong>
          </p>

          <h2>4. Data Security</h2>
          <p>
            Your data is stored securely using enterprise-grade cloud infrastructure (Google Firebase). We implement strict security measures, including Firebase App Check, Server-Side HMAC Cryptography, and rate-limiting to protect your information against unauthorized access, alteration, or destruction.
          </p>

          <h2>5. Your Rights</h2>
          <p>
            Under the Data Privacy Act, you have the right to ask for a copy of any personal information we hold about you, as well as to ask for it to be corrected or deleted. 
            If you wish to exercise these rights or withdraw your membership, please contact the SSC-AL Office.
          </p>
        </div>
      </div>
    </main>
  );
}
