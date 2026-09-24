const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

// Fixed: CRIT-02 Client-Side HMAC Secret — Card Forgery as per audit
// The HMAC secret is retrieved strictly server-side from environment variables
const HMAC_SECRET = process.env.CARD_HMAC_SECRET || functions.config().app?.hmac_secret;

function computeServerHmac(membershipNumber, uid) {
  if (!HMAC_SECRET) {
    throw new functions.https.HttpsError('failed-precondition', 'Server HMAC secret not configured');
  }
  const hmac = crypto.createHmac('sha256', HMAC_SECRET);
  hmac.update(`${membershipNumber}:${uid}`);
  return hmac.digest('hex').slice(0, 40);
}

/**
 * Fixed: CRIT-02 Server-Side Card Signing
 * Only authenticated users can sign cards.
 * Regular members can only sign their own card; officers/admins can sign any card.
 */
exports.signCard = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to sign membership cards');
  }

  const { membershipNumber, uid } = data;
  if (!membershipNumber || !uid) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing membershipNumber or uid');
  }

  // Authorization check: Only self or officer/admin can generate card signature
  if (context.auth.uid !== uid) {
    const callerSnap = await admin.firestore().doc(`members/${context.auth.uid}`).get();
    const callerRole = callerSnap.data()?.role;
    if (callerRole !== 'officer' && callerRole !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Cannot sign cards for other members');
    }
  }

  const sig = computeServerHmac(membershipNumber, uid);
  return { sig };
});

/**
 * Fixed: HIGH-03 Server-Side QR Verification without exposing member PII
 * Validates HMAC and returns only public membership card verification details,
 * completely protecting personal email, internal notes, and sensitive auth data.
 */
exports.verifyMembership = functions.https.onCall(async (data) => {
  const { mn, uid, sig } = data;
  if (!mn || !uid || !sig) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required verification parameters');
  }

  // 1. Verify HMAC signature
  const expectedSig = computeServerHmac(mn, uid);
  if (expectedSig !== sig) {
    return { valid: false, reason: 'Invalid signature' };
  }

  // 2. Fetch member record using Admin SDK (bypasses Firestore client rules safely)
  const memberSnap = await admin.firestore().doc(`members/${uid}`).get();
  if (!memberSnap.exists) {
    return { valid: false, reason: 'Member record not found' };
  }

  const memberData = memberSnap.data();
  if (memberData.membershipNumber !== mn) {
    return { valid: false, reason: 'Membership number mismatch' };
  }

  // 3. Return strictly sanitized public fields (Fixed: HIGH-03 Protect PII)
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
});
