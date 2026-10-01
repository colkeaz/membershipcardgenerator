import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { isValidUniversityEmail } from '../utils/validators';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);   // Firebase auth user
  const [member, setMember]     = useState(null);   // Firestore member doc
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const memberRef = doc(db, 'members', firebaseUser.uid);
        const snap = await getDoc(memberRef);
        if (snap.exists()) {
          const data = snap.data();
          // Update photoURL if missing but available from Google
          if (!data.photoURL && firebaseUser.photoURL) {
            import('firebase/firestore').then(({ updateDoc }) => {
              updateDoc(memberRef, { photoURL: firebaseUser.photoURL }).catch(console.error);
            });
            data.photoURL = firebaseUser.photoURL;
          }
          setMember({ id: snap.id, ...data });
        } else {
          setMember(null);
        }
      } else {
        setUser(null);
        setMember(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    return await signInWithPopup(auth, googleProvider);
  };
  const logout = () => signOut(auth);

  const refreshMember = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, 'members', user.uid));
    setMember(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  };

  return (
    <AuthContext.Provider value={{ user, member, loading, signInWithGoogle, logout, refreshMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

