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
      <div className="card-left-accent" aria-hidden="true" />

      {/* Top row */}
      <div className="card-top">
        <div className="card-org">
          <img src="/logo.jpg" alt="SSC-AL" className="card-logo" />
          <div className="card-org-text">
            <span className="card-org-name">SUPREME STUDENT COUNCIL</span>
            <span className="card-org-campus">Alangilan Campus · BatStateU</span>
          </div>
        </div>
        <span className="card-member-badge">MEMBER</span>
      </div>

      {/* Body: chip + info */}
      <div className="card-body">
        <div className="card-chip" aria-hidden="true">
          <div className="chip-grid">
            <span /><span /><span /><span />
          </div>
        </div>
        <div className="card-member-info">
          <p className="card-member-name">{member?.fullName || 'FULL NAME'}</p>
          <p className="card-sr-code">
            SR-Code:&nbsp;
            <span className="card-sr-value">{member?.studentId || '20XX-XXXXX'}</span>
          </p>
          <p className="card-course">{member?.course || 'Course'} · {member?.yearLevel || 'Year'}</p>
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
      {isPreview && (
        <div className="card-preview-overlay" aria-label="Preview">
          <span>PREVIEW</span>
        </div>
      )}
    </div>
  );
});

/* ─────────────────────────────────────────────
   CARD BACK
   ───────────────────────────────────────────── */
export const CardBack = React.forwardRef(function CardBack({ qrDataUrl, isPreview = false }, ref) {
  return (
    <div className="card-face card-face-back" ref={ref}>
      {/* Magnetic stripe */}
      <div className="card-mag-stripe" aria-hidden="true" />

      {/* QR section */}
      <div className="card-back-body">
        <div className="card-qr-frame">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Verification QR Code" className="card-qr-img" />
          ) : (
            <div className="card-qr-placeholder">
              <div className="qr-shimmer" />
            </div>
          )}
        </div>
        <p className="card-verify-label">SCAN TO VERIFY AUTHENTICITY</p>
        <p className="card-verify-sub">Official SSC-AL Digital Membership Card</p>
      </div>

      {/* Bottom branding */}
      <div className="card-back-footer">
        <img src="/logo.jpg" alt="SSC-AL" className="card-back-logo" />
        <div className="card-back-brand">
          <span className="card-back-org">SSC · Alangilan Campus</span>
          <span className="card-back-uni">Batangas State University</span>
        </div>
      </div>

      {/* Bottom gold stripe */}
      <div className="card-gold-stripe" aria-hidden="true" />

      {/* Preview watermark */}
      {isPreview && (
        <div className="card-preview-overlay" aria-label="Preview">
          <span>PREVIEW</span>
        </div>
      )}
    </div>
  );
});

/* ─────────────────────────────────────────────
   INTERACTIVE FLIP CARD
   ───────────────────────────────────────────── */
export default function MembershipCard({ member, qrDataUrl, autoFlip = false, isPreview = false }) {
  const [flipped, setFlipped]   = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Hide the "click to flip" hint after 3s
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // Auto-flip loop for landing page preview
  useEffect(() => {
    if (!autoFlip) return;
    const flip   = setTimeout(() => setFlipped(true),  2000);
    const unflip = setTimeout(() => setFlipped(false), 5000);
    const repeat = setTimeout(() => {}, 8000); // reset handled by re-render
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
          <CardBack  qrDataUrl={qrDataUrl} isPreview={isPreview} />
        </div>
      </div>
    </div>
  );
}
