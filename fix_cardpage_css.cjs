const fs = require('fs');
let code = fs.readFileSync('src/pages/CardPage.css', 'utf8');

code = code.replace(/\.card-skeleton \{\s*width: 420px;\s*height: 265px;/, '.card-skeleton {\n  width: 100%;\n  max-width: 420px;\n  aspect-ratio: 420 / 265;');

// Also fix .export-offscreen .card-face if needed
code = code.replace(/\.export-offscreen \.card-face \{\s*position: relative !important;\s*transform: none !important;\s*width: 420px;\s*height: 265px;\s*\}/, '.export-offscreen .card-face {\n  position: relative !important;\n  transform: none !important;\n  width: 420px;\n  height: 265px;\n}');

fs.writeFileSync('src/pages/CardPage.css', code);
console.log('Fixed CardPage.css');
