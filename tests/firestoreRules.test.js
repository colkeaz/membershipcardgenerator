import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Security Audit — Firestore Rules Static Analysis & Policy Checks', () => {
  const rulesPath = path.resolve('firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  it('HIGH-01: restricts /org/{docId} writes to officers or strictly +1 counter increments', () => {
    // Assert old vulnerable pattern is NOT present
    const vulnerablePattern = /match \/org\/\{docId\}\s*\{\s*allow read:\s*if request\.auth != null;\s*allow write:\s*if request\.auth != null;\s*\}/;
    assert.strictEqual(vulnerablePattern.test(rulesContent), false, 'Vulnerable /org write rule must not exist');

    // Assert secured logic is present
    assert.ok(rulesContent.includes('Fixed: HIGH-01'), 'Must include HIGH-01 fix comment');
    assert.ok(rulesContent.includes('isOfficerOrAbove()'), 'Must require officer check');
    assert.ok(rulesContent.includes("docId == 'memberCounter'"), 'Must restrict non-officer writes to memberCounter');
    assert.ok(rulesContent.includes('request.resource.data.count == resource.data.count + 1'), 'Must restrict increments to exactly +1');
  });

  it('MED-01: enforces server-side validation on member registration creation', () => {
    assert.ok(rulesContent.includes('Fixed: MED-01'), 'Must include MED-01 fix comment');
    assert.ok(rulesContent.includes("request.resource.data.role == 'member'"), 'Role must be locked to member on create');
    assert.ok(rulesContent.includes("request.resource.data.status == 'pending'"), 'Status must be locked to pending on create');
    assert.ok(rulesContent.includes('request.resource.data.fullName.size() <= 100'), 'Must enforce max name length');
    assert.ok(rulesContent.includes("request.resource.data.studentId.matches('^([0-9]{2}|[0-9]{4})-[0-9]{5}$')"), 'Must enforce SR-Code format');
  });

  it('MED-02: prevents officers from escalating their own or others role to admin', () => {
    assert.ok(rulesContent.includes('Fixed: MED-02'), 'Must include MED-02 fix comment');
    assert.ok(rulesContent.includes("!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])"), 'Non-admins must not be able to update the role field');
    assert.ok(rulesContent.includes('isAdmin()'), 'Only admins can modify role');
  });

  it('LOW-01: firebase.json contains HTTP security headers', () => {
    const firebaseJson = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
    assert.ok(firebaseJson.hosting?.headers?.length > 0, 'firebase.json must contain hosting headers');

    const headersMap = {};
    for (const h of firebaseJson.hosting.headers[0].headers) {
      headersMap[h.key] = h.value;
    }

    assert.strictEqual(headersMap['X-Frame-Options'], 'DENY');
    assert.strictEqual(headersMap['X-Content-Type-Options'], 'nosniff');
    assert.strictEqual(headersMap['Referrer-Policy'], 'strict-origin-when-cross-origin');
    assert.ok(headersMap['Content-Security-Policy'], 'Content-Security-Policy must be set');
  });

  it('CRIT-01: .gitignore excludes .env files from version control', () => {
    const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    assert.ok(gitignoreContent.includes('.env'), '.gitignore must include .env');
    assert.ok(gitignoreContent.includes('.env.local'), '.gitignore must include .env.local');
  });

  it('SEC-TICKET-01: enforces correction ticket workflow and validates all 5 registration fields on /tickets/{ticketId}', () => {
    assert.ok(rulesContent.includes('Fixed: SEC-TICKET-01'), 'Must include SEC-TICKET-01 comment');
    assert.ok(rulesContent.includes('match /tickets/{ticketId}'), 'Must define /tickets/{ticketId} rules');
    assert.ok(rulesContent.includes("request.resource.data.category == 'edit_details'"), 'Ticket category must be edit_details');
    assert.ok(rulesContent.includes('request.resource.data.proposedChanges.fullName.size() <= 100'), 'Must validate fullName in proposedChanges');
    assert.ok(rulesContent.includes("request.resource.data.proposedChanges.studentId.matches('^([0-9]{2}|[0-9]{4})-[0-9]{5}$')"), 'Must validate SR-Code (studentId) in proposedChanges');
    assert.ok(rulesContent.includes('request.resource.data.proposedChanges.department.size() > 0'), 'Must validate department in proposedChanges');
    assert.ok(rulesContent.includes('request.resource.data.proposedChanges.program.size() > 0'), 'Must validate program in proposedChanges');
    assert.ok(rulesContent.includes('request.resource.data.proposedChanges.yearLevel.size() > 0'), 'Must validate yearLevel in proposedChanges');
  });
});

