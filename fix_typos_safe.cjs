const fs = require('fs');
let code = fs.readFileSync('src/data/partners.js', 'utf8');

// The file might contain some weird utf-8 characters. 

// Shakey's
code = code.replace(/Shakey\?Ts/g, "Shakey's");
code = code.replace(/Shakey\?Ts/g, "Shakey's");
code = code.replace(/Shakey.Ts/g, "Shakey's");

// Taco Joe's
code = code.replace(/Taco Joe\?Ts/g, "Taco Joe's");
code = code.replace(/Taco Joe\?Ts/g, "Taco Joe's");
code = code.replace(/Taco Joe.Ts/g, "Taco Joe's");

// Food Truck 
code = code.replace(/Food Truck \?" /g, "Food Truck - ");
code = code.replace(/Food Truck \?" /g, "Food Truck - ");
code = code.replace(/Food Truck .\? /g, "Food Truck - ");

// Pesos. The raw chars are like ,300 -> let's just match any non-word before digits if it's 300, 200, 500
code = code.replace(/,300/g, "?300");
code = code.replace(/,200/g, "?200");
code = code.replace(/,500/g, "?500");
code = code.replace(/,100/g, "?100");
code = code.replace(/,50/g, "?50");

// The regex fallback for money:
code = code.replace(/[^A-Za-z0-9\s:"]300 /g, "?300 ");
code = code.replace(/[^A-Za-z0-9\s:"]200\./g, "?200.");
code = code.replace(/[^A-Za-z0-9\s:"]500\./g, "?500.");

// Graden -> Garden
code = code.replace(/the_graden_cafe/g, "the_garden_cafe");
code = code.replace(/The Graden Cafe/g, "The Garden Cafe");

// Cafe
code = code.replace(/232 CafAc/g, "232 Café");

fs.writeFileSync('src/data/partners.js', code);
console.log('Fixed typos safely');
