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
        <span className="site-footer-copy">
          © {currentYear} SSC-AL · Batangas State University · Alangilan Campus
        </span>
        <nav className="site-footer-links" aria-label="Footer navigation">
          <Link to="/benefits" className="site-footer-link">Benefits</Link>
          <span className="site-footer-sep" aria-hidden="true">·</span>
          <Link to="/office-registration" className="site-footer-link">Office Registration</Link>
          <span className="site-footer-sep" aria-hidden="true">·</span>
          <Link to="/partner-signup" className="site-footer-link">Partner Signup</Link>
        </nav>
      </div>
    </footer>
  );
}

