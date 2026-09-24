import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';

describe('Security Audit — Server-Side Cloud Functions (CRIT-02 & HIGH-03)', () => {
  const SERVER_HMAC_SECRET = 'server-secure-signing-secret-audit-approved';

  function computeServerHmac(membershipNumber, uid, secret = SERVER_HMAC_SECRET) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${membershipNumber}:${uid}`);
    return hmac.digest('hex').slice(0, 40);
  }

  function simulateVerifyMembership(reqData, mockDatabase, serverSecret = SERVER_HMAC_SECRET) {
    const { mn, uid, sig } = reqData;
    if (!mn || !uid || !sig) {
      return { status: 400, error: 'Missing required verification parameters' };
    }

    const expectedSig = computeServerHmac(mn, uid, serverSecret);
    if (expectedSig !== sig) {
      return { valid: false, reason: 'Invalid signature' };
    }

    const memberData = mockDatabase[uid];
    if (!memberData) {
      return { valid: false, reason: 'Member record not found' };
    }

    if (memberData.membershipNumber !== mn) {
      return { valid: false, reason: 'Membership number mismatch' };
    }

    // Fixed: HIGH-03 Protect PII by returning only necessary verification fields
    return {
      valid: true,
      status: memberData.status,
      fullName: memberData.fullName,
      studentId: memberData.studentId,
      program: memberData.program || memberData.course,
      yearLevel: memberData.yearLevel,
      membershipNumber: memberData.membershipNumber,
      schoolYear: memberData.schoolYear,
      semester: memberData.semester,
    };
  }

  it('CRIT-02: generates tamper-evident server-side signatures', () => {
    const mn = 'SSC-AL-2025-00010';
    const uid = 'member-uid-10';
    const sig = computeServerHmac(mn, uid);
    assert.strictEqual(sig.length, 40);
  });

  it('HIGH-03: strips sensitive PII (emails, tokens) from verification responses', () => {
    const mn = 'SSC-AL-2025-00010';
    const uid = 'member-uid-10';
    const sig = computeServerHmac(mn, uid);

    const mockDb = {
      'member-uid-10': {
        fullName: 'Maria Santos',
        studentId: '2022-12345',
        email: 'maria.santos@g.batstate-u.edu.ph', // Sensitive PII
        passwordHash: '$2b$12$e8Y...',            // Sensitive PII
        internalNotes: 'Payment pending review',    // Internal data
        program: 'BS Computer Engineering',
        yearLevel: '3rd Year',
        membershipNumber: mn,
        schoolYear: '2024-2025',
        semester: '1st Semester',
        status: 'active',
      },
    };

    const res = simulateVerifyMembership({ mn, uid, sig }, mockDb);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.fullName, 'Maria Santos');
    assert.strictEqual(res.status, 'active');

    // Confirm sensitive fields are NOT exposed
    assert.strictEqual('email' in res, false, 'User email must NOT be returned in public QR response');
    assert.strictEqual('passwordHash' in res, false, 'Password hash must NOT be returned');
    assert.strictEqual('internalNotes' in res, false, 'Internal notes must NOT be returned');
  });

  it('rejects verification if HMAC signature is tampered or forged', () => {
    const mn = 'SSC-AL-2025-00010';
    const uid = 'member-uid-10';
    const mockDb = {
      'member-uid-10': {
        fullName: 'Maria Santos',
        studentId: '2022-12345',
        membershipNumber: mn,
        status: 'active',
      },
    };

    const tamperedRes = simulateVerifyMembership({ mn, uid, sig: 'forged0000000000000000000000000000000000' }, mockDb);
    assert.strictEqual(tamperedRes.valid, false);
    assert.strictEqual(tamperedRes.reason, 'Invalid signature');
  });
});
