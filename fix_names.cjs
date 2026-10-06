const fs = require('fs');
let code = fs.readFileSync('src/data/partners.js', 'utf8');

code = code.replace(/"name": "Appleville"/g, '"name": "AppleVille"');
code = code.replace(/"name": "Floof&Fiction"/g, '"name": "Floof & Fiction"');

fs.writeFileSync('src/data/partners.js', code);
console.log('Fixed additional names');
