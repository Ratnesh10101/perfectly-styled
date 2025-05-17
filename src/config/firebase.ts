
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from "firebase/analytics";

// Helper to sanitize environment variables
function sanitizeString(value: string | undefined): string {
  return String(value || "").trim();
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

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;
let firebaseInitialized = false;
let firebaseInitError: string | null = null;

function initializeFirebase() {
  if (firebaseInitialized) return;

  const apiKey = sanitizeString(rawFirebaseConfigValues.apiKey);
  const authDomain = sanitizeString(rawFirebaseConfigValues.authDomain);
  const projectId = sanitizeString(rawFirebaseConfigValues.projectId);
  const storageBucket = sanitizeString(rawFirebaseConfigValues.storageBucket);
  const messagingSenderId = sanitizeString(rawFirebaseConfigValues.messagingSenderId);
  const appId = sanitizeString(rawFirebaseConfigValues.appId);
  const measurementId = sanitizeString(rawFirebaseConfigValues.measurementId);

  if (typeof window !== 'undefined') { // Log these only on the client to avoid noise on server logs if not relevant
    console.log("Raw NEXT_PUBLIC_FIREBASE_API_KEY:", JSON.stringify(rawFirebaseConfigValues.apiKey), typeof rawFirebaseConfigValues.apiKey, rawFirebaseConfigValues.apiKey?.length);
    console.log("Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", JSON.stringify(rawFirebaseConfigValues.authDomain), typeof rawFirebaseConfigValues.authDomain, rawFirebaseConfigValues.authDomain?.length);
    console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID:", JSON.stringify(rawFirebaseConfigValues.projectId), typeof rawFirebaseConfigValues.projectId, rawFirebaseConfigValues.projectId?.length);
  }

  const missingVars: string[] = [];
  if (!apiKey) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!authDomain) missingVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");

  if (missingVars.length > 0) {
    firebaseInitError = `CRITICAL Firebase Initialization Error: The following environment variables are MISSING or EMPTY: ${missingVars.join(", ")}. These MUST be set in your application's deployment environment (for both client-side build and server-side runtime). Firebase will NOT be initialized, impacting ALL Firebase-dependent functionality. Please check your Firebase Hosting/Functions (or other deployment service) environment variable configuration.`;
    console.error(firebaseInitError);
    firebaseInitialized = true;
    app = null; auth = null; db = null; analytics = null;
    return;
  }

  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId,
  };

  if (typeof window !== 'undefined') {
     console.log("Firebase config object being used by client:", firebaseConfig);
  }
  // console.log("Attempting Firebase initialization with config:", firebaseConfig);


  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully.");
    } else {
      app = getApps()[0];
      console.log("Firebase app already initialized (reused existing instance).");
    }

    if (app) {
      try {
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("Firebase Auth and Firestore services obtained successfully.");
      } catch (serviceError: any) {
        firebaseInitError = `Firebase: Error obtaining Auth/Firestore services after app init: ${serviceError.message || serviceError}. This often indicates an issue with the provided Firebase config values (apiKey, projectId, etc.) or network connectivity to Firebase services.`;
        console.error(firebaseInitError, serviceError);
        auth = null;
        db = null;
      }

      if (typeof window !== 'undefined' && app && measurementId) {
        isAnalyticsSupported().then(supported => {
          if (supported) {
            try {
              analytics = getAnalytics(app!); // app should be non-null here
              console.log("Firebase Analytics initialized.");
            } catch (analyticsError: any) {
              console.error(`Firebase: Error initializing Analytics service: ${analyticsError.message || analyticsError}`, analyticsError);
              analytics = null;
            }
          } else {
            // console.log("Firebase Analytics is not supported in this environment.");
          }
        }).catch(err => console.error("Error checking analytics support:", err));
      }
    } else {
      firebaseInitError = "Firebase app object is null after initialization attempt. Firebase services (Auth, Firestore) will not be available.";
      console.error(firebaseInitError);
      auth = null; db = null; analytics = null;
    }
  } catch (error: any) {
    firebaseInitError = `Firebase initializeApp critical error: ${error.message || error}. This usually means the firebaseConfig object itself is malformed or core Firebase services are unreachable. Double check all NEXT_PUBLIC_FIREBASE_... environment variables.`;
    console.error(firebaseInitError, error);
    app = null; auth = null; db = null; analytics = null;
  }
  firebaseInitialized = true;
}

initializeFirebase();

export { app, auth, db, analytics, firebaseInitialized, firebaseInitError, rawFirebaseConfigValues as currentFirebaseConfigValues };
