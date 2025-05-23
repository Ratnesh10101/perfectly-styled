
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

console.log("firebase.ts module evaluated on server or client."); // MODULE-LEVEL LOG

function initializeFirebase(): void {
  if (firebaseInitialized) {
    if (typeof window !== "undefined") {
      console.log("Firebase already initialized (or initialization previously attempted). Skipping.");
    }
    return;
  }

  console.log("Attempting Firebase initialization...");

  try {
    const apiKey = sanitizeString(rawFirebaseConfigValues.apiKey);
    const authDomain = sanitizeString(rawFirebaseConfigValues.authDomain);
    const projectId = sanitizeString(rawFirebaseConfigValues.projectId);
    // Optional values
    const storageBucket = sanitizeString(rawFirebaseConfigValues.storageBucket);
    const messagingSenderId = sanitizeString(rawFirebaseConfigValues.messagingSenderId);
    const appId = sanitizeString(rawFirebaseConfigValues.appId);
    const measurementId = sanitizeString(rawFirebaseConfigValues.measurementId);

    // Log raw environment variables for diagnostics, especially for server-side where .env might not be as direct
    if (typeof window === "undefined" || process.env.NODE_ENV === "development") {
        console.log("Raw NEXT_PUBLIC_FIREBASE_API_KEY:", JSON.stringify(rawFirebaseConfigValues.apiKey), typeof rawFirebaseConfigValues.apiKey);
        console.log("Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", JSON.stringify(rawFirebaseConfigValues.authDomain), typeof rawFirebaseConfigValues.authDomain);
        console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID:", JSON.stringify(rawFirebaseConfigValues.projectId), typeof rawFirebaseConfigValues.projectId);
    }
    
    const criticalVars: { name: string, value: string | undefined }[] = [
        { name: "NEXT_PUBLIC_FIREBASE_API_KEY", value: apiKey },
        { name: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", value: authDomain },
        { name: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", value: projectId },
    ];
    const missingOrInvalidCriticalVars = criticalVars.filter(v => !v.value || typeof v.value !== 'string' || v.value.trim() === '');

    if (missingOrInvalidCriticalVars.length > 0) {
      const varNames = missingOrInvalidCriticalVars.map(v => v.name).join(", ");
      firebaseInitError = `Firebase Initialization Error: The following critical environment variables are missing, empty, or invalid: ${varNames}. Firebase will not be initialized. Please check your project's environment variable configuration in your deployment environment (server-side and build-time) and ensure they are correctly set and propagated.`;
      console.error(firebaseInitError);
      firebaseInitialized = true; // Mark as initialization attempted
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

    if (typeof window !== "undefined" || process.env.NODE_ENV === "development") { // Log more broadly
      console.log("Firebase config object being used by client/server:", firebaseConfig);
    }

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully.");
    } else {
      app = getApps()[0];
      console.log("Reusing existing Firebase app instance.");
    }

    if (app) {
      try {
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("Firebase Auth and Firestore services obtained successfully.");
      } catch (serviceError: any) {
        firebaseInitError = `Firebase: Error obtaining Auth/Firestore services after app initialization: ${serviceError?.message || serviceError}. This might indicate an issue with the project configuration not being fully recognized by these services, or a problem with the services themselves in your Firebase project. Ensure API key restrictions and enabled APIs (like Identity Toolkit API) are correctly set in Google Cloud Console.`;
        console.error(firebaseInitError, serviceError);
        auth = null;
        db = null;
      }

      if (typeof window !== "undefined" && measurementId) {
        isAnalyticsSupported()
          .then((supported) => {
            if (supported && app) {
              try {
                analytics = getAnalytics(app);
                console.log("Firebase Analytics initialized.");
              } catch (analyticsError: any) {
                console.error("Error initializing Firebase Analytics:", analyticsError?.message || analyticsError);
                // analytics remains null
              }
            } else if (supported === false) {
              console.log("Firebase Analytics is not supported in this environment.");
            }
          })
          .catch((err) => {
            console.error("Error checking Firebase Analytics support:", err);
          });
      }
    } else {
      // This case should be covered by the criticalVars check, but as a fallback:
      if (!firebaseInitError) { // Only set if not already set by missing vars
        firebaseInitError = "Firebase app object is null after initialization attempt, despite passing initial config checks. This is unexpected.";
        console.error(firebaseInitError);
      }
    }
  } catch (error: any) {
    // Catch any other unexpected error during the initialization process
    firebaseInitError = `UNHANDLED Firebase Initialization Error during initializeFirebase function: ${error?.message || error}`;
    console.error(firebaseInitError, error);
    app = null;
    auth = null;
    db = null;
    analytics = null;
  } finally {
    firebaseInitialized = true; // Ensure this is always set after an attempt
  }
}

// On-demand getter for safe SSR usage (can still be useful, but direct export is now primary)
export function getFirebaseServices() {
  if (!firebaseInitialized) { // Should not happen if module is imported, as initializeFirebase runs
    initializeFirebase();
  }
  return {
    app,
    auth,
    db,
    analytics,
    firebaseInitError
  };
}

// Immediate init
initializeFirebase();

// Export the initialized services and status variables
export { app, auth, db, analytics, firebaseInitError, firebaseInitialized };

// Keep this for legacy or specific checks if needed, but direct export of firebaseInitialized is primary
export const isFirebaseInitialized = () => firebaseInitialized;
export const currentFirebaseConfigValues = rawFirebaseConfigValues;
