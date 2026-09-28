import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const env = (typeof import.meta !== 'undefined' && import.meta?.env)
  ? import.meta.env
  : (typeof process !== 'undefined' && process.env ? process.env : {});

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId:         env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '0000000000',
  appId:             env.VITE_FIREBASE_APP_ID || '1:0000000000:web:0000',
};

const app  = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google OAuth Provider
// Note: hd is omitted by default so admin and testing accounts can sign in.
// To strictly restrict Google account picker to university domain, set VITE_RESTRICT_DOMAIN=true in .env
const googleParams = { prompt: 'select_account' };
if (env.VITE_RESTRICT_DOMAIN === 'true') {
  googleParams.hd = 'g.batstate-u.edu.ph';
}
googleProvider.setCustomParameters(googleParams);

