
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
// Auth and Firestore are no longer directly used/exported from this module in the no-auth flow
// import { getAuth, type Auth } from 'firebase/auth';
// import { getFirestore, type Firestore } from 'firebase/firestore';
// let auth: Auth | null = null;
// let db: Firestore | null = null;

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
  firebaseInitError = `CRITICAL ${typeof window === 'undefined' ? 'SERVER' : 'CLIENT'} STARTUP ERROR: The following critical Firebase environment variables are missing or empty in the execution environment: ${missingCriticalVars.join(', ')}. Firebase SDK WILL NOT initialize. This application will not function correctly. CHECK YOUR ${typeof window === 'undefined' ? 'SERVER DEPLOYMENT/FUNCTION' : 'BUILD'} ENVIRONMENT'S VARIABLE CONFIGURATION AND RE-DEPLOY. This can lead to 'Internal Server Error' or 'missing required error components' on deployed site.`;
  console.error("**********************************************************************************");
  console.error(firebaseInitError);
  console.error("Current process.env values for these specific Firebase keys (if available - only shown on server for security):");
  if (typeof window === 'undefined') { // Only log process.env on server
    criticalEnvVarNames.forEach(varName => {
      console.error(`${varName}: ${JSON.stringify(process.env[varName])}`);
    });
  } else {
    console.error("Client-side: Cannot log process.env directly for security. Check browser's source or Next.js build logs if variables are inlined, or use browser dev tools to inspect 'window.process.env' if available (not typical for Next.js client). The error above indicates they were missing when this script ran.");
  }
  console.error("**********************************************************************************");
}
// --- END OF IMMEDIATE TOP-LEVEL CHECK ---

function initializeFirebase() {
  if (firebaseInitialized) { // If already attempted (successfully or not)
    if (firebaseInitError) {
      // Already logged the detailed error, maybe a simpler one here or just return
      console.warn("Firebase initialization previously attempted and failed with: ", firebaseInitError);
    } else {
      // console.log("Firebase already successfully initialized.");
    }
    return;
  }

  // If critical vars were missing at module load, don't even attempt actual initialization.
  // The firebaseInitError from top-level check is already set.
  if (firebaseInitError) {
    console.error("Skipping Firebase SDK initializeApp() call due to pre-existing critical environment variable errors from module load.");
    firebaseInitialized = true; // Mark as "attempted" to prevent re-attempts
    return;
  }

  console.log("Attempting Firebase SDK initializeApp()...");
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

    // Log raw values being read on client for easier debugging
    if (typeof window !== 'undefined') {
        console.log("Raw NEXT_PUBLIC_FIREBASE_API_KEY (client):", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_API_KEY));
        console.log("Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (client):", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN));
        console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID (client):", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID));
    }
    
    // Redundant check but good for confirming what initializeApp will receive
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
      const missingProps = [];
      if (!firebaseConfig.apiKey) missingProps.push('apiKey (from NEXT_PUBLIC_FIREBASE_API_KEY)');
      if (!firebaseConfig.authDomain) missingProps.push('authDomain (from NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)');
      if (!firebaseConfig.projectId) missingProps.push('projectId (from NEXT_PUBLIC_FIREBASE_PROJECT_ID)');
      
      const configConstructionError = `Firebase Config Construction Error during initializeFirebase(): Critical properties (${missingProps.join(', ')}) are missing or empty AFTER attempting to read from process.env. This usually means NEXT_PUBLIC_ environment variables are not set correctly in your build/deployment environment or are not being passed to the client correctly. This application will not function.`;
      console.error(configConstructionError);
      if (!firebaseInitError) firebaseInitError = configConstructionError; // Set if not already set by top-level
      firebaseInitialized = true; // Mark as attempted
      return;
    }

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully via initializeApp().");
    } else {
      app = getApps()[0];
      console.log("Firebase app already exists, using existing instance.");
    }
    
    if (typeof window !== 'undefined' && firebaseConfig.measurementId && app) {
      isAnalyticsSupported().then(supported => {
        if (supported && app) {  // Explicitly check app here
          analytics = getAnalytics(app); // Type error fixed here
          console.log("Firebase Analytics initialized.");
        } else {
          if (!app) {
            console.log("Firebase Analytics not initialized because Firebase app instance is null (should not happen if initializeApp succeeded).");
          } else {
            console.log("Firebase Analytics is not supported in this environment.");
          }
        }
      }).catch(err => console.error("Error checking analytics support:", err));
    } else if (typeof window !== 'undefined' && !firebaseConfig.measurementId) {
        console.log("Firebase Analytics not initialized: measurementId is missing in config.");
    } else if (typeof window !== 'undefined' && !app) {
        console.log("Firebase Analytics not initialized: Firebase app is null.");
    }    
  } catch (error: any) {
    firebaseInitError = `Firebase initializeApp() call critical error: ${error.message}. This can lead to 'Internal Server Error' or 'missing required error components'. Check server deployment logs & ensure environment variables are set. Details: ${error.stack || error}`;
    console.error("**********************************************************************************");
    console.error(firebaseInitError);
    console.error("Firebase config that was attempted with initializeApp():", JSON.stringify(currentFirebaseConfigValues, null, 2));
    console.error("**********************************************************************************");
    app = null;
    analytics = null;
  } finally {
    firebaseInitialized = true; // Mark as initialization attempt completed
    if (!firebaseInitError && app) {
      console.log(`Firebase initialization completed. Status: SUCCESS. Error: None`);
    } else if (firebaseInitError) {
      console.log(`Firebase initialization completed. Status: FAILED. Error: ${firebaseInitError}`);
    } else if (!app) {
      // This state means try block completed without caught error, but app is still null.
      console.log(`Firebase initialization completed. Status: FAILED (app is null, but no specific error caught during initializeApp). This can happen if critical env vars were missing initially.`);
      if (!firebaseInitError) firebaseInitError = "Firebase app is null after initialization attempt without a caught error. Critical environment variables might have been missing before initializeApp() was called.";
    }
  }
}

// Initialize Firebase when the module is loaded.
initializeFirebase();

export { app, analytics, firebaseInitialized, firebaseInitError, currentFirebaseConfigValues };
// No longer exporting auth and db as they are not used in the no-auth flow from this central config
// export { auth, db };
    
