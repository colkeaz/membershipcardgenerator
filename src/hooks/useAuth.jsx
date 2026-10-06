import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, studentGoogleProvider, partnerGoogleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);   // Firebase auth user
  const [member, setMember]     = useState(null);   // Firestore member doc
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const cachedMemberStr = localStorage.getItem(`ssc_member_${firebaseUser.uid}`);
        if (cachedMemberStr) {
          try {
             setMember(JSON.parse(cachedMemberStr));
          } catch(e) {}
        }
      }
      if (firebaseUser) {
        setUser(firebaseUser);
        const memberRef = doc(db, 'members', firebaseUser.uid);
        const snap = await getDoc(memberRef);
        if (snap.exists()) {
          const data = snap.data();
          // Update photoURL if missing but available from Google
          if (!data.photoURL && firebaseUser.photoURL) {
            updateDoc(memberRef, { photoURL: firebaseUser.photoURL }).catch(e => { /* ignore */ });
            data.photoURL = firebaseUser.photoURL;
          }
          const memberObj = { id: snap.id, ...data };
          setMember(memberObj);
          localStorage.setItem(`ssc_member_${firebaseUser.uid}`, JSON.stringify(memberObj));
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
    const snap = await getDoc(doc(db, 'members', user.uid));
    if (snap.exists()) {
      const memberObj = { id: snap.id, ...snap.data() };
      setMember(memberObj);
      localStorage.setItem(`ssc_member_${user.uid}`, JSON.stringify(memberObj));
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

