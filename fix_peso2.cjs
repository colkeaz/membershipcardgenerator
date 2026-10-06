const fs = require('fs');
let code = fs.readFileSync('src/data/partners.js', 'utf8');

code = code.replace(/A minimum purchase of [^0-9]*?300 in a single receipt is required/g, "A minimum purchase of ?300 in a single receipt is required");

fs.writeFileSync('src/data/partners.js', code);
console.log('Fixed peso sign 2');
