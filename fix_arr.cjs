const fs = require('fs');
let code = fs.readFileSync('src/data/partners.js', 'utf8');

// I will match `of ` followed by ANYTHING followed by `300 in a single receipt`
code = code.replace(/of [^0-9a-zA-Z]+?300 in a single receipt/g, "of ?300 in a single receipt");

fs.writeFileSync('src/data/partners.js', code);
console.log('Fixed array');
