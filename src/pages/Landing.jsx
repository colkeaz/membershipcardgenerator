import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MembershipCard from '../components/MembershipCard';
import { Chrome, ShieldCheck, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import './Landing.css';

import { DEMO_MEMBER, DEMO_QR_TEXT } from '../utils/constants';
import { isValidUniversityEmail } from '../utils/validators';

export default function Landing() {
  const { signInWithGoogle, logout, user, member, loading } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [demoQr, setDemoQr] = useState('');

  useEffect(() => {
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(DEMO_QR_TEXT, {
        width: 120, margin: 1,
        color: { dark: '#08080A', light: '#FFFFFF' },
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
          <div className="landing-badge">
            <img src="/ssc-seal.jpg" alt="SSC Seal" className="landing-badge-logo" />
            <span className="landing-badge-text">Supreme Student Council • Alangilan</span>
          </div>

          <div className="landing-header-group">
            <h1 className="landing-heading">
              Your Campus<br />
              <span className="title-red">Identity</span>, Upgraded.
            </h1>
          </div>

          <p className="landing-description">
            {user
              ? (member && member.status !== 'active'
                  ? 'Your digital membership card is pending verification. Please visit the SSC office to validate your active status.'
                  : 'Your official digital membership card is active. Access your credentials, verify partner perks, or download your card to your device.')
              : 'Unlock exclusive discounts, VIP perks, and instantly prove your student status at over 30 local establishments with the official SSC-AL Digital Membership Card.'}
          </p>

                    {user && !member && !isValidUniversityEmail(user.email) ? (
            <div className="landing-actions" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '0.9rem', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <strong>Access Denied:</strong> {user.email} is not a valid BatStateU email. Please sign in using your official @g.batstate-u.edu.ph account.
              </div>
              <button className="btn btn-outline" onClick={logout}>
                Sign out and try again
              </button>
            </div>
          ) : !user ? (
            <div className="landing-actions">
              <button
                id="btn-google-signin"
                className="btn btn-primary landing-cta-btn"
                onClick={handleSignIn}
                disabled={signingIn || loading}
                aria-label="Sign in with Google"
              >
                {signingIn
                  ? <><span className="spinner spinner-sm" /> Authenticating...</>
                  : <><Chrome size={18} aria-hidden="true" /> Continue with BatStateU Email</>}
              </button>
              
              <div className="landing-sublinks">
                <span className="landing-domain-pill">
                  Must use your <strong>@g.batstate-u.edu.ph</strong> account
                </span>
                <div className="landing-secondary-links">
                  <Link to="/benefits" className="landing-text-link">
                    Explore Partner Benefits <ArrowRight size={14} />
                  </Link>
                  <span className="landing-link-sep">•</span>
                  <Link to="/partner-signup" className="landing-text-link">
                    Partner with us
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="landing-actions">
              <button
                id="btn-goto-card"
                className="btn btn-primary landing-cta-btn"
                onClick={() => navigate(member ? '/card' : '/register')}
              >
                {member ? 'View My Card' : 'Complete Registration'} <ArrowRight size={18} />
              </button>
              <p className="landing-footnote">
                Signed in as <strong className="user-email-tag">{user.displayName || user.email}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Right: Floating Card */}
        <div className="landing-card-area animate-fade-up delay-1">
          <MembershipCard
            member={user && member ? member : DEMO_MEMBER}
            qrDataUrl={demoQr}
            autoFlip={!user && !(member && member.status !== 'active')}
            isPreview={!user || !member}
            isLocked={Boolean(user && member && member.status !== 'active')}
          />
        </div>
      </div>
    </main>
  );
}


