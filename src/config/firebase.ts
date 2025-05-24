
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

console.log("firebase.ts module evaluation started (Client or Server).");

// --- IMMEDIATE TOP-LEVEL CHECK FOR SERVER ENVIRONMENT ---
if (typeof window === 'undefined') { // Running on the server
  const serverApiKey = sanitizeString(rawFirebaseConfigValues.apiKey);
  const serverAuthDomain = sanitizeString(rawFirebaseConfigValues.authDomain);
  const serverProjectId = sanitizeString(rawFirebaseConfigValues.projectId);
  if (!serverApiKey || !serverAuthDomain || !serverProjectId) {
    firebaseInitError = `CRITICAL SERVER STARTUP ERROR: Firebase environment variables (NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID) are missing or empty in the server's execution environment. Firebase will NOT initialize. This is a fatal error for server-side operations. Check deployment configuration.`;
    console.error("**********************************************************************************");
    console.error(firebaseInitError);
    console.error("**********************************************************************************");
  }
}
// --- END OF IMMEDIATE TOP-LEVEL CHECK ---

function initializeFirebase(): void {
  if (firebaseInitialized || firebaseInitError) { // Added firebaseInitError check
    if (firebaseInitError) {
        console.warn("Firebase initialization previously failed or was skipped due to missing critical server env vars. Error:", firebaseInitError);
    }
    return;
  }
  try {
    if (typeof window !== "undefined") { // Log raw values only on client for easier debugging
      console.log("Raw NEXT_PUBLIC_FIREBASE_API_KEY:", JSON.stringify(rawFirebaseConfigValues.apiKey), `(type: ${typeof rawFirebaseConfigValues.apiKey}, length: ${rawFirebaseConfigValues.apiKey?.length})`);
      console.log("Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", JSON.stringify(rawFirebaseConfigValues.authDomain), `(type: ${typeof rawFirebaseConfigValues.authDomain}, length: ${rawFirebaseConfigValues.authDomain?.length})`);
      console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID:", JSON.stringify(rawFirebaseConfigValues.projectId), `(type: ${typeof rawFirebaseConfigValues.projectId}, length: ${rawFirebaseConfigValues.projectId?.length})`);
    }

    const apiKey = sanitizeString(rawFirebaseConfigValues.apiKey);
    const authDomain = sanitizeString(rawFirebaseConfigValues.authDomain);
    const projectId = sanitizeString(rawFirebaseConfigValues.projectId);
    const storageBucket = sanitizeString(rawFirebaseConfigValues.storageBucket);
    const messagingSenderId = sanitizeString(rawFirebaseConfigValues.messagingSenderId);
    const appId = sanitizeString(rawFirebaseConfigValues.appId);
    const measurementId = sanitizeString(rawFirebaseConfigValues.measurementId);

    const criticalVars: { name: string, value: string | undefined }[] = [
        { name: "NEXT_PUBLIC_FIREBASE_API_KEY", value: apiKey },
        { name: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", value: authDomain },
        { name: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", value: projectId },
    ];
    const missingOrInvalidCriticalVars = criticalVars.filter(v => !v.value || typeof v.value !== 'string' || v.value.trim() === '');

    if (missingOrInvalidCriticalVars.length > 0) {
      const varNames = missingOrInvalidCriticalVars.map(v => v.name).join(", ");
      firebaseInitError = `Firebase Initialization Error: The following critical environment variables are missing or empty: ${varNames}. Firebase will not be initialized. This impacts BOTH client-side and server-side functionality. Ensure these variables are correctly set in your deployment environment (e.g., Firebase Functions configuration, CI/CD settings, or .env files for local/build). If you are seeing 'missing required error components', this is a likely cause on the server. Check API key restrictions and enabled services (like Identity Toolkit API) in Google Cloud Console.`;
      console.error(firebaseInitError);
      firebaseInitialized = true; // Mark as initialized to prevent re-attempts
      return;
    }

    const firebaseConfig = {
      apiKey: apiKey?.trim(),
      authDomain: authDomain?.trim(),
      projectId: projectId?.trim(),
      storageBucket: storageBucket?.trim(),
      messagingSenderId: messagingSenderId?.trim(),
      appId: appId?.trim(),
      measurementId: measurementId?.trim()
    };

    // console.log("Attempting Firebase initialization with config:", firebaseConfig); // Removed this specific log as requested

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
        if (typeof window === 'undefined' && auth && auth.app && auth.app.options) { // Server-side log
             // console.log("DEBUG (Server): Initialized Auth service is using options:", JSON.stringify(auth.app.options));
        } else if (auth && auth.app && auth.app.options) { // Client-side log
            // console.log("DEBUG (Client): Initialized Auth service is using options:", JSON.stringify(auth.app.options));
        }
      } catch (serviceError: any) {
        firebaseInitError = `Firebase: Error obtaining Auth/Firestore services after app initialization: ${serviceError?.message || serviceError}. This might indicate an issue with the project configuration not being fully recognized by these services, or a problem with the services themselves in your Firebase project. Ensure API key restrictions and enabled APIs (like Identity Toolkit API) are correctly set in Google Cloud Console.`;
        console.error(firebaseInitError, serviceError);
        auth = null;
        db = null;
      }

      if (typeof window !== "undefined" && measurementId && app) {
        isAnalyticsSupported()
          .then((supported) => {
            if (supported && app) {
              try {
                analytics = getAnalytics(app);
                console.log("Firebase Analytics initialized.");
              } catch (analyticsError: any) {
                console.error("Error initializing Firebase Analytics:", analyticsError?.message || analyticsError);
                analytics = null; // Ensure analytics is null if init fails
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
      if (!firebaseInitError) {
        firebaseInitError = "Firebase app object is null after initialization attempt, despite passing initial config checks. The Firebase SDK might be rejecting the provided configuration for reasons not caught by basic checks (e.g. malformed Project ID format, invalid API key structure). This usually indicates a severe problem with the deployment environment's configuration for NEXT_PUBLIC_... variables.";
        console.error(firebaseInitError);
      }
    }
  } catch (error: any) {
    firebaseInitError = `UNHANDLED Firebase Initialization Error during initializeFirebase function: ${error?.message || error}. This is a critical failure in setting up Firebase. Check server logs if this occurs during deployment/SSR. This can lead to 'missing required error components' if it happens server-side.`;
    console.error(firebaseInitError, error);
    app = null;
    auth = null;
    db = null;
    analytics = null;
  } finally {
    firebaseInitialized = true;
  }
}

initializeFirebase();

export { app, auth, db, analytics, firebaseInitialized, firebaseInitError };

export const isFirebaseInitialized = () => firebaseInitialized;
export const currentFirebaseConfigValues = rawFirebaseConfigValues;

    