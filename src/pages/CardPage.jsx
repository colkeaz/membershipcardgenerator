import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import MembershipCard, { CardFront, CardBack } from '../components/MembershipCard';
import { exportCardAsPNG, exportCardAsPDF } from '../utils/cardExport';
import { signCard, buildVerifyUrl } from '../utils/cardSigning';
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
  const [exporting, setExporting] = useState('');

  // Generate signed QR once member + user are loaded
  useEffect(() => {
    if (!member || !user) return;
    let cancelled = false;
    async function buildQR() {
      const targetUid = member.id || user.uid;
      const sig = await signCard(member.membershipNumber, targetUid);
      const url = buildVerifyUrl(member.membershipNumber, targetUid, sig);
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

  const handleExport = async (type) => {
    setExporting(type);
    try {
      if (type === 'front-png') {
        await exportCardAsPNG(frontRef, `SSC-AL_Card_Front_${member?.fullName?.replace(/\s+/g,'_')}.png`);
        toast('Front card downloaded as PNG!', 'success');
      } else if (type === 'back-png') {
        await exportCardAsPNG(backRef, `SSC-AL_Card_Back_${member?.fullName?.replace(/\s+/g,'_')}.png`);
        toast('Back card downloaded as PNG!', 'success');
      } else if (type === 'pdf') {
        await exportBothAsPDF(frontRef, backRef, member);
        toast('Both sides downloaded as PDF!', 'success');
      }
    } catch (err) {
      console.error(err);
      toast('Export failed. Please try again.', 'error');
    } finally {
      setExporting('');
    }
  };

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
                id="btn-export-front-png"
                className="btn btn-gold btn-sm"
                onClick={() => handleExport('front-png')}
                disabled={!!exporting}
                aria-label="Download front as PNG"
              >
                {exporting === 'front-png'
                  ? <><span className="spinner spinner-sm" /> Exporting…</>
                  : <><FileImage size={14} aria-hidden="true" /> Front PNG</>}
              </button>
              <button
                id="btn-export-back-png"
                className="btn btn-outline btn-sm"
                onClick={() => handleExport('back-png')}
                disabled={!!exporting || !qrDataUrl}
                aria-label="Download back as PNG"
              >
                {exporting === 'back-png'
                  ? <><span className="spinner spinner-sm" /> Exporting…</>
                  : <><RotateCcw size={14} aria-hidden="true" /> Back PNG</>}
              </button>
              <button
                id="btn-export-pdf"
                className="btn btn-outline btn-sm"
                onClick={() => handleExport('pdf')}
                disabled={!!exporting || !qrDataUrl}
                aria-label="Download both sides as PDF"
              >
                {exporting === 'pdf'
                  ? <><span className="spinner spinner-sm" /> Exporting…</>
                  : <><Download size={14} aria-hidden="true" /> Both PDF</>}
              </button>
            </div>
          )}
        </div>

        {/* Right: header, status, info */}
        <div className="animate-fade-up delay-1">
          <div className="card-page-header">
            <h1 className="card-page-title">Membership Card</h1>
            <p className="card-page-sub">
              {isActive   ? 'Your card is active. Click the card to flip it.' : ''}
              {isPending  ? 'Awaiting officer approval.' : ''}
              {isInactive ? 'Your membership has been deactivated.' : ''}
            </p>
          </div>

          {/* Status banners */}
          {isPending && (
            <div className="card-status-box card-status-pending" style={{ marginTop: 24 }}>
              <Clock size={16} aria-hidden="true" />
              <div>
                <strong>Pending Approval</strong>
                <p>An SSC-AL officer will review and activate your membership soon.</p>
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

/** Export front + back as a two-page PDF (landscape, credit-card size). */
async function exportBothAsPDF(frontRef, backRef, member) {
  const [html2canvas, { jsPDF }] = await Promise.all([
    import('html2canvas').then(m => m.default),
    import('jspdf'),
  ]);

  const opts = { scale: 3, useCORS: true, backgroundColor: null, logging: false };
  const [frontCanvas, backCanvas] = await Promise.all([
    html2canvas(frontRef.current, opts),
    html2canvas(backRef.current, opts),
  ]);

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] });
  pdf.addImage(frontCanvas.toDataURL('image/png'), 'PNG', 0, 0, 85.6, 54);
  pdf.addPage([85.6, 54], 'landscape');
  pdf.addImage(backCanvas.toDataURL('image/png'), 'PNG', 0, 0, 85.6, 54);

  const safeName = (member?.fullName || 'member').replace(/\s+/g, '_');
  pdf.save(`SSC-AL_Card_${safeName}.pdf`);
}

