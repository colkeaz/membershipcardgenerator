const fs = require('fs');
let code = fs.readFileSync('functions/index.js', 'utf8');

const helpers = `
async function enforceRateLimit(identifier) {
  if (!identifier) return;
  const limitRef = admin.firestore().doc(\`rate_limits/\${identifier}\`);
  const snap = await limitRef.get();
  const now = Date.now();
  if (snap.exists) {
    const lastRequest = snap.data().lastRequest;
    if (now - lastRequest < 3000) { // 3 seconds
      throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait 3 seconds.');
    }
  }
  await limitRef.set({ lastRequest: now });
}
`;

code = code.replace(/function computeServerHmac/, helpers + '\nfunction computeServerHmac');

const appCheckStr = `
  if (context.app == undefined) {
    throw new functions.https.HttpsError('failed-precondition', 'App Check token is required.');
  }
`;

code = code.replace(
  /exports\.signCard = functions\.https\.onCall\(async \(data, context\) => \{/,
  `exports.signCard = functions.https.onCall(async (data, context) => {\n${appCheckStr}\n  await enforceRateLimit(context.auth?.uid);\n`
);

code = code.replace(
  /exports\.verifyMembership = functions\.https\.onCall\(async \(data\) => \{/,
  `exports.verifyMembership = functions.https.onCall(async (data, context) => {\n${appCheckStr}\n  await enforceRateLimit(context.auth?.uid || context.rawRequest?.ip || 'anonymous');\n`
);

fs.writeFileSync('functions/index.js', code);
console.log('Updated functions/index.js');
