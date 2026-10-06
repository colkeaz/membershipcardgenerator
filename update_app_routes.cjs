const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const imports = `import PartnerSignup from './pages/PartnerSignup';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';`;
code = code.replace(/import PartnerSignup from '.\/pages\/PartnerSignup';/, imports);

const routes = `<Route path="/office-registration" element={<OfficeRegistration />} />
        <Route path="/manual-registration" element={<Navigate to="/office-registration" replace />} />
        
        {/* Legal Pages */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />`;
code = code.replace(/<Route path="\/office-registration" element=\{<OfficeRegistration \/>\} \/>\s*<Route path="\/manual-registration".*?\/>/, routes);

fs.writeFileSync('src/App.jsx', code);
console.log('Updated App.jsx with legal routes');
