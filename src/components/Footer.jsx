import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gift, CreditCard, ShieldCheck, Fingerprint } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const location = useLocation();

  // Hide the global footer on the verify page (standalone scanner UI)
  if (location.pathname === '/verify') return null;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="global-footer" role="contentinfo" aria-label="Site footer">
      <div className="global-footer-inner">
        {/* Top row */}
        <div className="global-footer-top">
          {/* Brand */}
          <Link to="/benefits" className="global-footer-brand" id="footer-brand">
            <img src="/logo.jpg" alt="SSC-AL" className="global-footer-logo" />
            <div className="global-footer-brand-text">
              <span className="global-footer-org">
                SSC<span className="global-footer-org-accent">-AL</span>
              </span>
              <span className="global-footer-campus">
                Batangas State University · Alangilan Campus
              </span>
            </div>
          </Link>

          {/* Link columns */}
          <div className="global-footer-links">
            <div className="global-footer-col">
              <span className="global-footer-col-title">Navigation</span>
              <Link to="/" className="global-footer-link" id="footer-home">
                Home
              </Link>
              <Link to="/benefits" className="global-footer-link" id="footer-benefits">
                <Gift size={13} /> Benefits
              </Link>
              <Link to="/card" className="global-footer-link" id="footer-card">
                <CreditCard size={13} /> My Card
              </Link>
            </div>

            <div className="global-footer-col">
              <span className="global-footer-col-title">About</span>
              <span className="global-footer-link" style={{ cursor: 'default' }}>
                Supreme Student Council
              </span>
              <span className="global-footer-link" style={{ cursor: 'default' }}>
                Alangilan Campus
              </span>
              <span className="global-footer-link" style={{ cursor: 'default' }}>
                BatStateU · TNEU
              </span>
            </div>
          </div>
        </div>

        {/* Gold divider */}
        <div className="global-footer-divider" aria-hidden="true" />

        {/* Bottom row */}
        <div className="global-footer-bottom">
          <span className="global-footer-copy">
            © {currentYear}{' '}
            <span className="global-footer-copy-highlight">SSC-AL</span>{' '}
            · Official Membership System · All rights reserved.
          </span>

          <div className="global-footer-badges">
            <span className="global-footer-badge">
              <ShieldCheck size={12} /> Data Privacy Compliant
            </span>
            <span className="global-footer-badge">
              <Fingerprint size={12} /> QR Verified
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
