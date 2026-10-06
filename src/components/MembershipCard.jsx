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

const DEFAULT_BACK_QR = "data:image/png;base64,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";

/* ─────────────────────────────────────────────
   CARD BACK
   ───────────────────────────────────────────── */
export const CardBack = React.forwardRef(function CardBack({ member, qrDataUrl, isPreview = false }, ref) {
  // Exact 3 rows of partner logos matching the institutional reference layout (31 partners)
  const ROW_1 = [
    { file: "max_mango.png", alt: "Max Mango" },
    { file: "jovan_cafe.png", alt: "Jovan Cafe" },
    { file: "taho_story.png", alt: "Taho Story" },
    { file: "mango_grill.png", alt: "Mango Grill" },
    { file: "shakeys.png", alt: "Shakey's" },
    { file: "silver_peak.png", alt: "Silver Peak" },
    { file: "Hungry_Hippo.png", alt: "Hungry Hippo" },
    { file: "Batangas_Country_Club.png", alt: "Batangas Country Club" },
    { file: "the_graden_cafe.png", alt: "The Garden Cafe" },
    { file: "hidden_cafe.png", alt: "Hidden Cafe" },
    { file: "appleville.png", alt: "Appleville" }
  ];

  const ROW_2 = [
    { file: "kwatogs.png", alt: "Kwatogs" },
    { file: "alaw_tiluk_lomi_house.png", alt: "Alaw Tiluk Lomi Haus" },
    { file: "brighthub.png", alt: "Brighthub" },
    { file: "lckd_in.png", alt: "Lckd In" },
    { file: "butch_seafood_grill_restaurant.png", alt: "Butch Seafood & Grill" },
    { file: "southpeak_gardenandeventsplace.png", alt: "South Peak" },
    { file: "232cafe.png", alt: "232 Cafe" },
    { file: "taco_joes.png", alt: "Taco Joe's" },
    { file: "232_restaurant.png", alt: "232 Restaurant" }
  ];

  const ROW_3 = [
    { file: "engineer_labs.png", alt: "Engineer Labs" },
    { file: "vertex_prints.png", alt: "Vertex Prints" },
    { file: "engineer_guides.png", alt: "Engineer Guides" },
    { file: "calq_enger_guides.png", alt: "Calq by Engr. Guides" },
    { file: "giga_print.png", alt: "Giga Print" },
    { file: "dink_republic.png", alt: "Dink Republic" },
    { file: "lumino_photobooth.png", alt: "Lumino Photobooth" },
    { file: "elan_pilates.png", alt: "Élan Pilates" },
    { file: "NSP_Dental_Clinic.png", alt: "NSP Dental Clinic" },
    { file: "floof&fiction.png", alt: "Floof & Fiction" },
    { file: "zoerene_crafts.png", alt: "Zoerene Crafts" }
  ];

  const formatSemester = (sem) => {
    if (!sem) return 'FIRST SEMESTER';
    const s = String(sem).toLowerCase();
    if (s.includes('1st') || s.includes('first')) return 'FIRST SEMESTER';
    if (s.includes('2nd') || s.includes('second')) return 'SECOND SEMESTER';
    return sem.toUpperCase();
  };

  const validityText = formatSemester(member?.semester);

  return (
    <div className="card-face card-face-back" ref={ref}>
      {/* Subtle grid background */}
      <div className="card-back-grid-bg" aria-hidden="true" />
      
      {/* Top Gradient Bar */}
      <div className="card-back-top-bar" aria-hidden="true" />
      
      {/* Header section: Certification text & Validity on left, QR on right */}
      <div className="card-back-header">
        <div className="card-back-header-left">
          <div className="card-certification">
            <p>THIS IS TO CERTIFY THAT THE PERSON WHOSE NAME, AND PHOTOGRAPHY APPEAR HEREINS IS A DULY REGISTERED MEMBER OF THE SUPREME STUDENT COUNCIL OF BATANGAS STATE UNIVERSITY, THE NATIONAL ENGINEERING UNIVERSITY - ALANGILAN CAMPUS.</p>
            <p>THIS IS TO CERTIFY FURTHER THAT THEY ARE A STUDENT IN GOOD STANDING THAT THEIR MEMBERSHIP HAS NOT BEEN SUSPENDED, REVOKED, OR WITHDRAWN.</p>
          </div>
          
          <div className="card-validity-row">
            <span className="card-validity-title">VALIDITY:</span>
            <div className="card-validity-field">
              <span>{validityText}</span>
            </div>
          </div>
        </div>
        
        <div className="card-back-header-right">
          <div className="card-qr-box">
            <img 
              src={qrDataUrl || DEFAULT_BACK_QR} 
              alt="Verification QR Code" 
              className="card-back-qr-img" 
            />
        </div>
        </div>
      </div>

      {/* Sponsor Wall Grid: 3 Clean Rows of Partner Logos */}
      <div className="card-back-partners">
        <div className="card-partners-row card-partners-row-1">
          {ROW_1.map((p, i) => (
            <div className="card-partner-item" key={i} title={p.alt}>
              <img src={`/partnership-logo/${p.file}`} alt={p.alt} />
            </div>
          ))}
        </div>
        <div className="card-partners-row card-partners-row-2">
          {ROW_2.map((p, i) => (
            <div className="card-partner-item" key={i} title={p.alt}>
              <img src={`/partnership-logo/${p.file}`} alt={p.alt} />
            </div>
          ))}
        </div>
        <div className="card-partners-row card-partners-row-3">
          {ROW_3.map((p, i) => (
            <div className="card-partner-item" key={i} title={p.alt}>
              <img src={`/partnership-logo/${p.file}`} alt={p.alt} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Arched Banner */}
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
        onClick={() => setFlipped(f => !f)}
        role="button"
        tabIndex={0}
        aria-label={`Membership card — click to flip to ${flipped ? 'front' : 'back'}`}
        onKeyDown={(e) => e.key === 'Enter' && setFlipped(f => !f)}
      >
        <div className={`card-inner ${flipped ? 'is-flipped' : ''}`}>
          <CardFront member={member} isPreview={isPreview} />
          <CardBack member={member} qrDataUrl={qrDataUrl} isPreview={isPreview} />
        </div>
      </div>
    </div>
  );
}

