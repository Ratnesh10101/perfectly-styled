
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

function initializeFirebase(): void {
  if (firebaseInitialized) {
    return;
  }
  try {
    // Log raw values for diagnostics, especially in deployed environments
    if (typeof window !== "undefined" || process.env.NODE_ENV === "development") {
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
      firebaseInitError = `CRITICAL Firebase Initialization Error: The following environment variables are missing, empty, or invalid: ${varNames}. Firebase will NOT be initialized. This impacts BOTH client-side and server-side functionality. Ensure these variables are correctly set in your deployment environment (e.g., Firebase Functions configuration, CI/CD settings, or .env files for local/build). For server-side errors (like 'Internal Server Error'), check your Firebase Functions logs for specific details. Also verify API key restrictions and enabled services (like Identity Toolkit API) in Google Cloud Console.`;
      console.error(firebaseInitError);
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

    // console.log("Firebase config object being used by client/server:", firebaseConfig); // Removed as per user request

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
        if (auth && auth.app && auth.app.options) {
            console.log("DEBUG: Initialized Auth service is using options:", JSON.stringify(auth.app.options));
        } else if (auth) {
            console.warn("DEBUG: Initialized Auth service exists, but auth.app or auth.app.options is not available.");
        }
      } catch (serviceError: any) {
        firebaseInitError = `Firebase: Error obtaining Auth/Firestore services after app initialization: ${serviceError?.message || serviceError}. This might indicate an issue with the project configuration not being fully recognized by these services, or a problem with the services themselves in your Firebase project. Ensure API key restrictions and enabled APIs (like Identity Toolkit API) are correctly set in Google Cloud Console.`;
        console.error(firebaseInitError, serviceError);
        auth = null;
        db = null;
      }

      if (typeof window !== "undefined" && measurementId && app) { // Check app again
        isAnalyticsSupported()
          .then((supported) => {
            if (supported && app) { // Check app again
              try {
                analytics = getAnalytics(app);
                console.log("Firebase Analytics initialized.");
              } catch (analyticsError: any) {
                console.error("Error initializing Firebase Analytics:", analyticsError?.message || analyticsError);
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
      if (!firebaseInitError) { // Only set this if no more specific error was caught
        firebaseInitError = "Firebase app object is null after initialization attempt, despite passing initial config checks. The Firebase SDK might be rejecting the provided configuration for reasons not caught by basic checks (e.g. malformed Project ID format, invalid API key structure).";
        console.error(firebaseInitError);
      }
    }
  } catch (error: any) {
    // This outer catch is for very unexpected errors during the initializeFirebase function itself
    firebaseInitError = `UNHANDLED Firebase Initialization Error during initializeFirebase function: ${error?.message || error}. This is a critical failure in setting up Firebase. Check server logs if this occurs during deployment/SSR.`;
    console.error(firebaseInitError, error);
    app = null;
    auth = null;
    db = null;
    analytics = null;
  } finally {
    firebaseInitialized = true; // Ensure this is always set
  }
}

initializeFirebase();

// Export the initialized services and status variables
export { app, auth, db, analytics, firebaseInitialized, firebaseInitError };

export const isFirebaseInitialized = () => firebaseInitialized;
export const currentFirebaseConfigValues = rawFirebaseConfigValues;
