const fs = require('fs');
let code = fs.readFileSync('src/pages/Landing.css', 'utf8');

code = code.replace(/\.landing-card-shelf \{\s*width: 400px;/, '.landing-card-shelf {\n  width: 100%;\n  max-width: 400px;');

fs.writeFileSync('src/pages/Landing.css', code);
console.log('Fixed Landing.css');
