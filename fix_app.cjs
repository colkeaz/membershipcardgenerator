const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(/<Route path="\/terms" element=\{<TermsOfService \/>\} \/>} \/>/, '<Route path="/terms" element={<TermsOfService />} />');

fs.writeFileSync('src/App.jsx', code);
console.log('Fixed App.jsx');
