const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

code = code.replace(/body \{/, `html, body {\n  max-width: 100vw;\n  overflow-x: hidden;\n  -webkit-text-size-adjust: 100%;\n}\n\nbody {`);
code = code.replace(/#root \{[\s\S]*?\}/, `#root {\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  max-width: 100vw;\n  overflow-x: hidden;\n}`);

fs.writeFileSync('src/index.css', code);
console.log('Fixed index.css');
