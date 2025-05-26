
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';
import { getFirestore, type Firestore } from 'firebase/firestore';
// Auth is no longer used, so getAuth is removed
// import { getAuth, type Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
// let auth: Auth | null = null; // Auth removed
let db: Firestore | null = null;
let analytics: Analytics | null = null;
let firebaseInitialized = false;
let firebaseInitError: string | null = null;
let currentFirebaseConfigValues: any = {}; // For debugging

console.log("firebase.ts module evaluation started (Client or Server).");

// --- IMMEDIATE TOP-LEVEL CHECK FOR SERVER ENVIRONMENT ---
const criticalEnvVars = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const missingVars = Object.entries(criticalEnvVars)
  .filter(([key, value]) => !value || typeof value !== 'string' || value.trim() === '')
  .map(([key]) => key);

if (missingVars.length > 0) {
  firebaseInitError = `CRITICAL SERVER STARTUP ERROR: The following critical Firebase environment variables are missing or invalid: ${missingVars.join(', ')}. Firebase SDK WILL NOT initialize. This will lead to runtime errors on both client and server (e.g., 'Internal Server Error' or 'missing required error components'). CHECK YOUR DEPLOYMENT ENVIRONMENT'S VARIABLE CONFIGURATION AND RE-DEPLOY.`;
  console.error("**********************************************************************************");
  console.error(firebaseInitError);
  console.error("**********************************************************************************");
}
// --- END OF IMMEDIATE TOP-LEVEL CHECK ---


function initializeFirebase() {
  // Prevent re-initialization if already done or if critical vars missing
  if (firebaseInitialized || firebaseInitError) {
    if (firebaseInitError) {
      console.warn("Firebase initialization skipped due to critical environment variable errors detected at module load.");
    } else {
      console.log("Firebase already initialized.");
    }
    return;
  }

  try {
    console.log("Attempting Firebase initialization...");

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || undefined,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || undefined,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || undefined,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || undefined,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || undefined,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || undefined,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
    };
    currentFirebaseConfigValues = { ...firebaseConfig }; // Store for debugging

    // Log raw env var values for easier debugging
    console.log("Raw NEXT_PUBLIC_FIREBASE_API_KEY:", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_API_KEY), typeof process.env.NEXT_PUBLIC_FIREBASE_API_KEY, process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.length);
    console.log("Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN), typeof process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.length);
    console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID:", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID), typeof process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.length);
    
    console.log("Firebase config object being used for initializeApp:", currentFirebaseConfigValues);


    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
      firebaseInitError = `Firebase Error: Critical configuration properties (apiKey, authDomain, projectId) are missing or empty AFTER attempting to read from process.env. Values: apiKey='${firebaseConfig.apiKey}', authDomain='${firebaseConfig.authDomain}', projectId='${firebaseConfig.projectId}'. Firebase will not be initialized. This usually means NEXT_PUBLIC_ environment variables are not set correctly in your build/deployment environment.`;
      console.error(firebaseInitError);
      firebaseInitialized = true; // Mark as "initialized" to prevent re-attempts, even though it failed.
      return;
    }

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully.");
    } else {
      app = getApps()[0];
      console.log("Firebase app already exists, using existing instance.");
    }

    // auth = getAuth(app); // Auth removed
    // console.log("Firebase Auth service obtained. Configured with projectId:", auth.app.options.projectId);

    db = getFirestore(app);
    console.log("Firebase Firestore service obtained.");


    if (typeof window !== 'undefined' && app) {
      isAnalyticsSupported().then(supported => {
        if (supported && firebaseConfig.measurementId) {
          analytics = getAnalytics(app);
          console.log("Firebase Analytics initialized.");
        } else {
          console.log("Firebase Analytics is not supported in this environment or measurementId is missing.");
        }
      }).catch(err => console.error("Error checking analytics support:", err));
    }
    firebaseInitialized = true;

  } catch (error: any) {
    firebaseInitError = `Firebase initializeApp error: ${error.message}. Check your Firebase project configuration and API key settings in Google Cloud Console. Details: ${error.stack}`;
    console.error(firebaseInitError);
    // Ensure services are null if init fails
    app = null;
    // auth = null; // Auth removed
    db = null;
    analytics = null;
    firebaseInitialized = true; // Mark as "initialized" to prevent re-attempts
  }
}

// Call initialization when the module is loaded
initializeFirebase();

export { app, db, analytics, firebaseInitialized, firebaseInitError, currentFirebaseConfigValues };
// Auth removed from exports
// export { app, auth, db, analytics, firebaseInitialized, firebaseInitError, currentFirebaseConfigValues };
