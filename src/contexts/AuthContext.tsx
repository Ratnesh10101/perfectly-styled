
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
  try {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let unsubscribeAuth: (() => void) | undefined;

      if (!firebaseInitialized || firebaseInitError) {
        console.error(
          "AuthContext: Firebase was not initialized successfully or is in an error state. Cannot set up auth listeners. Error reported by firebase.ts:",
          firebaseInitError
        );
        setLoading(false);
        return; 
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
                    }); 
                  }
                } else {
                  console.error("AuthContext: Firebase 'db' is not initialized. Cannot fetch initial user meta.");
                  setUserMeta({
                    email: user.email,
                    hasPaid: false,
                    hasGeneratedReport: false,
                    questionnaireComplete: false,
                  }); 
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
    }, []); 

    useEffect(() => {
      let unsubscribeMeta: (() => void) | undefined;

      if (!firebaseInitialized || firebaseInitError || !db) {
        if (db === null && firebaseInitialized && !firebaseInitError) {
          console.error("AuthContext: Firebase 'db' is not initialized. Cannot set up meta listener.");
        }
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
                email: currentUser.email, 
                hasPaid: false,
                hasGeneratedReport: false,
                questionnaireComplete: false,
              });
            }
          );
        } catch (e) {
          console.error("AuthContext: Error setting up Firestore onSnapshot listener for user meta:", e);
          setUserMeta({
              email: currentUser.email,
              hasPaid: false,
              hasGeneratedReport: false,
              questionnaireComplete: false,
          });
        }
      } else if (!currentUser) {
        setUserMeta(null); 
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
        setCurrentUser(null);
        setUserMeta(null);
      }
    };

    const contextValue = {
      currentUser,
      userMeta,
      loading,
      logout,
    };

    if (firebaseInitError && !loading) {
      console.error("AuthProvider rendering with firebaseInitError:", firebaseInitError, "Context value:", contextValue);
    }

    return (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    );
  } catch (error) {
    console.error("CRITICAL ERROR WITHIN AuthProvider render logic:", error);
    // Fallback rendering in case AuthProvider itself crashes catastrophically.
    return (
      <div>
        <p style={{ color: 'red', padding: '20px', border: '2px solid red', margin: '20px', fontFamily: 'sans-serif', fontSize: '16px' }}>
          A critical error occurred while initializing the application&apos;s authentication context.
          This usually indicates a problem with Firebase configuration or missing environment variables in the deployment.
          Please check the browser console and server logs for more details.
        </p>
        {/* Render children if safe, or omit to prevent further errors */}
         {/* {children} */}
      </div>
    );
  }
};
