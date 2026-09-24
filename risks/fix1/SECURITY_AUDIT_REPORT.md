# 🔒 Security Audit Report — SSC-AL Membership Card Generator

**Date:** September 24, 2026  
**Auditor:** Antigravity AI Security Review  
**Scope:** Full codebase — client-side React app, Firebase configuration, Firestore security rules, utility modules  
**Repository:** `membershipcardgenerator`

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 **Critical** | 2 |
| 🟠 **High** | 3 |
| 🟡 **Medium** | 3 |
| 🔵 **Low** | 1 |
| ⚪ **Informational** | 1 |

The most urgent issues are **committed secrets in Git history** and the **HMAC signing secret exposed to the client**, which together allow any user to forge membership card QR codes.

---

## Findings

---

### 🔴 CRIT-01 · `.env` file with secrets committed to Git

**Severity:** Critical  
**Affected file:** `.env` · `.gitignore`

#### Vulnerability

The `.env` file containing the Firebase API key, project IDs, and — critically — the **HMAC signing secret** (`VITE_CARD_HMAC_SECRET`) is tracked by Git and was committed in the initial commit. The `.gitignore` does **not** list `.env`, so it has been pushed to version control with every commit.

```
# Initial .gitignore — notice .env is MISSING
node_modules/
dist/
.firebase/
```

#### Attack Vector

Anyone with read access to the repository (collaborators, forks, GitHub if public) can extract:
- Firebase project identifiers (enabling API abuse)
- The HMAC secret used to sign membership cards (enabling card forgery)

Even if `.env` is added to `.gitignore` now, the secret remains in Git history permanently unless rewritten.

#### Remediation

**Step 1:** Add `.env` to `.gitignore` immediately:
```diff
 node_modules/
 dist/
 .firebase/
+.env
+.env.local
+.env.*.local
```

**Step 2:** Remove `.env` from Git tracking (without deleting the local file):
```bash
git rm --cached .env
git commit -m "chore: stop tracking .env — contains secrets"
```

**Step 3:** **Rotate all secrets.** The committed values are burned:
- Generate a new `VITE_CARD_HMAC_SECRET` (and see CRIT-02 for where it should actually live)
- Regenerate the Firebase API key in the Firebase Console → Project Settings → API Keys
- Consider using [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) to purge the old `.env` from all Git history

**Step 4:** Add `.env.example` to version control (which you already have — good) and ensure it contains only placeholder values.

---

### 🔴 CRIT-02 · Client-Side HMAC Secret — Card Forgery

**Severity:** Critical  
**Affected files:** `src/utils/cardSigning.js:13` · `.env:7`

#### Vulnerability

The HMAC secret used to sign membership card QR codes is embedded as a `VITE_`-prefixed environment variable. Vite **injects all `VITE_` variables into the client bundle** at build time. This means:

```js
// cardSigning.js:13 — this ends up in the browser JS bundle as a literal string
const SECRET = import.meta.env.VITE_CARD_HMAC_SECRET || 'ssc-al-fallback-dev-secret';
```

Any user can open browser DevTools → Sources → search for the secret, then use the `signCard()` function to generate valid HMAC signatures for **any** membership number and UID.

#### Attack Vector

1. Attacker inspects the production JS bundle and extracts the HMAC secret
2. Attacker calls `signCard('SSC-AL-2025-99999', 'arbitrary-uid')` with the extracted secret
3. Attacker generates a fake QR code that passes the `/verify` HMAC check
4. Combined with the Firestore `allow get: if true` rule (see HIGH-03), the attacker's forged card may appear valid if they also have a Firestore record

This defeats the entire anti-forgery system.

#### Remediation

Move signing to a **server-side Firebase Cloud Function**:

```js
// functions/index.js (Firebase Cloud Function — server-side only)
const functions = require('firebase-functions');
const crypto = require('crypto');

const SECRET = functions.config().app.hmac_secret; // stored in Firebase config, NOT in client code

exports.signCard = functions.https.onCall(async (data, context) => {
  // Only authenticated users can request signatures
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');

  const { membershipNumber, uid } = data;

  // Only allow users to sign their own card (or officers)
  if (context.auth.uid !== uid) {
    // Check if caller is an officer/admin
    const callerSnap = await admin.firestore().doc(`members/${context.auth.uid}`).get();
    const role = callerSnap.data()?.role;
    if (role !== 'officer' && role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Cannot sign other users\' cards');
    }
  }

  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(`${membershipNumber}:${uid}`);
  return { sig: hmac.digest('hex').slice(0, 40) };
});
```

