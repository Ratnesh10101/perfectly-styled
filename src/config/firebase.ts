// src/config/firebase.ts
"use client"; // Ensure this runs on the client where process.env is available

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, type Analytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

// Explicitly log required environment variables for client-side Firebase
// These are critical for the SDK to even attempt to connect to your project.
if (typeof window !== 'undefined') { // Only run these checks/logs in the client-side context
  console.log("CLIENT_SIDE_ENV_CHECK: NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "SET" : "MISSING_OR_EMPTY");
  console.log("CLIENT_SIDE_ENV_CHECK: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "SET" : "MISSING_OR_EMPTY");
  console.log("CLIENT_SIDE_ENV_CHECK: NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "SET" : "MISSING_OR_EMPTY");
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

let firebaseInitError: string | null = null;
let firebaseInitialized = false;

function initializeFirebaseServices() {
  if (firebaseInitialized) return;

  try {
    // Log raw values for critical config parts
    if (typeof window !== 'undefined') {
      console.log("Raw NEXT_PUBLIC_FIREBASE_API_KEY:", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_API_KEY), typeof process.env.NEXT_PUBLIC_FIREBASE_API_KEY, process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.length);
      console.log("Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN), typeof process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.length);
      console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID:", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID), typeof process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.length);
    }
    
    const criticalEnvVars = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    };

    const missingVars = Object.entries(criticalEnvVars)
      .filter(([key, value]) => !value || typeof value !== 'string' || value.trim() === "")
      .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`);

    if (missingVars.length > 0) {
      firebaseInitError = `CRITICAL Firebase Client SDK Initialization Error: The following critical environment variables are missing or empty: ${missingVars.join(", ")}. Firebase will not be initialized. This impacts BOTH client-side and server-side rendering/actions if they import this config. Ensure these are correctly set in your build and runtime environments. This can lead to 'missing required error components' or 'Internal Server Error'.`;
      console.error(firebaseInitError);
      firebaseInitialized = true; // Mark as "initialized" to prevent repeated attempts, even though it failed.
      return;
    }

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully.");
    } else {
      app = getApps()[0];
      console.log("Firebase app already initialized.");
    }

    if (app) {
      db = getFirestore(app);
      console.log("Firebase Firestore service obtained successfully.");

      // Initialize Analytics only on client-side and if supported
      if (typeof window !== 'undefined') {
        isAnalyticsSupported().then(supported => {
          if (supported) {
            analytics = getAnalytics(app as FirebaseApp);
            console.log("Firebase Analytics initialized.");
          } else {
            console.log("Firebase Analytics is not supported in this environment.");
          }
        }).catch(err => console.error("Error checking analytics support:", err));
      }
    } else {
      throw new Error("Firebase app object is null after initialization attempt.");
    }
    
  } catch (error: any) {
    firebaseInitError = `Firebase initializeApp error: ${error.message}. Check API key restrictions, enabled APIs (Identity Toolkit API), and environment variables in Google Cloud Console & your deployment settings.`;
    console.error(firebaseInitError, error);
    // Ensure services are null if init fails
    app = null;
    db = null;
    analytics = null;
  } finally {
    firebaseInitialized = true;
  }
}

// Initialize Firebase automatically when this module is loaded.
// This is important for client-side components that import db directly.
if (typeof window !== 'undefined') { // Only run auto-init on client
    initializeFirebaseServices();
}


// Export a function that components/actions can call if they need to ensure init,
// especially for server-side contexts where auto-init might not run or be desired.
export function ensureFirebaseInitialized() {
    if (!firebaseInitialized) {
        console.log("ensureFirebaseInitialized: Manually triggering Firebase initialization (likely server-side).");
        initializeFirebaseServices();
    }
}

export { app, db, analytics, firebaseInitError, firebaseInitialized };
