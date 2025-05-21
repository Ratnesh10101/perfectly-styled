
"use client";

import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import type { ReactNode } from "react";
import React, { createContext, useEffect, useState } from "react";
import { auth, db, firebaseInitialized, firebaseInitError } from "@/config/firebase";
import type { UserMeta } from "@/types";

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

    if (!firebaseInitialized || firebaseInitError) {
      console.error(
        "AuthContext: Firebase was not initialized successfully or is in an error state. Cannot set up auth listeners. Error:",
        firebaseInitError
      );
      setLoading(false); // Ensure loading is set to false
      return; // Prevent further execution within this useEffect
    }

    if (auth) {
      try {
        unsubscribeAuth = onAuthStateChanged(
          auth,
          async (user) => {
            setCurrentUser(user);
            if (user) {
              if (db) {
                const userMetaRef = doc(db, "users", user.uid, "meta", "data");
                try {
                  const docSnap = await getDoc(userMetaRef);
                  if (docSnap.exists()) {
                    setUserMeta(docSnap.data() as UserMeta);
                  } else {
                    setUserMeta({
                      email: user.email,
                      hasPaid: false,
                      hasGeneratedReport: false,
                      questionnaireComplete: false,
                    });
                  }
                } catch (error) {
                  console.error("AuthContext: Error fetching initial user meta:", error);
                  setUserMeta({
                    email: user.email,
                    hasPaid: false,
                    hasGeneratedReport: false,
                    questionnaireComplete: false,
                  }); // Provide default on error
                }
              } else {
                console.error("AuthContext: Firebase 'db' is not initialized. Cannot fetch initial user meta.");
                setUserMeta({
                  email: user.email,
                  hasPaid: false,
                  hasGeneratedReport: false,
                  questionnaireComplete: false,
                }); // Provide default if db is null
              }
            } else {
              setUserMeta(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("AuthContext: onAuthStateChanged error:", error);
            setLoading(false);
          }
        );
      } catch (e) {
        console.error("AuthContext: Error attaching onAuthStateChanged listener:", e);
        setLoading(false);
      }
    } else {
      console.error("AuthContext: Firebase 'auth' service is not available. Cannot track auth state.");
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
  }, []); // Removed firebaseInitialized and firebaseInitError as direct dependencies, their check at the start is sufficient

  useEffect(() => {
    let unsubscribeMeta: (() => void) | undefined;

    if (!firebaseInitialized || firebaseInitError || !db) {
      // Log only if db is the specific null issue after general init checks passed for auth
      if (db === null && firebaseInitialized && !firebaseInitError) {
         console.error("AuthContext: Firebase 'db' is not initialized. Cannot set up meta listener.");
      }
      // No need to setLoading(false) here as the auth listener's useEffect handles overall loading state.
      return;
    }

    if (currentUser && db) {
      try {
        const userMetaRef = doc(db, "users", currentUser.uid, "meta", "data");
        unsubscribeMeta = onSnapshot(
          userMetaRef,
          (docSn) => {
            if (docSn.exists()) {
              setUserMeta(docSn.data() as UserMeta);
            } else {
              // If user is logged in but no meta doc, provide a default.
              // This can happen if doc creation failed post-signup.
              setUserMeta({
                email: currentUser.email,
                hasPaid: false,
                hasGeneratedReport: false,
                questionnaireComplete: false,
              });
            }
          },
          (error) => {
            console.error("AuthContext: Error listening to user meta with onSnapshot:", error);
            setUserMeta({
              email: currentUser.email, // Fallback meta on error
              hasPaid: false,
              hasGeneratedReport: false,
              questionnaireComplete: false,
            });
          }
        );
      } catch (e) {
        console.error("AuthContext: Error setting up Firestore onSnapshot listener for user meta:", e);
        // Consider setting a default/fallback userMeta here if this setup fails
         setUserMeta({
            email: currentUser.email,
            hasPaid: false,
            hasGeneratedReport: false,
            questionnaireComplete: false,
        });
      }
    } else if (!currentUser) {
      setUserMeta(null); // Clear meta if user logs out
    }

    return () => {
      if (unsubscribeMeta) {
        try {
          unsubscribeMeta();
        } catch (e) {
          console.error("AuthContext: Error unsubscribing from onSnapshot for user meta:", e);
        }
      }
    };
  }, [currentUser]); // Re-run when currentUser changes (or db object, though db should be stable post-init)

  const logout = async () => {
    if (auth) {
      try {
        await auth.signOut();
        // setCurrentUser and setUserMeta will be updated by the onAuthStateChanged listener
      } catch (e) {
        console.error("Logout failed:", e);
      }
    } else {
      console.error("Logout failed: Firebase auth is not initialized.");
      // Manually clear state if auth service itself is not available
      setCurrentUser(null);
      setUserMeta(null);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userMeta, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
