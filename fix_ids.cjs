const fs = require('fs');
let code = fs.readFileSync('src/data/partners.js', 'utf8');

code = code.replace(/"id": "232-caf-"/g, '"id": "232-cafe"');
code = code.replace(/"id": "-lan-pilates-studio"/g, '"id": "elan-pilates-studio"');

fs.writeFileSync('src/data/partners.js', code);
console.log('Fixed ids');
