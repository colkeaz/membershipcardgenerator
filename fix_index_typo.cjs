const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/Generator [^\w]* Supreme/, 'Generator - Supreme');

fs.writeFileSync('index.html', html);
console.log('Fixed typo in description');
