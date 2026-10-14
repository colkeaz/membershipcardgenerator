import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, limit, serverTimestamp } from 'firebase/firestore';
import { auth, db, studentGoogleProvider, partnerGoogleProvider } from '../firebase';
import { WHITELISTED_EMAILS } from '../utils/validators';
import { getCurrentSchoolYear, getCurrentSemester } from '../utils/memberNumber';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);   // Firebase auth user
  const [member, setMember]     = useState(null);   // Firestore member doc
  const [loading, setLoading]   = useState(true);

  // Helper to resolve and link a user's member profile across UIDs and emails
  const resolveMemberProfile = async (firebaseUser) => {
    if (!firebaseUser) return null;

    try {
      // 1. Primary lookup: Direct check by UID
      const memberRef = doc(db, 'members', firebaseUser.uid);
      const snap = await getDoc(memberRef);

      if (snap.exists()) {
        const data = snap.data();
        if (!data.photoURL && firebaseUser.photoURL) {
          updateDoc(memberRef, { photoURL: firebaseUser.photoURL }).catch(() => {});
          data.photoURL = firebaseUser.photoURL;
        }
        return { id: snap.id, ...data };
      }

      // 2. Secondary lookup (Universal fallback for everybody):
      // If doc not found directly by UID (e.g. imported via CSV or doc created with previous/different ID):
      if (firebaseUser.email) {
        const emailClean = firebaseUser.email.trim().toLowerCase();
        const q = query(
          collection(db, 'members'),
          where('email', '==', emailClean),
          limit(1)
        );
        const qSnap = await getDocs(q);

        if (!qSnap.empty) {
          const matchedDoc = qSnap.docs[0];
          const matchedData = matchedDoc.data();

          // Auto-link: Copy/save to doc(db, 'members', firebaseUser.uid) so future lookups are instantaneous
          const linkedData = {
            ...matchedData,
            uid: firebaseUser.uid,
            photoURL: matchedData.photoURL || firebaseUser.photoURL || null
          };

          try {
            await setDoc(memberRef, linkedData, { merge: true });
          } catch (e) {
            console.warn('Auto-linking member document under current UID failed:', e);
          }

          return { id: firebaseUser.uid, ...linkedData };
        }

        // 3. Whitelisted admin auto-bootstrap fallback:
        // If an authorized admin signs in but has no doc in Firestore, create it automatically
        if (WHITELISTED_EMAILS.includes(emailClean)) {
          const adminDocData = {
            uid:              firebaseUser.uid,
            email:            emailClean,
            fullName:         firebaseUser.displayName || 'SSC BatStateU Alangilan',
            studentId:        '00-00000',
            department:       'Supreme Student Council',
            program:          'Administration',
            course:           'Other',
            yearLevel:        '5th Year',
            membershipNumber: 'SSC-AL-2026-00001',
            schoolYear:       getCurrentSchoolYear(),
            semester:         getCurrentSemester(),
            status:           'active',
            role:             'admin',
            photoURL:         firebaseUser.photoURL || null,
            createdAt:        serverTimestamp(),
          };

          try {
            await setDoc(memberRef, adminDocData, { merge: true });
            return { id: firebaseUser.uid, ...adminDocData };
          } catch (e) {
            console.warn('Admin auto-bootstrap failed:', e);
          }
        }
      }
    } catch (err) {
      console.error('Error resolving member profile:', err);
    }

    return null;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const cachedMemberStr = localStorage.getItem(`ssc_member_${firebaseUser.uid}`);
        if (cachedMemberStr) {
          try {
            setMember(JSON.parse(cachedMemberStr));
          } catch(e) {}
        }
        setUser(firebaseUser);
        const resolved = await resolveMemberProfile(firebaseUser);
        if (resolved) {
          setMember(resolved);
          localStorage.setItem(`ssc_member_${firebaseUser.uid}`, JSON.stringify(resolved));
        } else {
          setMember(null);
          localStorage.removeItem(`ssc_member_${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
        setMember(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = (isPartner = false) => signInWithPopup(auth, isPartner ? partnerGoogleProvider : studentGoogleProvider);
  const logout = () => signOut(auth);

  const refreshMember = async () => {
    if (!user) return;
    const resolved = await resolveMemberProfile(user);
    if (resolved) {
      setMember(resolved);
      localStorage.setItem(`ssc_member_${user.uid}`, JSON.stringify(resolved));
    } else {
      setMember(null);
      localStorage.removeItem(`ssc_member_${user.uid}`);
    }
  };

  // 15 minute inactivity timeout
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      if (user) {
        timeout = setTimeout(() => {
          logout();
        }, 15 * 60 * 1000);
      }
    };
    resetTimer();
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    return () => {
      clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, member, loading, signInWithGoogle, logout, refreshMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
