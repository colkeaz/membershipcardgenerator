import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  computeLocalSignature,
  buildVerifyUrl,
} from '../src/utils/cardSigning.js';

describe('Security Audit — CRIT-02 & INFO-01: Card HMAC Anti-Forgery', () => {
  const TEST_KEY = 'test-audit-secure-secret-key-32bytes-length!';
  const MEMBERSHIP_NO = 'SSC-AL-2025-00042';
  const UID = 'firebase-user-uid-12345';

  it('generates a deterministic 40-character hex HMAC signature', async () => {
    const sig1 = await computeLocalSignature(MEMBERSHIP_NO, UID, TEST_KEY);
    const sig2 = await computeLocalSignature(MEMBERSHIP_NO, UID, TEST_KEY);
    assert.strictEqual(typeof sig1, 'string');
    assert.strictEqual(sig1.length, 40);
    assert.strictEqual(sig1, sig2);
  });

  it('detects tampering with membership number', async () => {
    const legitSig = await computeLocalSignature(MEMBERSHIP_NO, UID, TEST_KEY);
    const forgedNumber = 'SSC-AL-2025-00099';
    const tamperedSig = await computeLocalSignature(forgedNumber, UID, TEST_KEY);
    assert.notStrictEqual(legitSig, tamperedSig);
  });

  it('detects tampering with user UID', async () => {
    const legitSig = await computeLocalSignature(MEMBERSHIP_NO, UID, TEST_KEY);
    const forgedUid = 'attacker-uid-99999';
    const tamperedSig = await computeLocalSignature(forgedNumberUid(MEMBERSHIP_NO), forgedUid, TEST_KEY);
    assert.notStrictEqual(legitSig, tamperedSig);

    function forgedNumberUid(m) { return m; }
  });

  it('detects forged signatures generated with a different key', async () => {
    const legitSig = await computeLocalSignature(MEMBERSHIP_NO, UID, TEST_KEY);
    const wrongKey = 'attacker-guessed-or-default-key!';
    const forgedSig = await computeLocalSignature(MEMBERSHIP_NO, UID, wrongKey);
    assert.notStrictEqual(legitSig, forgedSig);
  });

  it('throws an error if secret is missing (INFO-01: No weak fallback)', async () => {
    await assert.rejects(
      async () => {
        await computeLocalSignature(MEMBERSHIP_NO, UID, '');
      },
      {
        message: /VITE_CARD_HMAC_SECRET is not configured/,
      }
    );
  });

  it('constructs well-formed verification URLs with expected query parameters', () => {
    const dummySig = '0123456789abcdef0123456789abcdef01234567';
    const urlStr = buildVerifyUrl(MEMBERSHIP_NO, UID, dummySig);
    const url = new URL(urlStr);
    assert.strictEqual(url.searchParams.get('mn'), MEMBERSHIP_NO);
    assert.strictEqual(url.searchParams.get('uid'), UID);
    assert.strictEqual(url.searchParams.get('sig'), dummySig);
  });
});
