import React, { useState, useEffect } from 'react';
import { getExpiryLabel } from '../utils/memberNumber';
import './MembershipCard.css';

/* ─────────────────────────────────────────────
   CARD FRONT
   ───────────────────────────────────────────── */
export const CardFront = React.forwardRef(function CardFront({ member, isPreview = false }, ref) {
  const expiry = getExpiryLabel(member?.schoolYear, member?.semester);

  return (
    <div className="card-face card-face-front" ref={ref}>
      {/* Background layers */}
      <div className="card-bg-pattern" aria-hidden="true" />

      {/* Top row */}
      <div className="card-top">
        <div className="card-org">
          <img src="/logo.jpg" alt="SSC-AL" className="card-logo" />
          <div className="card-org-text">
            <span className="card-org-name">SUPREME STUDENT COUNCIL</span>
            <span className="card-org-campus">Batangas State University The National Engineering University</span>
          </div>
        </div>
        <span className="card-member-badge">MEMBER</span>
      </div>

      {/* Body: chip + info */}
      <div className="card-body">
        <div className="card-photo-container">
          {member?.photoURL ? (
            <img src={member.photoURL} alt="Member" className="card-photo" referrerPolicy="no-referrer" />
          ) : (
            <div className="card-photo-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          )}
        </div>
        <div className="card-member-info">
          <p className="card-member-name">{member?.fullName || 'FULL NAME'}</p>
          <p className="card-sr-code">
            SR-Code:&nbsp;
            <span className="card-sr-value">{member?.studentId || '24-XXXXX'}</span>
          </p>
          <p className="card-course">{member?.program || member?.course || 'Program'} · {member?.yearLevel || 'Year'}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="card-footer">
        <div className="card-footer-left">
          <span className="card-label">Member No.</span>
          <span className="card-value card-member-number">
            {member?.membershipNumber || 'SSC-AL-XXXX-XXXXX'}
          </span>
        </div>
        <div className="card-footer-right">
          <span className="card-label">School Year</span>
          <span className="card-value">{member?.schoolYear || '20XX-20XX'} · {member?.semester || '—'}</span>
          {expiry && <span className="card-expiry">{expiry}</span>}
        </div>
      </div>

      {/* Bottom gold stripe */}
      <div className="card-gold-stripe" aria-hidden="true" />

      {/* Preview watermark */}
      {isPreview ? (
        <div className="card-preview-overlay" aria-label="Preview">
          <span>PREVIEW</span>
        </div>
      ) : (member?.status === 'pending' || member?.status === 'inactive') ? (
        <div className="card-preview-overlay card-inactive-overlay" aria-label="Inactive">
          <span>INACTIVE</span>
        </div>
      ) : null}
    </div>
  );
});

/* ─────────────────────────────────────────────
   CARD BACK
   ───────────────────────────────────────────── */
export const CardBack = React.forwardRef(function CardBack({ member, qrDataUrl, isPreview = false }, ref) {
  return (
    <div className="card-face card-face-back" ref={ref}>
      <div className="card-back-grid-bg" aria-hidden="true" />
      <div className="card-back-top-bar" aria-hidden="true" />
      
      <div className="card-back-body">
        <div className="card-back-left">
          <div className="card-certification">
            <p>THIS IS TO CERTIFY THAT THE PERSON WHOSE NAME, AND PHOTOGRAPH APPEARS HEREIN IS A DULY REGISTERED MEMBER OF THE SUPREME STUDENT COUNCIL OF BATANGAS STATE UNIVERSITY, THE NATIONAL ENGINEERING UNIVERSITY - ALANGILAN CAMPUS.</p>
            <p>THIS IS TO CERTIFY FURTHER THAT THEY ARE A STUDENT IN GOOD STANDING THAT THEIR MEMBERSHIP HAS NOT BEEN SUSPENDED, REVOKED, OR WITHDRAWN.</p>
          </div>
          <div className="card-validity">
            <span className="validity-label">VALIDITY:</span>
            <div className="validity-box">FIRST SEMESTER</div>
          </div>
        </div>
        
        <div className="card-back-right">
          <div className="card-qr-frame">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Verification QR Code" className="card-qr-img" />
            ) : (
              <div className="card-qr-placeholder">
                <div className="qr-shimmer" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card-back-bottom-arc">
        <span>SUPREME STUDENT COUNCIL - ALANGILAN</span>
      </div>

      {/* Preview watermark */}
      {isPreview ? (
        <div className="card-preview-overlay" aria-label="Preview">
          <span>PREVIEW</span>
        </div>
      ) : (member?.status === 'pending' || member?.status === 'inactive') ? (
        <div className="card-preview-overlay card-inactive-overlay" aria-label="Inactive">
          <span>INACTIVE</span>
        </div>
      ) : null}
    </div>
  );
});

/* ─────────────────────────────────────────────
   INTERACTIVE FLIP CARD
   ───────────────────────────────────────────── */
export default function MembershipCard({ member, qrDataUrl, autoFlip = false, isPreview = false }) {
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Hide the "click to flip" hint after 3s
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // Auto-flip loop for landing page preview
  useEffect(() => {
    if (!autoFlip) return;
    const flip = setTimeout(() => setFlipped(true), 2000);
    const unflip = setTimeout(() => setFlipped(false), 5000);
    const repeat = setTimeout(() => { }, 8000); // reset handled by re-render
    return () => { clearTimeout(flip); clearTimeout(unflip); clearTimeout(repeat); };
  }, [autoFlip]);

  return (
    <div className="card-scene-wrapper">
      {showHint && !autoFlip && (
        <div className="card-hint" aria-hidden="true">
          ↻ Click card to flip
        </div>
      )}
      <div
        className="card-scene"
        onClick={() => !autoFlip && setFlipped(f => !f)}
        role={autoFlip ? undefined : 'button'}
        tabIndex={autoFlip ? undefined : 0}
        aria-label={autoFlip ? undefined : `Membership card — click to flip to ${flipped ? 'front' : 'back'}`}
        onKeyDown={(e) => !autoFlip && e.key === 'Enter' && setFlipped(f => !f)}
      >
        <div className={`card-inner ${flipped ? 'is-flipped' : ''}`}>
          <CardFront member={member} isPreview={isPreview} />
          <CardBack member={member} qrDataUrl={qrDataUrl} isPreview={isPreview} />
        </div>
      </div>
    </div>
  );
}

