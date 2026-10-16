import React, { useRef, useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import MembershipCard, { CardFront } from '../components/MembershipCard';
import SubmitTicketModal from '../components/SubmitTicketModal';
import { buildVerifyUrl } from '../utils/cardSigning';
import { computeRegistrationDiff } from '../utils/constants';
import { useToast } from '../components/ToastProvider';
import {
  Download,
  FileImage,
  Clock,
  Info,
  ExternalLink,
  FileEdit,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { SealCheck } from '@phosphor-icons/react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import './CardPage.css';

// Placeholder Google Form for renewal payments (can be replaced with actual form URL)
const RENEWAL_FORM_URL = import.meta.env.VITE_RENEWAL_FORM_URL || 'https://forms.google.com/your-membership-renewal-form';

export default function CardPage() {
  const { member, user, refreshMember } = useAuth();
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  // Correction ticket state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [latestTicket, setLatestTicket] = useState(null);
  const [cancellingTicket, setCancellingTicket] = useState(false);
  const [dismissedTicketId, setDismissedTicketId] = useState(null);
  const prevTicketStatusRef = useRef(null);

  // Refs for off-screen export targets (no 3D transform — clean for html2canvas)
  const frontRef = useRef(null);

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
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      if (!cancelled) setQrDataUrl(dataUrl);
    }
    buildQR().catch(console.error);
    return () => { cancelled = true; };
  }, [member, user]);

  // Listen in real time to the current user's correction tickets
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'tickets'), where('uid', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setLatestTicket(null);
          return;
        }
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((t) => t.status !== 'cancelled')
          .sort((a, b) => {
            const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return tB - tA;
          });

        const newest = docs[0] || null;
        if (
          newest &&
          prevTicketStatusRef.current === 'pending' &&
          newest.status === 'approved'
        ) {
          refreshMember().catch(console.error);
          toast('Your correction ticket was approved and your card details have been updated!', 'success');
        }
        prevTicketStatusRef.current = newest?.status || null;
        setLatestTicket(newest);
      },
      (err) => {
        console.error('Error listening to user tickets:', err);
      }
    );
    return () => unsub();
  }, [user?.uid, refreshMember, toast]);

  const handleCancelTicket = async (ticketId) => {
    setCancellingTicket(true);
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
      });
      toast('Correction ticket cancelled.', 'info');
    } catch (err) {
      console.error('Failed to cancel ticket:', err);
      toast('Could not cancel ticket. Please try again.', 'error');
    } finally {
      setCancellingTicket(false);
    }
  };

  const downloadCardImage = async () => {
    if (!frontRef.current) return;
    if (member?.status !== 'active') {
      toast('Card is not active and cannot be downloaded.', 'error');
      return;
    }
    setDownloading(true);
    try {
      const canvas = await html2canvas(frontRef.current, { backgroundColor: null, scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `SSC_AL_ID_${member.studentId || 'Card'}.png`;
      link.click();
      toast('Card image saved successfully!', 'success');
    } catch (error) {
      console.error(error);
      toast('Failed to save card image', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const isPending  = member?.status === 'pending';
  const isInactive = member?.status === 'inactive';
  const isActive   = member?.status === 'active';

  const hasPendingTicket = latestTicket?.status === 'pending';
  const ticketDiffs = latestTicket
    ? computeRegistrationDiff(latestTicket.currentDetails, latestTicket.proposedChanges)
    : [];

  return (
    <main className="card-page">
      {/* Off-screen export targets — no 3D transforms, clean for html2canvas */}
      <div className="export-offscreen" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        {isActive && (
          <div ref={frontRef} style={{ width: 'fit-content' }}><CardFront member={member} /></div>
        )}
      </div>

      <div className="container card-page-container">
        {/* Left: card + export buttons */}
        <div className="card-display-area animate-fade-up">
          {member ? (
            <MembershipCard member={member} qrDataUrl={qrDataUrl} isLocked={!isActive} />
          ) : (
            <div className="card-skeleton" aria-label="Loading card" />
          )}

          {/* Export actions */}
          {isActive && (
            <div className="card-actions" style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => window.print()}
                aria-label="Print Card"
              >
                <Download size={14} aria-hidden="true" /> Print / PDF
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={downloadCardImage}
                disabled={downloading}
                aria-label="Download Image"
              >
                {downloading ? <span className="spinner spinner-sm" /> : <FileImage size={14} aria-hidden="true" />}
                {downloading ? ' Saving...' : ' Save Image'}
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
                <div className="card-status-pill status-active-premium" aria-label="Status: Active and Verified">
                  <div className="status-live-ring">
                    <span className="status-live-ring-inner" />
                    <span className="status-live-ring-outer" />
                  </div>
                  <span>ACTIVE & VERIFIED</span>
                  <SealCheck weight="fill" size={14} color="#10b981" />
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
                <p style={{ marginTop: '8px', fontWeight: 'bold' }}>
                  Kindly pay your 45.00 membership fee through your block representative, who will remit it to the SSC Office along with the payments of other block members.
                </p>
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

          {/* Correction Ticket Status Banner (Pending / Approved / Rejected) */}
          {latestTicket && latestTicket.id !== dismissedTicketId && (
            <div
              className={`ticket-status-banner ticket-status-${latestTicket.status}`}
              role="status"
            >
              <div className="ticket-status-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {latestTicket.status === 'pending' && <Clock size={16} />}
                  {latestTicket.status === 'approved' && <CheckCircle2 size={16} />}
                  {latestTicket.status === 'rejected' && <XCircle size={16} />}
                  <strong>
                    {latestTicket.status === 'pending' && 'Correction Ticket Pending Review'}
                    {latestTicket.status === 'approved' && 'Correction Ticket Approved'}
                    {latestTicket.status === 'rejected' && 'Correction Ticket Declined'}
                  </strong>
                </div>

                {latestTicket.status === 'pending' ? (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleCancelTicket(latestTicket.id)}
                    disabled={cancellingTicket}
                  >
                    {cancellingTicket ? 'Cancelling…' : 'Cancel Ticket'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDismissedTicketId(latestTicket.id)}
                  >
                    Dismiss
                  </button>
                )}
              </div>

              <p className="ticket-status-reason">
                <strong>Reason:</strong> {latestTicket.reason}
              </p>

              {ticketDiffs.length > 0 && (
                <div className="ticket-diff-list" style={{ marginTop: 8 }}>
                  {ticketDiffs.map((d) => (
                    <div key={d.key} className="ticket-diff-row">
                      <span className="ticket-diff-label">{d.label}:</span>
                      <span className="ticket-diff-before">{d.before}</span>
                      <ArrowRight size={12} className="ticket-diff-arrow" />
                      <span className="ticket-diff-after">{d.after}</span>
                    </div>
                  ))}
                </div>
              )}

              {latestTicket.status === 'approved' && latestTicket.newMembershipNumber && (
                <p className="ticket-status-note">
                  New Department Membership Number assigned:{' '}
                  <strong>{latestTicket.newMembershipNumber}</strong>
                </p>
              )}

              {latestTicket.status === 'rejected' && latestTicket.adminNotes && (
                <p className="ticket-status-note">
                  <strong>Officer Remarks:</strong> {latestTicket.adminNotes}
                </p>
              )}
            </div>
          )}

          {/* Submit a Correction Ticket CTA */}
          {member && (
            <div className="card-ticket-cta">
              <div className="card-ticket-cta-copy">
                <strong>Entered an error during registration?</strong>
                <span>
                  Submit a ticket to correct your Full Name, SR-Code, Department, Program, or Year Level.
                </span>
              </div>
              <button
                id="btn-open-ticket-modal"
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowTicketModal(true)}
                disabled={hasPendingTicket}
                title={
                  hasPendingTicket
                    ? 'You already have a pending ticket awaiting officer review'
                    : 'Submit a ticket to edit your registration details'
                }
              >
                <FileEdit size={14} />
                {hasPendingTicket ? 'Ticket Pending…' : 'Submit a Ticket'}
              </button>
            </div>
          )}
        </div>
      </div>

      <SubmitTicketModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        member={member}
        user={user}
        onSuccess={() =>
          toast('Correction ticket submitted! An officer will review your request.', 'success')
        }
      />
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
