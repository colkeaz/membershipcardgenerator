import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeCsvField } from '../src/utils/csvParser.js';

describe('Security Audit — MED-03: CSV Injection (Formula Injection) Sanitization', () => {
  it('strips formula injection prefixes (=, +, -, @, tab, cr)', () => {
    assert.strictEqual(sanitizeCsvField('=1+1'), '1+1');
    assert.strictEqual(sanitizeCsvField('+1+1'), '1+1');
    assert.strictEqual(sanitizeCsvField('-5+2'), '5+2');
    assert.strictEqual(sanitizeCsvField('@SUM(A1:A10)'), 'SUM(A1:A10)');
    assert.strictEqual(sanitizeCsvField('\t=CMD("calc")'), 'CMD("calc")');
    assert.strictEqual(sanitizeCsvField('\r+EXEC("whoami")'), 'EXEC("whoami")');
  });

  it('neutralizes malicious DDE / CMD formula attacks', () => {
    const maliciousPayload = "=cmd|'/c calc'!A0";
    const sanitized = sanitizeCsvField(maliciousPayload);
    assert.strictEqual(sanitized.startsWith('='), false);
    assert.strictEqual(sanitized, "cmd|'/c calc'!A0");
  });

  it('strips script tags and HTML injection from CSV field data', () => {
    const payload = '<script>document.location="http://evil.com"</script>';
    const sanitized = sanitizeCsvField(payload);
    assert.strictEqual(sanitized.includes('<'), false);
    assert.strictEqual(sanitized.includes('>'), false);
  });

  it('enforces maximum character length constraints (prevents storage DoS)', () => {
    const oversizedPayload = 'A'.repeat(500);
    const sanitized = sanitizeCsvField(oversizedPayload, 100);
    assert.strictEqual(sanitized.length, 100);
  });

  it('handles non-string or null inputs gracefully', () => {
    assert.strictEqual(sanitizeCsvField(null), '');
    assert.strictEqual(sanitizeCsvField(undefined), '');
    assert.strictEqual(sanitizeCsvField(12345), '');
  });
});
