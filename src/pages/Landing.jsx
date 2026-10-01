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

const DEMO_QR_TEXT = 'https://membershipcardgen.web.app/verify?preview=true';

export default function Landing() {
  const { signInWithGoogle, user, member, loading } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [demoQr, setDemoQr] = useState('');

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
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        console.error('Google sign-in error:', err);
        alert(err?.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) return null;

  return (
    <main className="landing">
      <div className="container landing-container">
        {/* Left: Content */}
        <div className="landing-content animate-fade-up">
          {!user && (
            <div className="landing-badge">
              <img src="/logo.jpg" alt="" className="landing-badge-logo" />
              <span>Supreme Student Council · Alangilan</span>
            </div>
          )}

          <h1 className="landing-heading">
            Digital Membership<br />
            Card System
          </h1>

          <p className="landing-description">
            {user
              ? 'Your digital membership card is ready. View or download it from the navigation.'
              : 'Sign in with your BatStateU Google account to generate your official SSC-AL membership card.'}
          </p>

          {!user ? (
            <div className="landing-actions">
              <button
                id="btn-google-signin"
                className="btn btn-gold btn-lg"
                onClick={handleSignIn}
                disabled={signingIn || loading}
                aria-label="Sign in with Google"
              >
                {signingIn
                  ? <><span className="spinner spinner-sm" /> Signing in…</>
                  : <><Chrome size={18} aria-hidden="true" /> Continue with Google</>}
              </button>
              <p className="landing-footnote">
                Use your <strong>@g.batstate-u.edu.ph</strong> account
              </p>
              <p className="landing-footnote">
                Business Partner? <a href="/partner-signup">Apply here →</a>
              </p>
            </div>
          ) : (
            <div className="landing-actions">
              <button
                id="btn-goto-card"
                className="btn btn-gold btn-lg"
                onClick={() => navigate(member ? '/card' : '/register')}
              >
                {member ? 'View My Card →' : 'Complete Registration →'}
              </button>
              <p className="landing-footnote">
                Signed in as {user.displayName || user.email}
              </p>
            </div>
          )}
        </div>

        {/* Right: Card preview */}
        <div className="landing-card-area animate-fade-up delay-1">
          <MembershipCard
            member={user && member ? member : DEMO_MEMBER}
            qrDataUrl={demoQr}
            autoFlip={!user}
            isPreview={!user || !member}
          />
        </div>
      </div>
    </main>
  );
}

