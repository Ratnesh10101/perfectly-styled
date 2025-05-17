
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
    let unsubscribeAuth: (() => void) | undefined;

    if (auth) {
      try {
        unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
          setCurrentUser(user);
          if (user) {
            if (db) {
              const userMetaRef = doc(db, "users", user.uid, "meta", "data");
              try {
                const docSnap = await getDoc(userMetaRef);
                if (docSnap.exists()) {
                  setUserMeta(docSnap.data() as UserMeta);
                } else {
                  setUserMeta({ email: user.email, hasPaid: false, hasGeneratedReport: false, questionnaireComplete: false });
                }
              } catch (error) {
                console.error("AuthContext: Error fetching initial user meta:", error);
                setUserMeta({ email: user.email, hasPaid: false, hasGeneratedReport: false, questionnaireComplete: false });
              }
            } else {
               console.error("AuthContext: Firebase db is not initialized. Cannot fetch initial user meta.");
               setUserMeta({ email: user.email, hasPaid: false, hasGeneratedReport: false, questionnaireComplete: false });
            }
          } else {
            setUserMeta(null);
          }
          setLoading(false);
        });
      } catch (e) {
        console.error("AuthContext: Error attaching onAuthStateChanged listener:", e);
        setLoading(false); // Ensure loading completes even if listener fails
      }
    } else {
      console.error("AuthContext: Firebase auth is not initialized. Cannot track auth state.");
      setCurrentUser(null);
      setUserMeta(null);
      setLoading(false);
    }

    return () => {
      if (unsubscribeAuth) {
        try {
          unsubscribeAuth();
        } catch (e) {
          console.error("AuthContext: Error unsubscribing from onAuthStateChanged:", e);
        }
      }
    };
  }, []);

  useEffect(() => {
    let unsubscribeMeta: (() => void) | undefined;

    if (currentUser && db) {
      try {
        const userMetaRef = doc(db, "users", currentUser.uid, "meta", "data");
        unsubscribeMeta = onSnapshot(userMetaRef, (docSn) => {
          if (docSn.exists()) {
            setUserMeta(docSn.data() as UserMeta);
          } else {
             setUserMeta({ email: currentUser.email, hasPaid: false, hasGeneratedReport: false, questionnaireComplete: false });
          }
        }, (error) => {
          console.error("AuthContext: Error listening to user meta:", error);
           setUserMeta({ email: currentUser.email, hasPaid: false, hasGeneratedReport: false, questionnaireComplete: false });
        });
      } catch (e) {
        console.error("AuthContext: Error setting up Firestore onSnapshot listener:", e);
        // Potentially set userMeta to a default or null state if listener setup fails
        setUserMeta({ email: currentUser.email, hasPaid: false, hasGeneratedReport: false, questionnaireComplete: false });
      }
    } else {
      if(!currentUser) setUserMeta(null);
    }
    
    return () => {
      if (unsubscribeMeta) {
        try {
          unsubscribeMeta();
        } catch (e) {
          console.error("AuthContext: Error unsubscribing from onSnapshot:", e);
        }
      }
    };
  }, [currentUser]);


  const logout = async () => {
    if (auth) {
      try {
        await auth.signOut();
      } catch (e) {
        console.error("Logout failed:", e);
      }
    } else {
      console.error("Logout failed: Firebase auth is not initialized.");
    }
    setCurrentUser(null);
    setUserMeta(null);
  };

  if (loading && typeof window !== 'undefined') { // Only show full page spinner on client
    return <LoadingSpinner fullPage />;
  }
  if (loading && typeof window === 'undefined') { // For SSR, if still loading, perhaps render minimal or null
      return null; // Or some placeholder that doesn't rely on client-side state
  }


  return (
    <AuthContext.Provider value={{ currentUser, userMeta, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
