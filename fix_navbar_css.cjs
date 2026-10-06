const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.css', 'utf8');

const mobileQueries = `@media (max-width: 640px) {
  .navbar-inner {
    padding: 0 12px 0 6px;
    gap: 8px;
  }
  .navbar-brand-copy { display: none; }
  .navbar-link {
    padding: 6px 10px;
    font-size: 0.75rem;
  }
  .navbar-links {
    gap: 2px;
    padding: 0 4px;
    overflow-x: auto;
    scrollbar-width: none; /* Firefox */
  }
  .navbar-links::-webkit-scrollbar {
    display: none; /* Safari/Chrome */
  }
  .navbar-user-name { display: none; }
  .navbar-logout-text { display: none; }
  .navbar-logout { padding: 8px; }
}`;

code = code.replace(/@media \(max-width: 640px\) \{[\s\S]*?\}/, mobileQueries);

fs.writeFileSync('src/components/Navbar.css', code);
console.log('Fixed Navbar.css');