Then call it from the client:
```js
// Client-side replacement for signCard()
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const signCardFn = httpsCallable(functions, 'signCard');

export async function signCard(membershipNumber, uid) {
  const { data } = await signCardFn({ membershipNumber, uid });
  return data.sig;
}
```

**Also** remove the `VITE_CARD_HMAC_SECRET` variable from `.env` entirely and store the secret in Firebase Functions config:
```bash
firebase functions:config:set app.hmac_secret="your-new-strong-secret-here"
```

---

### 🟠 HIGH-01 · Overly Permissive Firestore Rule on `/org/{docId}`

**Severity:** High  
**Affected file:** `firestore.rules:8-11`

#### Vulnerability

```
match /org/{docId} {
  allow read:  if request.auth != null;
  allow write: if request.auth != null;   // ← ANY authenticated user can write
}
```

The `org/memberCounter` document controls the membership number sequence. **Any authenticated user** can write to it — not just officers. An attacker could:

1. Set `count` to `0`, causing duplicate membership numbers for new registrants
2. Set `count` to `999999`, skipping entire ranges
3. Write arbitrary fields to any document in the `org` collection

#### Remediation

```
match /org/{docId} {
  allow read: if request.auth != null;

  // Only officers/admins can directly write the counter
  // Self-registration increments are handled via a transaction
  // that only sets count = existing + 1 (validated below)
  allow write: if request.auth != null
    && (
      isOfficerOrAbove()
      || (
        // Allow self-registration counter increment: must be exactly +1
        docId == 'memberCounter'
        && request.resource.data.count == resource.data.count + 1
      )
    );
}
```

---

### 🟠 HIGH-02 · Unrestricted Google OAuth Domain

**Severity:** High  
**Affected file:** `src/firebase.js:19-22`

#### Vulnerability

```js
googleProvider.setCustomParameters({
  prompt: 'select_account',
  hd: '',   // allow any Google account
});
```

Any person with a Google account (gmail.com, personal, or any workspace domain) can sign in and register as a member. There is no restriction to the university domain.

#### Attack Vector

- An outsider creates a Google account and registers, polluting the member database
- Combined with the `/org` write rule (HIGH-01), they can also manipulate the membership counter

#### Remediation

Restrict to the BatStateU domain:

```js
googleProvider.setCustomParameters({
  prompt: 'select_account',
  hd: 'g.batstate-u.edu.ph',  // restrict to university Google Workspace domain
});
```

---

### 🟠 HIGH-03 · Public Read Access to Member PII

**Severity:** High  
**Affected file:** `firestore.rules:16`

#### Vulnerability

```
match /members/{uid} {
  allow get: if true;    // ← Anyone on the internet, no auth required
```

This means **any person** — without signing in — can read the full member document for any UID, including:
- Full name
- Student ID (SR-Code)
- Email address
- Academic program and year level
- Membership number

This is a **RA 10173 (Data Privacy Act) compliance risk** since PII is exposed without authentication.

#### Attack Vector

An attacker who obtains (or guesses/enumerates) a Firebase UID can fetch the complete student record:
```js
// From any browser, no sign-in needed:
const snap = await getDoc(doc(db, 'members', 'TARGET_UID'));
console.log(snap.data()); // full PII
```

#### Remediation

Use a **Cloud Function** for the QR verification flow instead of direct Firestore reads:

```
match /members/{uid} {
  allow get: if request.auth != null
    && (request.auth.uid == uid || isOfficerOrAbove());
}
```

Then create a Firebase Cloud Function for the public `/verify` QR flow that:
1. Accepts the HMAC signature, membership number, and UID
2. Validates the HMAC server-side
3. Returns only the **minimum necessary fields** (name, status, program) — not email or full PII

---

### 🟡 MED-01 · Missing Input Sanitization on Registration

**Severity:** Medium  
**Affected file:** `src/pages/Register.jsx:72-90`

#### Vulnerability

User-supplied fields (`fullName`, `studentId`) are only checked for emptiness, then stored to Firestore with `.trim()` only. No validation for:
- Maximum length (a user could submit a 100KB name)
- Character restrictions (HTML/script injection in the name)
- Student ID format (expected: `20XX-XXXXX`)

While React's JSX auto-escapes rendered values (preventing XSS in the UI), the raw unsanitized values are:
- Stored permanently in Firestore
- Rendered on the verify page (public, unauthenticated)
- Embedded in exported PNG/PDF card images

#### Remediation

