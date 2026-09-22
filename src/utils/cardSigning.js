/**
 * Anti-forgery card signing using HMAC-SHA256 (Web Crypto API — no library needed).
 *
 * How it works:
 *  1. We sign (membershipNumber + ":" + uid) with a secret key.
 *  2. The signature is embedded in the QR URL as `?sig=...`
 *  3. The /verify page re-computes the signature AND checks Firestore.
 *     → Forging requires BOTH knowing the secret AND having a live active record.
 *     → Editing the name/details on a downloaded image still fails because
 *       the QR points to real Firestore data, not the image itself.
 */

const SECRET = import.meta.env.VITE_CARD_HMAC_SECRET || 'ssc-al-fallback-dev-secret';

async function getKey() {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/** Returns a 40-char hex HMAC signature for a given membership number + uid. */
export async function signCard(membershipNumber, uid) {
  const payload = `${membershipNumber}:${uid}`;
  const key     = await getKey();
  const sigBuf  = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sigBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 40);
}

/** Verify a signature — used on the /verify page. */
export async function verifyCard(membershipNumber, uid, sig) {
  const expected = await signCard(membershipNumber, uid);
  return expected === sig;
}

/** Build the full verification URL embedded in the QR code. */
export function buildVerifyUrl(membershipNumber, uid, sig) {
  const params = new URLSearchParams({ mn: membershipNumber, uid, sig });
  return `${window.location.origin}/verify?${params}`;
}
