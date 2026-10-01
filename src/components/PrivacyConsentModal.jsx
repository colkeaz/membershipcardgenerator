import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, AlertTriangle, ArrowLeft, Building2 } from 'lucide-react';
import './PrivacyConsentModal.css';

/**
 * Data Privacy Act consent modal with decline confirmation step.
 *
 * Props:
 *  - isOpen      {boolean}   Whether to show the modal.
 *  - onAccept    {function}  Called when user clicks "I Accept".
 *  - onDecline   {function}  Called when user confirms decline (redirects to office registration).
 *  - loading     {boolean}   If true, disables Accept and shows a spinner.
 */
export default function PrivacyConsentModal({ isOpen, onAccept, onDecline, loading = false }) {
  const overlayRef = useRef(null);
  const acceptBtnRef = useRef(null);
  const [confirmingDecline, setConfirmingDecline] = useState(false);

  // Reset confirmation state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setConfirmingDecline(false);
    }
  }, [isOpen]);

  // Trap focus inside modal when open
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => acceptBtnRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [isOpen, confirmingDecline]);

  // Close / go back on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (confirmingDecline) {
          setConfirmingDecline(false);
        } else {
          setConfirmingDecline(true);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, confirmingDecline]);

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
        if (e.target === overlayRef.current) {
          if (confirmingDecline) {
            setConfirmingDecline(false);
          } else {
            setConfirmingDecline(true);
          }
        }
      }}
    >
      <div className="privacy-modal">
        {/* Header */}
        <div className="privacy-modal-header">
          <div className="privacy-modal-icon" style={confirmingDecline ? { color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.25)', background: 'rgba(245, 158, 11, 0.08)' } : {}}>
            {confirmingDecline ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
          </div>
          <div className="privacy-modal-header-text">
            <h2 id="privacy-modal-heading" className="privacy-modal-title">
              {confirmingDecline ? 'Are you sure you want to decline?' : 'Data Privacy Consent'}
            </h2>
            <span className="privacy-modal-subtitle">
              {confirmingDecline
                ? 'Face-to-face registration required at SSC-AL office'
                : 'Republic Act No. 10173 — Data Privacy Act of 2012'}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="privacy-modal-body">
          {confirmingDecline ? (
            /* Decline Confirmation View */
            <div className="privacy-confirm-view">
              <div className="privacy-confirm-alert">
                <AlertTriangle size={24} className="privacy-confirm-alert-icon" />
                <div className="privacy-confirm-alert-text">
                  <strong>Online Registration Cannot Proceed Without Consent.</strong>
                  <br />
                  Under Republic Act No. 10173, we cannot collect, process, or store your personal
                  data or issue your digital membership card online without your explicit consent.
                </div>
              </div>

              <div className="privacy-confirm-details">
                <h4>Face-to-Face Office Registration Required</h4>
                <p>
                  To complete your registration for the SSC-AL Membership Card, you must
                  <strong> personally go to the SSC-AL office face-to-face</strong> at BatStateU
                  Alangilan Campus to register manually.
                </p>
                <ul>
                  <li>Present your physical BatStateU Student ID or Certificate of Registration (COR)</li>
                  <li>Fill out and sign the official printed paper Data Privacy Consent form</li>
                  <li>Have your membership credentials verified on-site by an SSC-AL officer</li>
                </ul>
              </div>

              <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
                Would you like to return to review and accept the privacy terms, or confirm your
                decline and view the office location and operating hours?
              </p>
            </div>
          ) : (
            /* Standard Terms View */
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
          )}
        </div>

        {/* Footer */}
        <div className="privacy-modal-footer">
          <div className="privacy-modal-actions">
            {confirmingDecline ? (
              <>
                <button
                  id="btn-privacy-back-terms"
                  className="btn privacy-btn-cancel-decline"
                  onClick={() => setConfirmingDecline(false)}
                  type="button"
                >
                  <ArrowLeft size={16} /> Go Back to Terms
                </button>
                <button
                  id="btn-privacy-confirm-decline"
                  className="btn privacy-btn-confirm-decline"
                  onClick={onDecline}
                  type="button"
                >
                  <Building2 size={16} /> Confirm Decline & View Office Info
                </button>
              </>
            ) : (
              <>
                <button
                  id="btn-privacy-decline"
                  className="btn privacy-btn-decline"
                  onClick={() => setConfirmingDecline(true)}
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
              </>
            )}
          </div>
          <p className="privacy-consent-note">
            {confirmingDecline
              ? 'Declining online consent redirects you to in-person office registration instructions.'
              : 'You may withdraw your consent at any time by contacting an SSC-AL officer.'}
          </p>
        </div>
      </div>
    </div>
  );
}

