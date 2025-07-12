import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { app } from "../firebase";
import { db } from "../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    updateDoc(userRef, { lastOnline: serverTimestamp() });
    // Periodically update lastOnline every 60 seconds
    const interval = setInterval(() => {
      updateDoc(userRef, { lastOnline: serverTimestamp() });
    }, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const signInWithGoogle = async () => {
    try {
      console.log("AuthContext: Creating Google provider...");
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      console.log("AuthContext: Attempting sign-in popup...");
      const result = await signInWithPopup(auth, provider);
      console.log("AuthContext: Sign-in successful", result);
      return result;
    } catch (error) {
      console.error('AuthContext: Google sign-in error:', error);
      throw error;
    }
  };
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ currentUser, signInWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 