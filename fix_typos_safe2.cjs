const fs = require('fs');
let code = fs.readFileSync('src/data/partners.js', 'utf8');

// Shakey's
code = code.replace(/Shakey.+?s/g, "Shakey's");
// Taco Joe's
code = code.replace(/Taco Joe.+?s/g, "Taco Joe's");
// Food Truck
code = code.replace(/Food Truck .+? KM 36 SLEX/g, "Food Truck - KM 36 SLEX");
code = code.replace(/Food Truck .+? Caltex Tanauan/g, "Food Truck - Caltex Tanauan");
// Cafe
code = code.replace(/232 Caf.{1,3}/g, "232 Café");
// Pesos
code = code.replace(/,300/g, "?300");
code = code.replace(/,200/g, "?200");
code = code.replace(/,500/g, "?500");
code = code.replace(/,100/g, "?100");
code = code.replace(/,50/g, "?50");

// Kwatogs Alangilan (min purchase 300)
code = code.replace(/purchase of .+?300/, "purchase of ?300");

fs.writeFileSync('src/data/partners.js', code);
console.log('Fixed typos safely 2');
