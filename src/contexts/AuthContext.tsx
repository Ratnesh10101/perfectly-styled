"use client";

import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import type { ReactNode } from "react";
import React, { createContext, useEffect, useState } from "react";
import { auth, db } from "@/config/firebase";
import type { UserMeta } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";

interface AuthContextType {
  currentUser: User | null;
  userMeta: UserMeta | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch initial UserMeta
        const userMetaRef = doc(db, "users", user.uid, "meta", "data");
        const docSnap = await getDoc(userMetaRef);
        if (docSnap.exists()) {
          setUserMeta(docSnap.data() as UserMeta);
        } else {
          setUserMeta({ hasPaid: false, hasGeneratedReport: false, questionnaireComplete: false });
        }
      } else {
        setUserMeta(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeMeta: (() => void) | undefined;
    if (currentUser) {
      const userMetaRef = doc(db, "users", currentUser.uid, "meta", "data");
      unsubscribeMeta = onSnapshot(userMetaRef, (doc) => {
        if (doc.exists()) {
          setUserMeta(doc.data() as UserMeta);
        } else {
           setUserMeta({ hasPaid: false, hasGeneratedReport: false, questionnaireComplete: false });
        }
      });
    } else {
      setUserMeta(null);
    }
    return () => {
      if (unsubscribeMeta) {
        unsubscribeMeta();
      }
    };
  }, [currentUser]);


  const logout = async () => {
    await auth.signOut();
    setCurrentUser(null);
    setUserMeta(null);
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <AuthContext.Provider value={{ currentUser, userMeta, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
