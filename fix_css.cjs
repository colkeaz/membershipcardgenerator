const fs = require('fs');
let code = fs.readFileSync('src/components/MembershipCard.css', 'utf8');

code = code.replace(/@media \(min-width: 768px\) \{\s*\.card-scene \{\s*\}\s*\}/, '');

fs.writeFileSync('src/components/MembershipCard.css', code.trim() + '\n');
console.log('Fixed CSS syntax');
