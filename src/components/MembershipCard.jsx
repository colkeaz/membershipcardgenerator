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
      {/* Grid Background layer */}
      <div className="card-bg-pattern" aria-hidden="true" />

      {/* Top Banner */}
      <div className="card-top-banner">
        <img src="/logo-transparent.png" alt="SSC-AL" className="card-logo" />
        <div className="card-org-text">
          <span className="card-org-name">SUPREME STUDENT COUNCIL - ALANGILAN</span>
          <span className="card-org-campus">BATANGAS STATE UNIVERSITY, THE NATIONAL ENGINEERING UNIVERSITY - ALANGILAN</span>
        </div>
      </div>

      {/* Main Content (Middle) */}
      <div className="card-body">
        
        {/* Profile Section (Photo + Name/Course) */}
        <div className="card-profile-section">
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
            <h2 className="card-member-name">
              {(() => {
                const name = (member?.fullName || 'PANGANIBAN, LIMUEL AMER ABDULAZIZ C.').trim();
                const hasComma = name.includes(',');
                const [last, first] = hasComma 
                  ? [name.split(',')[0] + ',', name.split(',').slice(1).join(',').trim()] 
                  : [name.split(' ').pop() + ',', name.split(' ').slice(0, -1).join(' ')];
                return (
                  <>
                    <span className="card-last-name">{last}</span>
                    <span className="card-first-name">{first}</span>
                  </>
                );
              })()}
            </h2>
            <p className="card-sr-code">
              SR-Code: <span className="card-sr-value">{member?.studentId || '23-06118'}</span>
            </p>
            <p className="card-course">
              {member?.department && <span className="card-department-text">{member.department}</span>}
              {member?.program || member?.course || 'Bachelor of Electrical Engineering'} - {member?.yearLevel || '4th Year'}
            </p>
          </div>
        </div>

        {/* Data Section (School Year + Member No) */}
        <div className="card-data-section">
          <div className="card-data-left">
            <span className="card-label">SCHOOL YEAR</span>
            <span className="card-value-dark">{member?.schoolYear || '2026-2027'} - {member?.semester || '1st Semester'}</span>
            <span className="card-expiry-red">{expiry || 'Valid until Jan 2027'}</span>
          </div>
          <div className="card-data-right">
            <span className="card-label">MEMBER NO.</span>
            <span className="card-member-no-value">{member?.membershipNumber || 'SSC-2026-EE-00001'}</span>
          </div>
        </div>

      </div>

      {/* Bottom Arched Banner */}
      <div className="card-bottom-banner">
        <span>MEMBERSHIP IDENTIFICATION CARD</span>
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
   CARD BACK
   ───────────────────────────────────────────── */
export const CardBack = React.forwardRef(function CardBack({ member, qrDataUrl, isPreview = false }, ref) {
  // A clean Sponsor Wall of EVERY SINGLE available partner logo (31 logos)
  const ALL_PARTNERS = [
    "shakeys.png", "Batangas_Country_Club.png", "dink_republic.png", "max_mango.png",
    "lumino_photobooth.png", "NSP_Dental_Clinic.png", "southpeak_gardenandeventsplace.png",
    "brighthub.png", "elan_pilates.png", "vertex_prints.png", "lckd_in.png",
    "giga_print.png", "taho_story.png", "kwatogs.png", "jovan_cafe.png",
    "hidden_cafe.png", "engineer_guides.png", "engineer_labs.png", "alaw_tiluk_lomi_house.png",
    "zoerene_crafts.png", "butch_seafood_grill_restaurant.png", "Hungry_Hippo.png", 
    "232cafe.png", "232_restaurant.png", "calq_enger_guides.png", "floof&fiction.png",
    "taco_joes.png", "mango_grill.png", "appleville.png", "the_graden_cafe.png", "silver_peak.png"
  ];

  return (
    <div className="card-face card-face-back" ref={ref}>
      <div className="card-back-grid-bg" aria-hidden="true" />
      <div className="card-back-top-bar" aria-hidden="true" />
      
      <div className="card-back-body">
        <div className="card-back-left">
          <div className="card-certification">
            <p>THIS CERTIFIES THAT THE BEARER IS A DULY REGISTERED MEMBER OF THE SUPREME STUDENT COUNCIL - ALANGILAN CAMPUS.</p>
          </div>
          
          <div className="card-partners-section">
            <span className="partners-label">AUTHORIZED PARTNER PRIVILEGES</span>
            <div className="sponsor-wall-grid">
              {ALL_PARTNERS.map((logo, i) => (
                <div className="sponsor-wall-item" key={i}>
                  <img src={`/partnership-logo/${logo}`} alt="Partner" />
                </div>
              ))}
            </div>
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
          <div className="card-validity">
            <span className="validity-label">VALIDITY</span>
            <div className="validity-box">FIRST SEMESTER</div>
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
    return () => { clearTimeout(flip); clearTimeout(unflip); };
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

