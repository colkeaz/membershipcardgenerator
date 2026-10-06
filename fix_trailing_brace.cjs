const fs = require('fs');
let code = fs.readFileSync('src/components/MembershipCard.css', 'utf8');

code = code.replace(/}\n}\n*$/, '}\n');

fs.writeFileSync('src/components/MembershipCard.css', code);
console.log('Fixed dangling brace in MembershipCard.css');
