import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import MembershipCard, { CardFront, CardBack } from '../components/MembershipCard';
import { buildVerifyUrl } from '../utils/cardSigning';
import { useToast } from '../components/ToastProvider';
import { Download, FileImage, Clock, Info, RotateCcw, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import './CardPage.css';

// Placeholder Google Form for renewal payments (can be replaced with actual form URL)
const RENEWAL_FORM_URL = import.meta.env.VITE_RENEWAL_FORM_URL || 'https://forms.google.com/your-membership-renewal-form';

export default function CardPage() {
  const { member, user } = useAuth();
  const toast = useToast();

  // Refs for off-screen export targets (no 3D transform — clean for html2canvas)
  const frontRef = useRef(null);
  const backRef  = useRef(null);

  const [qrDataUrl, setQrDataUrl] = useState('');

  // Generate signed QR once member + user are loaded
  useEffect(() => {
    if (!member || !user) return;
    let cancelled = false;
    async function buildQR() {
      const targetUid = member.id || user.uid;
      const url = buildVerifyUrl(member.membershipNumber, targetUid);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 180, margin: 1,
        color: { dark: '#1a0000', light: '#fff8f0' },
        errorCorrectionLevel: 'H',
      });
      if (!cancelled) setQrDataUrl(dataUrl);
    }
    buildQR().catch(console.error);
    return () => { cancelled = true; };
  }, [member, user]);



  const isPending  = member?.status === 'pending';
  const isInactive = member?.status === 'inactive';
  const isActive   = member?.status === 'active';

  return (
    <main className="card-page">
      {/* Off-screen export targets — no 3D transforms, clean for html2canvas */}
      <div className="export-offscreen" aria-hidden="true">
        <CardFront ref={frontRef} member={member} />
        <CardBack  ref={backRef}  qrDataUrl={qrDataUrl} />
      </div>

      <div className="container card-page-container">
        {/* Left: card + export buttons */}
        <div className="card-display-area animate-fade-up">
          {member ? (
            <div className="card-wrapper">
              <MembershipCard member={member} qrDataUrl={qrDataUrl} />
            </div>
          ) : (
            <div className="card-skeleton" aria-label="Loading card" />
          )}

          {/* Export actions */}
          {(isActive || isInactive) && (
            <div className="card-actions">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => window.print()}
                aria-label="Print Card"
              >
                <Download size={14} aria-hidden="true" /> Print / PDF
              </button>
            </div>
          )}
        </div>

        {/* Right: header, status, info */}
        <div className="card-info-area animate-fade-up delay-1">
          <div className="card-page-header">
            <div className="card-page-badge">
              <img src="/ssc-seal.jpg" alt="SSC Seal" className="card-page-badge-logo" />
              <span>Supreme Student Council · Alangilan</span>
            </div>

            <div className="card-page-title-row">
              <h1 className="card-page-title">Digital Membership Card</h1>
              {isActive && (
                <div className="card-status-pill status-active">
                  <span className="status-live-dot" />
                  <span>ACTIVE & VERIFIED</span>
                </div>
              )}
            </div>
            
            <p className="card-page-sub">
              {isActive   ? 'Your institutional membership is verified. Click the card to flip between front and back.' : ''}
              {isPending  ? 'Awaiting verification and activation by an SSC-AL council officer.' : ''}
              {isInactive ? 'Your membership has concluded or expired. Renew below to reactivate privileges.' : ''}
            </p>
          </div>

          {/* Status banners */}
          {isPending && (
            <div className="card-status-box card-status-pending">
              <Clock size={18} aria-hidden="true" />
              <div>
                <strong>Pending Officer Review</strong>
                <p>An SSC-AL officer will verify your enrollment credentials and activate your membership shortly.</p>
              </div>
            </div>
          )}
          {isInactive && (
            <div className="card-status-box card-status-inactive" style={{ marginTop: 24 }}>
              <Info size={18} className="card-status-icon-inactive" aria-hidden="true" />
              <div className="card-status-inactive-body">
                <strong>Membership Inactive</strong>
                <p>Your membership has expired. Renew to re-activate your card.</p>
                <div className="card-renew-action">
                  <a
                    href={RENEWAL_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm btn-renew"
                    id="btn-renew-membership"
                  >
                    <ExternalLink size={14} /> Renew Membership
                  </a>
                  <span className="card-renew-note">
                    Submit the form and fee to reactivate your membership.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Info grid */}
          {member && (
            <div className="card-info-grid" style={{ marginTop: 24 }}>
              <InfoItem label="Full Name"      value={member.fullName} />
              <InfoItem label="SR-Code"        value={member.studentId} mono />
              <InfoItem label="Department"     value={member.department} />
              <InfoItem label="Program"        value={member.program || member.course} />
              <InfoItem label="Year Level"     value={member.yearLevel} />
              <InfoItem label="Membership No." value={member.membershipNumber} gold />
              <InfoItem label="School Year"    value={`${member.schoolYear} · ${member.semester}`} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function InfoItem({ label, value, gold, mono }) {
  return (
    <div className="info-item">
      <span className="info-label">{label}</span>
      <span className={`info-value ${gold ? 'info-value-gold' : ''} ${mono ? 'info-value-mono' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}



