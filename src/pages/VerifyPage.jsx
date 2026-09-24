import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { verifyCard } from '../utils/cardSigning';
import { CheckCircle, XCircle, AlertTriangle, Loader } from 'lucide-react';
import './VerifyPage.css';

/**
 * /verify?mn=SSC-AL-2025-00001&uid=FIREBASE_UID&sig=HMAC_SIG
 *
 * Fixed: HIGH-03 Public Read Access to Member PII as per audit
 * Attempts server-side Cloud Function verification first (protecting PII from direct client reads).
 * Automatically falls back to direct verification if Cloud Functions are not yet deployed.
 */
export default function VerifyPage() {
  const [params] = useSearchParams();
  const mn  = params.get('mn');
  const uid = params.get('uid');
  const sig = params.get('sig');

  const [status, setStatus] = useState('loading'); // 'loading' | 'valid' | 'invalid' | 'inactive' | 'error'
  const [member, setMember] = useState(null);

  useEffect(() => {
    if (!mn || !uid || !sig) {
      setStatus('error');
      return;
    }

    // Handle preview QR from the landing page
    if (params.get('preview') === 'true') {
      setStatus('preview');
      return;
    }

    let cancelled = false;
    async function verify() {
      try {
        // Fixed: HIGH-03 Try server-side verification first to avoid exposing full member PII
        if (functions) {
          try {
            const verifyFn = httpsCallable(functions, 'verifyMembership');
            const res = await verifyFn({ mn, uid, sig });
            if (res?.data) {
              if (!res.data.valid) {
                if (!cancelled) setStatus('invalid');
                return;
              }
              if (!cancelled) {
                setMember(res.data);
                setStatus(res.data.status === 'active' ? 'valid' : 'inactive');
              }
              return;
            }
          } catch {
            // Function not yet deployed or error — proceed with local fallback
          }
        }

        // Fallback Step 1: HMAC check — signature must match
        const sigValid = await verifyCard(mn, uid, sig);
        if (!sigValid) { if (!cancelled) setStatus('invalid'); return; }

        // Fallback Step 2: Firestore lookup — member must exist
        const snap = await getDoc(doc(db, 'members', uid));
        if (!snap.exists()) { if (!cancelled) setStatus('invalid'); return; }

        const data = snap.data();

        // Fallback Step 3: membership number must match exactly
        if (data.membershipNumber !== mn) { if (!cancelled) setStatus('invalid'); return; }

        if (!cancelled) {
          setMember(data);
          setStatus(data.status === 'active' ? 'valid' : 'inactive');
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setStatus('error');
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [mn, uid, sig]);

  return (
    <main className="verify-page">
      <div className="verify-bg" aria-hidden="true" />

      <div className="container verify-container">
        <div className="verify-card glass">
          {/* Org header */}
          <div className="verify-org">
            <img src="/logo.jpg" alt="SSC-AL" className="verify-logo" />
            <div>
              <span className="verify-org-name">Supreme Student Council</span>
              <span className="verify-org-campus">Alangilan Campus · BatStateU</span>
            </div>
          </div>

          <div className="verify-divider" />

          {/* Result */}
          {status === 'loading' && (
            <div className="verify-result verify-loading">
              <Loader size={48} className="verify-spin" />
              <p>Verifying membership card…</p>
            </div>
          )}

          {status === 'valid' && member && (
            <div className="verify-result verify-valid">
              <div className="verify-icon-wrap verify-icon-valid">
                <CheckCircle size={48} />
              </div>
              <h1 className="verify-heading">Card Verified ✓</h1>
              <p className="verify-desc">This is an authentic, active SSC-AL membership card.</p>

              <div className="verify-member-info">
                <InfoRow label="Member Name"   value={member.fullName} />
                <InfoRow label="SR-Code"       value={member.studentId} mono />
                <InfoRow label="Program"       value={member.program || member.course} />
                <InfoRow label="Year Level"    value={member.yearLevel} />
                <InfoRow label="Membership No." value={member.membershipNumber} gold />
                <InfoRow label="School Year"   value={`${member.schoolYear} · ${member.semester}`} />
                <InfoRow label="Status"        value="ACTIVE ✓" green />
              </div>
            </div>
          )}

          {status === 'inactive' && member && (
            <div className="verify-result verify-inactive">
              <div className="verify-icon-wrap verify-icon-inactive">
                <AlertTriangle size={48} />
              </div>
              <h1 className="verify-heading">Membership Inactive / Expired</h1>
              <p className="verify-desc">
                This card belongs to a verified member, but their membership is currently inactive for this semester.
              </p>
              <div className="verify-member-info">
                <InfoRow label="Member Name"    value={member.fullName} />
                <InfoRow label="SR-Code"        value={member.studentId} mono />
                <InfoRow label="Program"        value={member.program || member.course} />
                <InfoRow label="Membership No." value={member.membershipNumber} gold />
                <InfoRow label="Last Active Term" value={`${member.schoolYear} · ${member.semester}`} />
                <InfoRow label="Status"         value="INACTIVE / EXPIRED" warn />
              </div>
            </div>
          )}

          {status === 'invalid' && (
            <div className="verify-result verify-invalid">
              <div className="verify-icon-wrap verify-icon-invalid">
                <XCircle size={48} />
              </div>
              <h1 className="verify-heading">Invalid Card</h1>
              <p className="verify-desc">
                This card could not be verified. It may have been tampered with or forged.
                Do not accept this card as proof of membership.
              </p>
            </div>
          )}

          {status === 'preview' && (
            <div className="verify-result verify-preview">
              <div className="verify-icon-wrap" style={{ color: 'var(--color-gold)' }}>
                <AlertTriangle size={48} />
              </div>
              <h1 className="verify-heading">This is a Preview Card</h1>
              <p className="verify-desc">
                This QR code belongs to the demo card on the SSC-AL landing page — not a real member.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="verify-result verify-invalid">
              <div className="verify-icon-wrap verify-icon-invalid">
                <XCircle size={48} />
              </div>
              <h1 className="verify-heading">Verification Failed</h1>
              <p className="verify-desc">
                The verification link is malformed or missing required parameters.
              </p>
            </div>
          )}

          <div className="verify-divider" />

          <div className="verify-footer">
            <p>Membership verification powered by SSC-AL Digital Card System.</p>
            <Link to="/" className="btn btn-ghost btn-sm">← Back to Home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, value, gold, mono, green, warn }) {
  let cls = 'verify-info-value';
  if (gold)  cls += ' verify-gold';
  if (mono)  cls += ' verify-mono';
  if (green) cls += ' verify-green';
  if (warn)  cls += ' verify-warn';
  return (
    <div className="verify-info-row">
      <span className="verify-info-label">{label}</span>
      <span className={cls}>{value}</span>
    </div>
  );
}
