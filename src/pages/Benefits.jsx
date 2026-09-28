import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MembershipCard from '../components/MembershipCard';
import {
  Chrome,
  CreditCard,
  CalendarHeart,
  BadgePercent,
  Users,
  Award,
  BookOpenCheck,
  Gift,
  CheckCircle2,
  ArrowRight,
  Star,
  Sparkles,
} from 'lucide-react';
import './Benefits.css';

/* ─── Demo member for the card preview ─── */
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

/* ─── Perks data ─── */
const PERKS = [
  {
    icon: CreditCard,
    label: 'Official ID',
    title: 'Digital Membership Card',
    desc: 'Get your official SSC-AL digital membership card complete with QR verification, EMV chip design, and a unique membership number — downloadable and shareable.',
    bullets: [
      'QR code for instant verification',
      'Unique membership number',
      'Downloadable as PNG/PDF',
    ],
    iconStyle: 'icon-gold',
  },
  {
    icon: CalendarHeart,
    label: 'Exclusive Access',
    title: 'Events & Activities',
    desc: 'Enjoy priority access to SSC-AL organized events, seminars, workshops, and campus activities. Members get early-bird registration and reserved slots.',
    bullets: [
      'Priority event registration',
      'Reserved seats at seminars',
      'Exclusive member-only socials',
    ],
    iconStyle: 'icon-red',
  },
  {
    icon: BadgePercent,
    label: 'Savings',
    title: 'Student Discounts & Partnerships',
    desc: 'Take advantage of exclusive discount partnerships with local businesses, food establishments, and campus services available only to SSC-AL members.',
    bullets: [
      'Partner store discounts',
      'Campus service perks',
      'Seasonal promo offers',
    ],
    iconStyle: 'icon-mixed',
  },
  {
    icon: Users,
    label: 'Community',
    title: 'Network & Connect',
    desc: 'Join a vibrant community of student leaders, creatives, and engineers across the BatStateU Alangilan campus. Build connections that last beyond university.',
    bullets: [
      'Access member directory',
      'Join interest-based groups',
      'Attend networking mixers',
    ],
    iconStyle: 'icon-gold',
  },
  {
    icon: Award,
    label: 'Leadership',
    title: 'Leadership Opportunities',
    desc: 'Open doors to committee roles, project leads, and officer positions. Your membership is your gateway to shaping student governance.',
    bullets: [
      'Committee membership eligibility',
      'Student governance participation',
      'Certificate of involvement',
    ],
    iconStyle: 'icon-red',
  },
  {
    icon: BookOpenCheck,
    label: 'Academics',
    title: 'Academic Support',
    desc: 'Access peer tutoring programs, study groups, and academic resource channels curated by fellow SSC-AL members and officers.',
    bullets: [
      'Peer tutoring sessions',
      'Shared study resources',
      'Academic mentorship program',
    ],
    iconStyle: 'icon-mixed',
  },
];

/* ─── Stats for the highlight strip ─── */
const STATS = [
  { number: '500+', label: 'Active Members' },
  { number: '10+', label: 'Partner Discounts' },
  { number: '20+', label: 'Events Per Year' },
  { number: '100%', label: 'Digital & Verified' },
];

