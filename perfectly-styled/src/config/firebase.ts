
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';

// --- IMMEDIATE TOP-LEVEL CHECK FOR CRITICAL ENVIRONMENT VARIABLES ---
// This check runs when the module is first loaded, on server or client.
let initialFirebaseInitError: string | null = null;
const criticalEnvVarNames = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  // Add other critical vars if they become non-optional for basic app functionality
];
const missingCriticalVars = criticalEnvVarNames.filter(varName => {
  const value = process.env[varName];
  return !value || typeof value !== 'string' || value.trim() === '';
});

if (missingCriticalVars.length > 0) {
  initialFirebaseInitError = `CRITICAL ${typeof window === 'undefined' ? 'SERVER' : 'CLIENT'} STARTUP ERROR: The following critical Firebase environment variables are missing or empty: ${missingCriticalVars.join(', ')}. Firebase SDK WILL NOT initialize. This can lead to severe application instability, including 'Internal Server Error' or 'missing required error components' on the deployed site. CHECK YOUR ${typeof window === 'undefined' ? 'SERVER DEPLOYMENT/FUNCTION' : 'BUILD'} ENVIRONMENT'S VARIABLE CONFIGURATION AND RE-DEPLOY. Ensure NEXT_PUBLIC_ variables are available during build and runtime. This error is from src/config/firebase.ts.`;
  console.error("**********************************************************************************");
  console.error(initialFirebaseInitError);
  if (typeof window === 'undefined') { // Only log process.env details on server
    console.error("Server-side check - current process.env for Firebase keys (from firebase.ts):");
    criticalEnvVarNames.forEach(varName => {
      console.error(`${varName}: ${JSON.stringify(process.env[varName])}`);
    });
  }
  console.error("**********************************************************************************");
}
// --- END OF IMMEDIATE TOP-LEVEL CHECK ---

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;

let firebaseInitialized = false;
// Initialize firebaseInitError with error from top-level check
let firebaseInitError: string | null = initialFirebaseInitError;
let currentFirebaseConfigValues: any = {}; // For debugging

console.log(`firebase.ts module evaluation started (Client or Server). Initial Firebase Init Error (from firebase.ts module scope): ${firebaseInitError || "None"}`);

