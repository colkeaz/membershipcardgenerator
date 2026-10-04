import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const location = useLocation();

  // Hide the global footer on the verify page (standalone scanner UI)
  if (location.pathname === '/verify') return null;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo" aria-label="Site footer">
      <div className="container site-footer-inner">
        <div className="site-footer-brand">
          <img src="/ssc-seal.jpg" alt="" className="footer-seal" />
          <span className="site-footer-copy">
            © {currentYear} Supreme Student Council · Batangas State University, The National Engineering University · Alangilan Campus
          </span>
        </div>
        
        <div className="site-footer-right">
          <div className="site-footer-status">
            <span className="footer-status-dot" />
            <span className="footer-status-text">ISO/IEC 7810 Verified</span>
          </div>

          <nav className="site-footer-links" aria-label="Footer navigation">
            <Link to="/benefits" className="site-footer-link">Benefits</Link>
            <span className="site-footer-sep" aria-hidden="true">·</span>
            <Link to="/office-registration" className="site-footer-link">Office Registration</Link>
            <span className="site-footer-sep" aria-hidden="true">·</span>
            <Link to="/partner-signup" className="site-footer-link">Partner Signup</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

