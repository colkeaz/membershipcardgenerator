const fs = require('fs');
let code = fs.readFileSync('src/components/MembershipCard.css', 'utf8');

const newCSS = `/* Responsive Scaling */
.card-scene {
  perspective: 1200px;
  -webkit-perspective: 1200px;
  width: 420px;
  height: 265px;
  cursor: pointer;
  outline: none;
  transform-origin: top center;
  -webkit-transform-origin: top center;
  transition: transform 0.2s ease, margin 0.2s ease;
  margin: 0 auto;
}

.card-scene:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 6px;
  border-radius: 22px;
}

/* Precise step-down scaling for mobile */
@media (max-width: 440px) {
  .card-scene { transform: scale(0.9); margin-bottom: -26px; }
}
@media (max-width: 400px) {
  .card-scene { transform: scale(0.85); margin-bottom: -40px; }
}
@media (max-width: 375px) {
  .card-scene { transform: scale(0.78); margin-bottom: -58px; }
}
@media (max-width: 340px) {
  .card-scene { transform: scale(0.7); margin-bottom: -79px; }
}

@media (min-width: 768px) {
  .card-scene {
`;

code = code.replace(/\/\* \?\?\? Responsive \(Mobile First Scaling\) \?\?\? \*\/[\s\S]*?@media \(min-width: 768px\) \{/m, newCSS);

// Actually, powershell might have mangled the emojis in the comment '"?"?"? Responsive'. 
// Let's use a broader regex.
code = code.replace(/\/\*.*?Responsive.*?Scaling.*?\*\/[\s\S]*?@media \(min-width: 768px\) \{\s*\.card-scene \{[\s\S]*?\}/m, newCSS + "}\n");

fs.writeFileSync('src/components/MembershipCard.css', code);
console.log('Updated MembershipCard.css');
