const fs = require('fs');
let code = fs.readFileSync('src/data/partners.js', 'utf8');

code = code.replace(/purchase of.*?300/g, "purchase of ?300");

fs.writeFileSync('src/data/partners.js', code);
console.log('Fixed peso sign 4');
