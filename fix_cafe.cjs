const fs = require('fs');
let code = fs.readFileSync('src/data/partners.js', 'utf8');

// The line currently says: "name": "232 Caf
// Let's just fix it by replacing the whole line. We know it should be "name": "232 Cafe",
// Since there's a bad control char, let's use regex with \n
code = code.replace(/"name": "232 Caf[^\n]*/, '"name": "232 Cafe",');

fs.writeFileSync('src/data/partners.js', code);
console.log('Fixed 232 Cafe');
