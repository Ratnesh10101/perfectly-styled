
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
  apiKey: "AIzaSyDxycR2hu4dXoJnScRbRc3UZviWdEyVHYk",
  authDomain: "perfectly-styled.firebaseapp.com",
  projectId: "perfectly-styled",
  storageBucket: "perfectly-styled.firebasestorage.app",
  messagingSenderId: "377334244117",
  appId: "1:377334244117:web:3fff766d728fd838a83f1c",
  measurementId: "G-LLZ1XNNXET"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;
let firebaseInitialized = false;
let firebaseInitError: string | null = null;

// This function will now only run once
function initializeFirebase() {
  if (firebaseInitialized) return;

  if (typeof window !== 'undefined') {
    console.log("Raw NEXT_PUBLIC_FIREBASE_API_KEY:", JSON.stringify(rawFirebaseConfigValues.apiKey), typeof rawFirebaseConfigValues.apiKey, rawFirebaseConfigValues.apiKey?.length);
    console.log("Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", JSON.stringify(rawFirebaseConfigValues.authDomain), typeof rawFirebaseConfigValues.authDomain, rawFirebaseConfigValues.authDomain?.length);
    console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID:", JSON.stringify(rawFirebaseConfigValues.projectId), typeof rawFirebaseConfigValues.projectId, rawFirebaseConfigValues.projectId?.length);
  }

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
  // Add other critical vars here if needed, e.g., appId

  if (missingVars.length > 0) {
    firebaseInitError = `CRITICAL Firebase Initialization Error: The following environment variables are MISSING or EMPTY: ${missingVars.join(", ")}. These MUST be set in your application's build AND runtime/server environment (e.g., Firebase Hosting/Functions config, .env file for local dev). Firebase will NOT be initialized, impacting both client and server-side functionality.`;
    console.error(firebaseInitError);
    firebaseInitialized = true; // Mark as initialization attempted
    app = null; auth = null; db = null; analytics = null;
    return; // Do not proceed with initialization
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
  console.log("Attempting Firebase initialization with config:", firebaseConfig);


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
        firebaseInitError = `Firebase: Error obtaining Auth/Firestore services after app init: ${serviceError.message || serviceError}`;
        console.error(firebaseInitError, serviceError);
        auth = null;
        db = null;
      }

      if (typeof window !== 'undefined' && app && measurementId) { // Only init analytics if app exists and measurementId is provided
        isAnalyticsSupported().then(supported => {
          if (supported) {
            try {
              analytics = getAnalytics(app!);
              console.log("Firebase Analytics initialized.");
            } catch (analyticsError: any) {
              console.error(`Firebase: Error initializing Analytics service: ${analyticsError.message || analyticsError}`, analyticsError);
              analytics = null;
            }
          } else {
            // This is not an error, just an info message.
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
    firebaseInitError = `Firebase initializeApp critical error: ${error.message || error}`;
    console.error(firebaseInitError, error);
    app = null; auth = null; db = null; analytics = null;
  }
  firebaseInitialized = true; // Mark as initialization attempted
}

initializeFirebase();

export { app, auth, db, analytics, firebaseInitialized, firebaseInitError, rawFirebaseConfigValues as currentFirebaseConfigValues };
