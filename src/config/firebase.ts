import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from "firebase/analytics";

// Helper to sanitize environment variables
function sanitizeString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === "" ? undefined : trimmed;
}

// Original config values from process.env
const rawFirebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Firebase services (initialized once)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;
let firebaseInitialized = false;
let firebaseInitError: string | null = null;

function initializeFirebase(): void {
  if (firebaseInitialized) return;

  try {
    const apiKey = sanitizeString(rawFirebaseConfigValues.apiKey);
    const authDomain = sanitizeString(rawFirebaseConfigValues.authDomain);
    const projectId = sanitizeString(rawFirebaseConfigValues.projectId);
    const storageBucket = sanitizeString(rawFirebaseConfigValues.storageBucket);
    const messagingSenderId = sanitizeString(rawFirebaseConfigValues.messagingSenderId);
    const appId = sanitizeString(rawFirebaseConfigValues.appId);
    const measurementId = sanitizeString(rawFirebaseConfigValues.measurementId);

    const missingVars: string[] = [];
    if (!apiKey) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
    if (!authDomain) missingVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
    if (!projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");

    if (missingVars.length > 0) {
      firebaseInitError = `CRITICAL Firebase Initialization Error: Missing env vars: ${missingVars.join(", ")}`;
      console.error(firebaseInitError);
      firebaseInitialized = true;
      return;
    }

    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
      measurementId
    };

    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.log("Firebase config used by client:", firebaseConfig);
    }

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("Firebase app initialized successfully.");
      }
    } else {
      app = getApps()[0];
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("Reusing existing Firebase app instance.");
      }
    }

    if (app) {
      try {
        auth = getAuth(app);
        db = getFirestore(app);
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("Firebase Auth and Firestore initialized.");
        }
      } catch (serviceError: any) {
        firebaseInitError = `Error initializing Auth/Firestore: ${serviceError?.message || serviceError}`;
        console.error(firebaseInitError);
        auth = null;
        db = null;
      }

      if (typeof window !== "undefined" && measurementId) {
        isAnalyticsSupported()
          .then((supported) => {
            if (supported && app) {
              try {
                analytics = getAnalytics(app);
                if (process.env.NODE_ENV === "development") {
                  console.log("Firebase Analytics initialized.");
                }
              } catch (analyticsError: any) {
                console.error("Error initializing Analytics:", analyticsError?.message || analyticsError);
              }
            }
          })
          .catch((err) => {
            console.error("Error checking analytics support:", err);
          });
      }
    } else {
      firebaseInitError = "Firebase app object is null after initialization attempt.";
      console.error(firebaseInitError);
    }
  } catch (error: any) {
    firebaseInitError = `UNHANDLED Firebase Init Error: ${error?.message || error}`;
    console.error(firebaseInitError, error);
    app = null;
    auth = null;
    db = null;
    analytics = null;
  } finally {
    firebaseInitialized = true;
  }
}

// On-demand getter for safe SSR usage
export function getFirebaseServices() {
  if (!firebaseInitialized) initializeFirebase();
  return {
    app,
    auth,
    db,
    analytics,
    firebaseInitError
  };
}

// Immediate init (optional — can remove if you only want lazy init)
initializeFirebase();

export const isFirebaseInitialized = () => firebaseInitialized;
export const currentFirebaseConfigValues = rawFirebaseConfigValues;
