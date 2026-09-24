import React, { useEffect, useRef } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import './PrivacyConsentModal.css';

/**
 * Data Privacy Act consent modal.
 *
 * Props:
 *  - isOpen      {boolean}   Whether to show the modal.
 *  - onAccept    {function}  Called when user clicks "I Accept".
 *  - onDecline   {function}  Called when user clicks "Decline".
 *  - loading     {boolean}   If true, disables Accept and shows a spinner.
 */
export default function PrivacyConsentModal({ isOpen, onAccept, onDecline, loading = false }) {
  const overlayRef = useRef(null);
  const acceptBtnRef = useRef(null);

  // Trap focus inside modal when open
  useEffect(() => {
    if (!isOpen) return;
    // Focus the accept button when modal opens
    const timer = setTimeout(() => acceptBtnRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onDecline();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onDecline]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="privacy-modal-overlay"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-heading"
      onClick={(e) => {
        if (e.target === overlayRef.current) onDecline();
      }}
    >
      <div className="privacy-modal">
        {/* Header */}
        <div className="privacy-modal-header">
          <div className="privacy-modal-icon">
            <ShieldCheck size={24} />
          </div>
          <div className="privacy-modal-header-text">
            <h2 id="privacy-modal-heading" className="privacy-modal-title">
              Data Privacy Consent
            </h2>
            <span className="privacy-modal-subtitle">
              Republic Act No. 10173 — Data Privacy Act of 2012
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="privacy-modal-body">
          <div className="privacy-statement">
            <div className="privacy-ra-label">RA 10173 Compliance</div>

            <h3>Collection of Personal Information</h3>
            <p>
              By registering as a member of the Supreme Student Council — Alangilan
              Campus (SSC-AL), you consent to the collection, use, processing, and
              storage of the personal information you provide through this
              registration form.
            </p>

            <h3>Information We Collect</h3>
            <p>The following data will be collected and stored:</p>
            <ul>
              <li>Full name</li>
              <li>SR-Code (Student ID Number)</li>
              <li>Academic program and year level</li>
              <li>Email address (from your Google account)</li>
              <li>Unique membership number</li>
            </ul>

            <h3>Purpose of Collection</h3>
            <p>Your personal information will be used solely for the following purposes:</p>
            <ul>
              <li>Generation and verification of your official SSC-AL digital membership card</li>
              <li>Member identification and validation through QR code scanning</li>
              <li>Administration and management of membership records</li>
              <li>Communication of membership-related updates, events, and benefits</li>
            </ul>

            <div className="privacy-highlight">
              <strong>Your data will not be shared, sold, or disclosed to third parties</strong>{' '}
              outside the SSC-AL organization without your explicit consent, except
              when required by law or university policy.
            </div>

            <h3>Data Retention</h3>
            <p>
              Your personal data will be retained for the duration of your active
              membership and for a reasonable period thereafter for record-keeping
              purposes, in accordance with university data retention policies.
            </p>

            <h3>Your Rights</h3>
            <p>
              Under the Data Privacy Act of 2012, you have the right to access,
              correct, and request the deletion of your personal data. You may
              exercise these rights by contacting the SSC-AL officers or the
              university Data Protection Officer.
            </p>

            <h3>Consent</h3>
            <p>
              By clicking <strong>"I Accept & Register"</strong> below, you
              acknowledge that you have read and understood this Data Privacy
              statement and you consent to the collection, processing, and storage
              of your personal information as described above.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="privacy-modal-footer">
          <div className="privacy-modal-actions">
            <button
              id="btn-privacy-decline"
              className="btn privacy-btn-decline"
              onClick={onDecline}
              disabled={loading}
              type="button"
            >
              Decline
            </button>
            <button
              id="btn-privacy-accept"
              ref={acceptBtnRef}
              className="btn privacy-btn-accept"
              onClick={onAccept}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm" /> Registering…
                </>
              ) : (
                <>
                  <ShieldCheck size={16} /> I Accept & Register
                </>
              )}
            </button>
          </div>
          <p className="privacy-consent-note">
            You may withdraw your consent at any time by contacting an SSC-AL officer.
          </p>
        </div>
      </div>
    </div>
  );
}
