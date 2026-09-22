import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MembershipCard from '../components/MembershipCard';
import { Chrome } from 'lucide-react';
import './Landing.css';

const DEMO_MEMBER = {
  fullName:         'JUAN DELA CRUZ',
  studentId:        '2024-00001',
  course:           'BS Computer Engineering',
  yearLevel:        '2nd Year',
  membershipNumber: 'SSC-AL-2025-00001',
  schoolYear:       '2025-2026',
  semester:         '1st Semester',
  status:           'active',
};

// A static demo QR (encodes a placeholder verify URL)
const DEMO_QR_TEXT = 'https://membershipcardgen.web.app/verify?preview=true';

export default function Landing() {
  const { signInWithGoogle, user, member, loading } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [demoQr,    setDemoQr]    = useState('');

  // Generate a demo QR for the preview card
  useEffect(() => {
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(DEMO_QR_TEXT, {
        width: 90, margin: 1,
        color: { dark: '#1a0000', light: '#fff8f0' },
      }).then(setDemoQr);
    });
  }, []);

  // Redirect if already signed in
  useEffect(() => {
    if (!loading && user) {
      navigate(member ? '/card' : '/register', { replace: true });
    }
  }, [loading, user, member, navigate]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try { await signInWithGoogle(); }
    catch { setSigningIn(false); }
  };

  if (loading || user) return null;

  return (
    <main className="landing">
      {/* Ambient background glows */}
      <div className="landing-glow landing-glow-1" aria-hidden="true" />
      <div className="landing-glow landing-glow-2" aria-hidden="true" />

      <div className="landing-inner">
        {/* Header */}
        <header className="landing-header">
          <img src="/logo.jpg" alt="SSC-AL Logo" className="landing-logo" />
          <div className="landing-org">
            <span className="landing-org-name">SUPREME STUDENT COUNCIL</span>
            <span className="landing-org-campus">Alangilan Campus · Batangas State University</span>
          </div>
        </header>

        {/* Title */}
        <div className="landing-title-group">
          <h1 className="landing-title">
            Digital Membership<br />
            <span className="text-gradient">Card Generator</span>
          </h1>
          <p className="landing-sub">
            Sign in to generate and download your official SSC-AL membership card.
          </p>
        </div>

        {/* Preview flip card */}
        <div className="landing-card-preview">
          <MembershipCard
            member={DEMO_MEMBER}
            qrDataUrl={demoQr}
            autoFlip
            isPreview
          />
        </div>

        {/* Sign in */}
        <button
          id="btn-google-signin"
          className="btn btn-gold btn-lg landing-signin-btn"
          onClick={handleSignIn}
          disabled={signingIn || loading}
          aria-label="Sign in with Google"
        >
          {signingIn
            ? <><span className="spinner spinner-sm" /> Signing in…</>
            : <><Chrome size={20} /> Continue with Google</>}
        </button>

        <p className="landing-hint">Use your Google account to register</p>

        {/* Footer */}
        <footer className="landing-footer">
          <span>BatStateU · Alangilan Campus · SSC-AL</span>
          <span>·</span>
          <span>Official Membership System</span>
        </footer>
      </div>
    </main>
  );
}