function initializeFirebase() {
  if (firebaseInitialized) { // Prevent re-initialization
    if (firebaseInitError) {
      console.warn("Firebase initialization previously attempted and failed with (from firebase.ts): ", firebaseInitError);
    }
    return;
  }

  // If critical vars were missing at module load, don't even attempt.
  if (firebaseInitError) {
    console.error("Skipping Firebase SDK initializeApp() call due to pre-existing critical environment variable errors (from firebase.ts).");
    firebaseInitialized = true; // Mark as "attempted"
    return;
  }

  console.log("Attempting Firebase SDK initializeApp() (from firebase.ts)...");
  try {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || undefined,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || undefined,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || undefined,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || undefined,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || undefined,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || undefined,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
    };
    currentFirebaseConfigValues = { ...firebaseConfig }; // For debugging

    // Log raw values being read for diagnostics
    if (typeof window !== 'undefined') { // Client-side
        console.log("Raw NEXT_PUBLIC_FIREBASE_API_KEY (client, from firebase.ts):", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_API_KEY));
        console.log("Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (client, from firebase.ts):", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN));
        console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID (client, from firebase.ts):", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID));
    } else { // Server-side
        console.log("Raw NEXT_PUBLIC_FIREBASE_API_KEY (server, from firebase.ts):", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_API_KEY));
        console.log("Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (server, from firebase.ts):", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN));
        console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID (server, from firebase.ts):", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID));
    }
    
    console.log("Firebase config object being constructed (from firebase.ts):", JSON.stringify(currentFirebaseConfigValues, null, 2));

    // Secondary check inside function, more robust
    const missingConfigPropsInFunc = criticalEnvVarNames.filter(varName => {
      const key = varName.replace('NEXT_PUBLIC_FIREBASE_', '').toLowerCase();
      const mappedKey =
        key === 'api_key' ? 'apiKey' :
        key === 'auth_domain' ? 'authDomain' :
        key === 'project_id' ? 'projectId' :
        key === 'storage_bucket' ? 'storageBucket' :
        key === 'messaging_sender_id' ? 'messagingSenderId' :
        key === 'app_id' ? 'appId' :
        key === 'measurement_id' ? 'measurementId' :
        key; // fallback
      const value = firebaseConfig[mappedKey as keyof typeof firebaseConfig];
      return !value || typeof value !== 'string' || value.trim() === '';
    });

    if (missingConfigPropsInFunc.length > 0) {
        const configConstructionError = `Firebase Config Construction Error during initializeFirebase() (from firebase.ts): Critical properties derived from (${missingConfigPropsInFunc.join(', ')}) are missing or empty. This usually means NEXT_PUBLIC_ environment variables are not set correctly in your build/deployment environment or are not being passed to the client/server runtime correctly.`;
        console.error(configConstructionError);
        if (!firebaseInitError) firebaseInitError = configConstructionError; 
    }

    if (!getApps().length) {
      if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain) {
        app = initializeApp(firebaseConfig);
        console.log("Firebase app initialized successfully via initializeApp() (from firebase.ts).");
      } else {
        if (!firebaseInitError) { 
            firebaseInitError = "Firebase initializeApp() skipped (from firebase.ts): Critical config properties (apiKey, projectId, authDomain) were missing from the firebaseConfig object derived from environment variables.";
        }
        console.error(firebaseInitError);
      }
    } else {
      app = getApps()[0];
      console.log("Firebase app already exists, using existing instance (from firebase.ts).");
    }

    if (typeof window !== 'undefined' && firebaseConfig.measurementId && app) {
      isAnalyticsSupported().then(supported => {
        if (supported && app) { 
          analytics = getAnalytics(app);
          console.log("Firebase Analytics initialized (from firebase.ts).");
        } else {
          if (!app) {
            console.log("Firebase Analytics not initialized because Firebase app instance is null (from firebase.ts).");
          } else {
            console.log("Firebase Analytics is not supported in this environment or app is null (from firebase.ts).");
          }
        }
      }).catch(err => console.error("Error checking analytics support (from firebase.ts):", err));
    } else if (typeof window !== 'undefined' && !firebaseConfig.measurementId) {
        console.log("Firebase Analytics not initialized: measurementId is missing in config (from firebase.ts).");
    } else if (typeof window !== 'undefined' && !app) {
        console.log("Firebase Analytics not initialized: Firebase app is null (likely due to earlier init failure) (from firebase.ts).");
    }
  } catch (error: any) {
    firebaseInitError = `Firebase initializeApp() call critical error (from firebase.ts): ${error.message}. This is a severe issue. Details: ${error.stack || error}`;
    console.error("**********************************************************************************");
    console.error(firebaseInitError);
    console.error("Firebase config that was attempted with initializeApp() (from firebase.ts):", JSON.stringify(currentFirebaseConfigValues, null, 2));
    console.error("**********************************************************************************");
    app = null;
  } finally {
    firebaseInitialized = true; // Mark as initialization attempt completed
    if (!firebaseInitError && app) {
      console.log(`Firebase initialization completed (from firebase.ts). Status: SUCCESS. App ID: ${app.name}. Error: None`);
    } else if (firebaseInitError) {
      console.log(`Firebase initialization completed (from firebase.ts). Status: FAILED. Error: ${firebaseInitError}`);
    } else if (!app) { 
      const finalErrorMsg = "Firebase initialization completed (from firebase.ts), but app instance is null and no specific error was caught during initializeApp. This usually means critical env vars were missing before initializeApp() was called.";
      console.log(`Firebase initialization completed (from firebase.ts). Status: FAILED. Error: ${finalErrorMsg}`);
      if (!firebaseInitError) firebaseInitError = finalErrorMsg;
    }
  }
}

// Initialize Firebase when the module is loaded.
initializeFirebase();

export { app, analytics, firebaseInitialized, firebaseInitError, currentFirebaseConfigValues };
    