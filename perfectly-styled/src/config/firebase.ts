
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let firebaseInitialized = false;
let firebaseInitError: string | null = null;
// For debugging what values are actually seen by this module
let currentFirebaseConfigValues: any = {};

console.log("firebase.ts module evaluation started (Client or Server).");

// --- IMMEDIATE TOP-LEVEL CHECK FOR CRITICAL ENVIRONMENT VARIABLES ---
// This check runs when the module is first loaded, on server or client.
const criticalEnvVarNames = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
];
const missingCriticalVars = criticalEnvVarNames.filter(varName => {
  const value = process.env[varName];
  return !value || typeof value !== 'string' || value.trim() === '';
});

if (missingCriticalVars.length > 0) {
  firebaseInitError = `CRITICAL ${typeof window === 'undefined' ? 'SERVER' : 'CLIENT'} STARTUP ERROR: The following critical Firebase environment variables are missing or empty: ${missingCriticalVars.join(', ')}. Firebase SDK WILL NOT initialize. This can lead to 'Internal Server Error' or 'missing required error components'. CHECK YOUR DEPLOYMENT ENVIRONMENT'S VARIABLE CONFIGURATION AND RE-DEPLOY. Ensure NEXT_PUBLIC_ variables are available during build and runtime.`;
  console.error("**********************************************************************************");
  console.error(firebaseInitError);
  console.error("Current process.env values for Firebase keys (if available):");
  criticalEnvVarNames.forEach(varName => {
    console.error(`${varName}: ${JSON.stringify(process.env[varName])}`);
  });
  console.error("**********************************************************************************");
}
// --- END OF IMMEDIATE TOP-LEVEL CHECK ---

function initializeFirebase() {
  if (firebaseInitialized) {
    if (firebaseInitError) {
      console.warn("Firebase already attempted initialization and previously failed with: ", firebaseInitError);
    } else {
      // console.log("Firebase already successfully initialized.");
    }
    return;
  }

  // If critical vars were missing at module load, don't even attempt.
  if (firebaseInitError) {
    console.error("Skipping Firebase initialization due to pre-existing critical environment variable errors.");
    firebaseInitialized = true; // Mark as "attempted"
    return;
  }

  console.log("Attempting Firebase initialization...");
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

    // Log raw values being read (useful for client-side verification)
    if (typeof window !== 'undefined') {
        console.log("Raw NEXT_PUBLIC_FIREBASE_API_KEY (client):", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_API_KEY));
        console.log("Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (client):", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN));
        console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID (client):", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID));
    }
    
    // This check is somewhat redundant due to the top-level check, but provides finer-grained error for config object construction
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
      const missingProps = [];
      if (!firebaseConfig.apiKey) missingProps.push('apiKey (from NEXT_PUBLIC_FIREBASE_API_KEY)');
      if (!firebaseConfig.authDomain) missingProps.push('authDomain (from NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)');
      if (!firebaseConfig.projectId) missingProps.push('projectId (from NEXT_PUBLIC_FIREBASE_PROJECT_ID)');
      firebaseInitError = `Firebase Config Construction Error: Critical properties (${missingProps.join(', ')}) are missing or empty AFTER attempting to read from process.env. Firebase will not be initialized. This usually means NEXT_PUBLIC_ environment variables are not set correctly in your build/deployment environment or are not being passed to the client correctly. Review deployment settings.`;
      console.error(firebaseInitError);
      firebaseInitialized = true; // Mark as attempted
      return;
    }

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully.");
    } else {
      app = getApps()[0];
      console.log("Firebase app already exists, using existing instance.");
    }
    
    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      isAnalyticsSupported().then(supported => {
        if (supported && app) { // Added explicit 'app' check here
          analytics = getAnalytics(app);
          console.log("Firebase Analytics initialized.");
        } else {
          if (!app) {
            console.log("Firebase Analytics not initialized because Firebase app instance is null.");
          } else {
            console.log("Firebase Analytics is not supported in this environment or app is null.");
          }
        }
      }).catch(err => console.error("Error checking analytics support:", err));
    } else if (typeof window !== 'undefined' && !firebaseConfig.measurementId) {
        console.log("Firebase Analytics not initialized because measurementId is missing in config.");
    }
    firebaseInitialized = true; // Mark as successfully attempted or completed
    
  } catch (error: any) {
    firebaseInitError = `Firebase initializeApp() call critical error: ${error.message}. This is a severe issue. Details: ${error.stack || error}`;
    console.error("**********************************************************************************");
    console.error(firebaseInitError);
    console.error("Firebase config that was attempted:", JSON.stringify(currentFirebaseConfigValues, null, 2));
    console.error("**********************************************************************************");
    app = null;
    analytics = null;
    firebaseInitialized = true; // Mark as attempted, even if failed
  } finally {
    console.log(`Firebase initialization attempt complete. Status: ${firebaseInitError ? 'FAILED' : 'SUCCESS'}. Error: ${firebaseInitError || 'None'}`);
  }
}

// Initialize Firebase when the module is loaded.
initializeFirebase();

export { app, analytics, firebaseInitialized, firebaseInitError, currentFirebaseConfigValues };
