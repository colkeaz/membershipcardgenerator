/**
 * Anti-forgery card signing using HMAC-SHA256 (Web Crypto API).
 * Provides server-side/local fallback HMAC verification and URL building.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase.js';

const CLIENT_SECRET = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env.VITE_CARD_HMAC_SECRET
  : (typeof process !== 'undefined' ? process.env?.VITE_CARD_HMAC_SECRET : undefined);

function getCryptoSubtle() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API (crypto.subtle) is not available in this environment.');
}

async function getLocalKey(secret = CLIENT_SECRET) {
  if (!secret) {
    throw new Error('VITE_CARD_HMAC_SECRET is not configured. Card signing requires a valid secret.');
  }
  const subtle = getCryptoSubtle();
  return subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Computes HMAC-SHA256 signature locally using Web Crypto API.
 */
export async function computeLocalSignature(membershipNumber, uid, secret = CLIENT_SECRET) {
  const payload = `${membershipNumber}:${uid}`;
  const key = await getLocalKey(secret);
  const subtle = getCryptoSubtle();
  const sigBuf = await subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sigBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 40);
}

/**
 * Returns a 40-char hex HMAC signature for a given membership number + uid.
 */
export async function signCard(membershipNumber, uid) {
  if (functions) {
    try {
      const signCardFn = httpsCallable(functions, 'signCard');
      const response = await signCardFn({ membershipNumber, uid });
      if (response?.data?.sig) {
        return response.data.sig;
      }
    } catch {
      // Cloud Function not yet deployed or error — fall back to local signing
    }
  }

  return computeLocalSignature(membershipNumber, uid);
}

/**
 * Verify a signature — used on the /verify page or by officers.
 */
export async function verifyCard(membershipNumber, uid, sig) {
  if (!sig || typeof sig !== 'string') return false;
  try {
    const expected = await signCard(membershipNumber, uid);
    return expected === sig;
  } catch {
    return false;
  }
}

/**
 * Build the full verification URL embedded in the QR code.
 */
export function buildVerifyUrl(membershipNumber, uid, sig) {
  const origin = (typeof window !== 'undefined' && window.location?.origin)
    ? window.location.origin
    : 'http://localhost:5173';
  const params = new URLSearchParams({ mn: membershipNumber, uid });
  if (sig) {
    params.set('sig', sig);
  }
  return `${origin}/verify?${params.toString()}`;
}
