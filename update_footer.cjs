const fs = require('fs');
let code = fs.readFileSync('src/components/Footer.jsx', 'utf8');

const navLinks = `<nav className="site-footer-links" aria-label="Footer navigation">
            <Link to="/benefits" className="site-footer-link">Benefits</Link>
            <span className="site-footer-sep" aria-hidden="true">A</span>
            <Link to="/office-registration" className="site-footer-link">Office Registration</Link>
            <span className="site-footer-sep" aria-hidden="true">A</span>
            <Link to="/partner-signup" className="site-footer-link">Partner Signup</Link>
          </nav>
          
          <nav className="site-footer-legal" aria-label="Legal navigation" style={{ marginTop: '12px', display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
            <Link to="/privacy-policy" className="site-footer-link" style={{ color: 'var(--color-text-tertiary)' }}>Privacy Policy</Link>
            <span className="site-footer-sep" aria-hidden="true" style={{ color: 'var(--color-border)' }}>•</span>
            <Link to="/terms" className="site-footer-link" style={{ color: 'var(--color-text-tertiary)' }}>Terms & Conditions</Link>
          </nav>`;
          
code = code.replace(/<nav className="site-footer-links"[^>]*>[\s\S]*?<\/nav>/, navLinks);

fs.writeFileSync('src/components/Footer.jsx', code);
console.log('Updated Footer.jsx');
