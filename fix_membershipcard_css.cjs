const fs = require('fs');
let code = fs.readFileSync('src/components/MembershipCard.css', 'utf8');

// Replace the step-down media queries
const newCSS = `/* Precise step-down scaling for mobile */
@media (max-width: 440px) {
  .card-scene { 
    transform: scale(0.9); 
    margin-bottom: -26px;
    margin-left: -21px; 
    margin-right: -21px;
  }
}
@media (max-width: 400px) {
  .card-scene { 
    transform: scale(0.85); 
    margin-bottom: -40px;
    margin-left: -31px;
    margin-right: -31px;
  }
}
@media (max-width: 375px) {
  .card-scene { 
    transform: scale(0.78); 
    margin-bottom: -58px;
    margin-left: -46px;
    margin-right: -46px;
  }
}
@media (max-width: 340px) {
  .card-scene { 
    transform: scale(0.7); 
    margin-bottom: -79px;
    margin-left: -63px;
    margin-right: -63px;
  }
}`;

code = code.replace(/\/\* Precise step-down scaling for mobile \*\/[\s\S]*?@media \(max-width: 340px\) \{[\s\S]*?\}/, newCSS);

fs.writeFileSync('src/components/MembershipCard.css', code);
console.log('Fixed MembershipCard.css');