/* ─── Intersection Observer hook ─── */
function useIntersection(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

/* ═══════════════════════════════════════════════
   BENEFITS PAGE COMPONENT
   ═══════════════════════════════════════════════ */
export default function Benefits() {
  const { user, member, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [signingIn, setSigningIn] = useState(false);
  const [demoQr, setDemoQr] = useState('');

  // Generate a demo QR for the preview card
  useEffect(() => {
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(DEMO_QR_TEXT, {
        width: 90,
        margin: 1,
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

  // Intersection observers for scroll animations
  const [statsRef, statsVisible] = useIntersection();
  const [ctaRef, ctaVisible] = useIntersection();

  if (loading) return null;

  return (
    <main className="benefits">
      {/* Ambient background glows */}
      <div className="benefits-glow benefits-glow-1" aria-hidden="true" />
      <div className="benefits-glow benefits-glow-2" aria-hidden="true" />
      <div className="benefits-glow benefits-glow-3" aria-hidden="true" />

      <div className="benefits-content">
        {/* Top bar for unauthenticated users */}
        {!user && (
          <header className="benefits-topbar">
            <Link to="/benefits" className="benefits-topbar-brand" id="benefits-brand">
              <img src="/logo.jpg" alt="SSC-AL" className="benefits-topbar-logo" />
              <span className="benefits-topbar-name">
                SSC<span className="benefits-topbar-accent">-AL</span>
              </span>
            </Link>
            <nav className="benefits-topbar-nav">
              <Link
                to="/"
                className={`benefits-topbar-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                <CreditCard size={16} />
                <span>Home</span>
              </Link>
              <Link
                to="/benefits"
                className={`benefits-topbar-link ${location.pathname === '/benefits' ? 'active' : ''}`}
              >
                <Gift size={16} />
                <span>Benefits</span>
              </Link>
            </nav>
          </header>
        )}

        {/* ════════ HERO ════════ */}
        <section className="benefits-hero" id="benefits-hero">
          <div className="benefits-hero-text">
            <div className="benefits-hero-badge">
              <span className="badge-dot" />
              SSC-AL Membership
            </div>
            <h1 className="benefits-hero-title">
              Unlock Your{' '}
              <span className="text-gradient">Membership</span>{' '}
              Benefits
            </h1>
            <p className="benefits-hero-sub">
              Your SSC-AL membership card is more than an ID — it's your key to
              exclusive events, discounts, leadership opportunities, and a
              thriving student community.
            </p>
            <div className="benefits-hero-cta">
              {!user ? (
                <button
                  id="btn-hero-signin"
                  className="btn btn-gold btn-lg"
                  onClick={handleSignIn}
                  disabled={signingIn || loading}
                  aria-label="Sign in with Google"
                >
                  {signingIn ? (
                    <>
                      <span className="spinner spinner-sm" /> Signing in…
                    </>
                  ) : (
                    <>
                      <Chrome size={20} /> Get Your Card
                    </>
                  )}
                </button>
              ) : (
                <button
                  id="btn-hero-card"
                  className="btn btn-gold btn-lg"
                  onClick={() => navigate(member ? '/card' : '/register')}
                >
                  {member ? 'View My Card' : 'Complete Registration'}{' '}
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="benefits-hero-card">
            <MembershipCard
              member={user && member ? member : DEMO_MEMBER}
              qrDataUrl={demoQr}
              autoFlip
              isPreview={!user || !member}
            />
          </div>
        </section>

        {/* ════════ ALTERNATING PERKS ════════ */}
        <section className="benefits-perks" aria-label="Membership Perks">
          {PERKS.map((perk, i) => (
            <PerkSection key={perk.title} perk={perk} reverse={i % 2 !== 0} delay={i * 80} />
          ))}
        </section>

        {/* ════════ STATS HIGHLIGHT STRIP ════════ */}
        <section className="benefits-stats" ref={statsRef} aria-label="Membership Statistics">
          <div className="benefits-stats-inner">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className={`stat-item ${statsVisible ? 'is-visible' : ''}`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <span className="stat-number">{stat.number}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ════════ CTA SECTION ════════ */}
        <section className="benefits-cta-section">
          <div
            className={`benefits-cta-card ${ctaVisible ? 'is-visible' : ''}`}
            ref={ctaRef}
          >
            <div className="benefits-cta-icon">
              <Sparkles size={28} />
            </div>
            <h2 className="benefits-cta-title">
              {user ? 'Your Benefits Await' : 'Ready to Join?'}
            </h2>
            <p className="benefits-cta-desc">
              {user
                ? 'Access all your exclusive membership perks. View your digital card or complete your registration.'
                : 'Sign in with your Google account to register as an SSC-AL member and unlock all these benefits.'}
            </p>
            {!user ? (
              <button
                id="btn-cta-signin"
                className="btn btn-gold btn-lg"
                onClick={handleSignIn}
                disabled={signingIn}
                aria-label="Sign in with Google"
              >
                {signingIn ? (
                  <>
                    <span className="spinner spinner-sm" /> Signing in…
                  </>
                ) : (
                  <>
                    <Chrome size={20} /> Continue with Google
                  </>
                )}
              </button>
            ) : (
              <button
                id="btn-cta-card"
                className="btn btn-gold btn-lg"
                onClick={() => navigate(member ? '/card' : '/register')}
              >
                {member ? 'View My Card' : 'Complete Registration'}{' '}
                <ArrowRight size={18} />
              </button>
            )}
            {!user && (
              <p className="benefits-cta-hint">
                Use your Google account to register
              </p>
            )}
            {user && (
              <p className="benefits-cta-hint">
                Signed in as {user.displayName || user.email}
              </p>
            )}
          </div>
        </section>


      </div>
    </main>
  );
}

/* ─── Individual Perk Section with scroll animation ─── */
function PerkSection({ perk, reverse, delay }) {
  const [ref, isVisible] = useIntersection();
  const Icon = perk.icon;

  return (
    <div
      ref={ref}
      className={`benefits-section ${reverse ? 'reverse' : ''} ${isVisible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`benefits-section-icon ${perk.iconStyle}`}>
        <Icon size={44} strokeWidth={1.5} />
      </div>

      <div className="benefits-section-text">
        <p className="benefits-section-label">{perk.label}</p>
        <h3 className="benefits-section-title">{perk.title}</h3>
        <p className="benefits-section-desc">{perk.desc}</p>
        <ul className="benefits-section-list">
          {perk.bullets.map((b) => (
            <li key={b}>
              <CheckCircle2 size={16} className="list-icon" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