Add validation in `Register.jsx`:
```js
const validate = () => {
  const e = {};
  const name = form.fullName.trim();
  const sid  = form.studentId.trim();

  if (!name)                          e.fullName  = 'Full name is required';
  else if (name.length > 100)         e.fullName  = 'Name is too long (max 100 chars)';
  else if (!/^[A-Za-z\s.\-,ñÑ]+$/.test(name))
                                      e.fullName  = 'Name contains invalid characters';

  if (!sid)                           e.studentId = 'Student ID is required';
  else if (!/^\d{4}-\d{5}$/.test(sid))
                                      e.studentId = 'Format must be 20XX-XXXXX';

  if (!form.course)                   e.course    = 'Please select your program';
  if (!form.yearLevel)                e.yearLevel = 'Please select your year level';
  return e;
};
```

Also add server-side validation in Firestore rules:
```
allow create: if request.auth != null
  && request.auth.uid == uid
  && request.resource.data.role == 'member'
  && request.resource.data.status == 'pending'
  && request.resource.data.fullName.size() <= 100
  && request.resource.data.studentId.matches('^[0-9]{4}-[0-9]{5}$');
```

---

### 🟡 MED-02 · AdminRoute Client-Only Check — No Server Enforcement Gap

**Severity:** Medium  
**Affected files:** `src/components/ProtectedRoute.jsx` · `src/pages/AdminDashboard.jsx`

#### Vulnerability

The `AdminRoute` component checks `member.role` client-side to decide whether to render the admin dashboard. However, the role comes from Firestore, and any officer can update records in Firestore:

```
allow update: if request.auth != null && isOfficerOrAbove();
```

**Any officer can change any member's role to `admin`**, including their own. The Firestore rules don't restrict which fields officers can modify — only admins should be able to change roles.

#### Remediation

Add role-change restrictions in Firestore rules:
```
// Officers can update any member EXCEPT role changes
allow update: if request.auth != null
  && isOfficerOrAbove()
  && (
    isAdmin()
    || !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])
  );
```

---

### 🟡 MED-03 · CSV Import Injection Risk

**Severity:** Medium  
**Affected files:** `src/utils/csvParser.js` · `src/pages/AdminDashboard.jsx`

#### Vulnerability

CSV imports accept raw file content and write it to Firestore without sanitizing field values. A malicious CSV could contain:
- Extremely long strings (DoS via Firestore document size limits)
- Formula injection (`=CMD(...)`) — if exported CSVs are opened in Excel, formulas will execute
- HTML/script content in name fields

Additionally, CSV import creates member docs with auto-generated document IDs without linking metadata, creating orphan records.

#### Remediation

Sanitize each field in `csvParser.js`:
```js
function sanitize(val, maxLen = 200) {
  if (typeof val !== 'string') return '';
  let clean = val.trim().replace(/^[=+\-@\t\r]+/, '');
  return clean.slice(0, maxLen);
}
```

Also track `importedBy` and `importedAt` in `AdminDashboard.jsx`.

---

### 🔵 LOW-01 · Missing Security Headers

**Severity:** Low  
**Affected file:** `firebase.json`

#### Vulnerability

The Firebase Hosting config does not specify security headers. Missing:
- `X-Frame-Options` / `frame-ancestors` (clickjacking)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`
- `Content-Security-Policy`

#### Remediation

Add standard security headers in `firebase.json`.

---

### ⚪ INFO-01 · Hardcoded Fallback Secret

**Severity:** Informational  
**Affected file:** `src/utils/cardSigning.js:13`

#### Observation

```js
const SECRET = import.meta.env.VITE_CARD_HMAC_SECRET || 'ssc-al-fallback-dev-secret';
```

If the env variable is missing, the code falls back to a weak, publicly visible default secret.

#### Remediation

Remove the fallback and fail loudly if the configuration is missing.

---

## Summary & Priority Matrix

| # | Finding | Severity | Effort | Priority |
|---|---------|----------|--------|----------|
| CRIT-01 | `.env` committed to Git with real secrets | 🔴 Critical | Low | **Immediate** |
| CRIT-02 | HMAC secret in client bundle — card forgery | 🔴 Critical | Medium | **Immediate** |
| HIGH-01 | `/org` collection writable by any auth user | 🟠 High | Low | **This week** |
| HIGH-02 | No university domain restriction on OAuth | 🟠 High | Low | **This week** |
| HIGH-03 | Member PII publicly readable (RA 10173 risk) | 🟠 High | Medium | **This week** |
| MED-01 | No input validation/sanitization on registration | 🟡 Medium | Low | **Next sprint** |
| MED-02 | Officers can escalate their own role to admin | 🟡 Medium | Low | **Next sprint** |
| MED-03 | CSV import injection/orphan doc risk | 🟡 Medium | Low | **Next sprint** |
| LOW-01 | Missing security headers on Firebase Hosting | 🔵 Low | Low | **Next sprint** |
| INFO-01 | Hardcoded fallback HMAC secret | ⚪ Info | Trivial | **Backlog** |
