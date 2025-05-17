
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from "firebase/analytics";

// Helper to sanitize environment variables
function sanitizeString(value: string | undefined): string {
  return String(value || "").trim();
}

// Original config values from process.env
const rawFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Cleaned config object
const firebaseConfig = {
  apiKey: sanitizeString(rawFirebaseConfig.apiKey),
  authDomain: sanitizeString(rawFirebaseConfig.authDomain),
  projectId: sanitizeString(rawFirebaseConfig.projectId),
  storageBucket: sanitizeString(rawFirebaseConfig.storageBucket),
  messagingSenderId: sanitizeString(rawFirebaseConfig.messagingSenderId),
  appId: sanitizeString(rawFirebaseConfig.appId),
  measurementId: sanitizeString(rawFirebaseConfig.measurementId),
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

function initializeFirebase() {
  if (typeof window !== 'undefined') {
    console.log("Raw NEXT_PUBLIC_FIREBASE_API_KEY:", JSON.stringify(rawFirebaseConfig.apiKey), typeof rawFirebaseConfig.apiKey, rawFirebaseConfig.apiKey?.length);
    console.log("Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", JSON.stringify(rawFirebaseConfig.authDomain), typeof rawFirebaseConfig.authDomain, rawFirebaseConfig.authDomain?.length);
    console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID:", JSON.stringify(rawFirebaseConfig.projectId), typeof rawFirebaseConfig.projectId, rawFirebaseConfig.projectId?.length);
    console.log("Firebase config object being used by client:", firebaseConfig);
  }

  const missingVars: string[] = [];
  if (!firebaseConfig.apiKey) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!firebaseConfig.authDomain) missingVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!firebaseConfig.projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");

  if (missingVars.length > 0) {
    const errorMessage = `Firebase Initialization Error: The following critical environment variables are missing or empty: ${missingVars.join(", ")}. These MUST be set in your build/deployment environment. Firebase will not be initialized.`;
    if (typeof window === 'undefined') {
      // Server-side specific log
      console.error(`SERVER_SIDE_ERROR: ${errorMessage}`);
    } else {
      // Client-side log
      console.error(errorMessage);
    }
    // Do not proceed with initialization if critical config is missing
    return;
  }

  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      if (typeof window !== 'undefined') {
        console.log("Firebase app initialized successfully.");
      }
    } else {
      app = getApps()[0];
      if (typeof window !== 'undefined') {
        console.log("Firebase app already initialized.");
      }
    }

    if (app) {
      auth = getAuth(app);
      db = getFirestore(app);
      // Initialize Analytics only on client side, if supported, AND if app was initialized
      if (typeof window !== 'undefined' && app) {
        isAnalyticsSupported().then(supported => {
          if (supported) {
            analytics = getAnalytics(app);
            console.log("Firebase Analytics initialized.");
          } else {
            console.log("Firebase Analytics is not supported in this environment.");
          }
        }).catch(err => console.error("Error checking analytics support:", err));
      }
    } else {
        // This case should ideally be caught by missingVars check, but as a fallback:
        console.error("Firebase app object is null after initialization attempt. Firebase services (Auth, Firestore) will not be available.");
    }
  } catch (error) {
    console.error("Firebase initializeApp error:", error);
    // Ensure services are null if initialization fails
    app = null;
    auth = null;
    db = null;
    analytics = null;
  }
}

initializeFirebase(); // Call initialization

export { app, auth, db, analytics, firebaseConfig as currentFirebaseConfig };
