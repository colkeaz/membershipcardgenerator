const fs = require('fs');
let code = fs.readFileSync('src/data/partners.js', 'utf8');

// The file might contain some weird utf-8 characters. 
// Shakey's
code = code.replace(/Shakey(?:\?T|\?T|\?)s/g, "Shakey's");
// Taco Joe's
code = code.replace(/Taco Joe(?:\?T|\?T|\?)s/g, "Taco Joe's");
// Food Truck - 
code = code.replace(/Food Truck (?:\?"|\?") /g, "Food Truck - ");
// Peso sign
code = code.replace(/,/g, "?");
// Graden -> Garden
code = code.replace(/the_graden_cafe/g, "the_garden_cafe");
code = code.replace(/The Graden Cafe/g, "The Garden Cafe");
// Cafe
code = code.replace(/232 CafAc/g, "232 Café");

// Just in case the exact bytes were lost in powershell cat, let's use broad replacements.
code = code.replace(/Shakey[^\w]s/g, "Shakey's");
code = code.replace(/Taco Joe[^\w]s/g, "Taco Joe's");
code = code.replace(/Food Truck [^\w] /g, "Food Truck - ");
// We know that ,300 or ,200 or ,500 are preceded by some garbled chars.
code = code.replace(/[^\w\s\.,]300/g, "?300");
code = code.replace(/[^\w\s\.,]200/g, "?200");
code = code.replace(/[^\w\s\.,]500/g, "?500");
code = code.replace(/[^\w\s\.,]100/g, "?100");
code = code.replace(/[^\w\s\.,]50/g, "?50");

fs.writeFileSync('src/data/partners.js', code);
console.log('Fixed typos in partners.js');
