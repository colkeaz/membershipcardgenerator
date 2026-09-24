import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MembershipCard from '../components/MembershipCard';
import { Chrome } from 'lucide-react';
import './Landing.css';

const DEMO_MEMBER = {
  fullName: 'JUAN DELA CRUZ',
  studentId: '2024-00001',
  course: 'BS Computer Engineering',
  yearLevel: '2nd Year',
  membershipNumber: 'SSC-AL-2025-00001',
  schoolYear: '2025-2026',
  semester: '1st Semester',
  status: 'active',
};

// A static demo QR (encodes a placeholder verify URL)
const DEMO_QR_TEXT = 'https://membershipcardgen.web.app/verify?preview=true';

export default function Landing() {
  const { signInWithGoogle, user, member, loading } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [demoQr, setDemoQr] = useState('');

  // Generate a demo QR for the preview card
  useEffect(() => {
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(DEMO_QR_TEXT, {
        width: 90, margin: 1,
        color: { dark: '#1a0000', light: '#fff8f0' },
      }).then(setDemoQr);
    });
  }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      navigate('/card');
    } catch {
      // User cancelled or closed sign-in popup
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) return null;

  return (
    <main className="landing">
      {/* Ambient background glows */}
      <div className="landing-glow landing-glow-1" aria-hidden="true" />
      <div className="landing-glow landing-glow-2" aria-hidden="true" />

      <div className="landing-inner">
        {/* Header - shown only when not signed in (when signed in, top Navbar is present) */}
        {!user && (
          <header className="landing-header">
            <Link to="/benefits" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <img src="/logo.jpg" alt="SSC-AL Logo" className="landing-logo" />
              <div className="landing-org">
                <span className="landing-org-name">SUPREME STUDENT COUNCIL</span>
                <span className="landing-org-campus">Alangilan Campus · Batangas State University</span>
              </div>
            </Link>
          </header>
        )}

        {/* Title */}
        <div className="landing-title-group">
          <h1 className="landing-title">
            Digital Membership<br />
            <span className="text-gradient">Card</span>
          </h1>
          <p className="landing-sub">
            {user
              ? 'Preview your digital membership card below or open your card from the navigation.'
              : 'Sign in to generate and download your official SSC-AL membership card.'}
          </p>
        </div>

        {/* Preview flip card */}
        <div className="landing-card-preview">
          <MembershipCard
            member={user && member ? member : DEMO_MEMBER}
            qrDataUrl={demoQr}
            autoFlip={!user}
            isPreview={!user || !member}
          />
        </div>

        {/* Actions */}
        {!user ? (
          <>
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
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <button
              id="btn-goto-card"
              className="btn btn-gold btn-lg landing-signin-btn"
              onClick={() => navigate(member ? '/card' : '/register')}
            >
              {member ? 'View My Card →' : 'Complete Registration →'}
            </button>
            <p className="landing-hint">You are signed in as {user.displayName || user.email}</p>
          </div>
        )}


      </div>
    </main>
  );
}
