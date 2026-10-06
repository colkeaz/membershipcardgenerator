const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the typo in description
html = html.replace('Generator ?" Supreme', 'Generator - Supreme');

// 2. Add Open Graph tags right before <title>
const ogTags = `
    <!-- Open Graph / Social Media Meta Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://membershipcardgen.web.app/" />
    <meta property="og:title" content="SSC-AL | Membership Card Generator" />
    <meta property="og:description" content="Official digital membership card generator for the Supreme Student Council, Alangilan Campus, BatStateU." />
    <meta property="og:image" content="https://membershipcardgen.web.app/logo.jpg" />
    
    <!-- Fallback for Twitter -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="SSC-AL | Membership Card Generator" />
    <meta name="twitter:description" content="Official digital membership card generator for the Supreme Student Council, Alangilan Campus, BatStateU." />
    <meta name="twitter:image" content="https://membershipcardgen.web.app/logo.jpg" />
`;
html = html.replace('    <title>', ogTags + '\n    <title>');

// 3. Inject noscript and inline loading state inside <body>
// We'll replace <div id="root"></div> with the injected state
const loadingState = `<noscript>
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h2>JavaScript is Required</h2>
        <p>The SSC-AL Membership Card Generator requires JavaScript to function properly. Please enable JavaScript in your browser settings.</p>
      </div>
    </noscript>
    <div id="root">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#050505;color:#fff;font-family:sans-serif;">
        <style>
          @keyframes pulse { 0% { opacity: 0.5; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1); } 100% { opacity: 0.5; transform: scale(0.95); } }
          .inline-spinner { width: 48px; height: 48px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.1); border-top-color: #c8102e; animation: spin 1s linear infinite; margin-bottom: 24px; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .inline-logo { width: 64px; height: 64px; border-radius: 50%; margin-bottom: 24px; animation: pulse 2s ease-in-out infinite; box-shadow: 0 0 20px rgba(200, 16, 46, 0.4); }
        </style>
        <img src="/logo.jpg" alt="SSC-AL Logo" class="inline-logo" />
        <div class="inline-spinner"></div>
        <div style="font-size: 14px; font-weight: 600; letter-spacing: 0.05em; color: rgba(255,255,255,0.7);">LOADING SSC-AL PORTAL...</div>
      </div>
    </div>`;

html = html.replace('<div id="root"></div>', loadingState);

fs.writeFileSync('index.html', html);
console.log('Modified index.html');
