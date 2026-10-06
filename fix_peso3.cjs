const fs = require('fs');
let code = fs.readFileSync('src/data/partners.js', 'utf8');

code = code.replace(/\?300/g, "?300");

fs.writeFileSync('src/data/partners.js', code);
console.log('Fixed peso sign 3');
