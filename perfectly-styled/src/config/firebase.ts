
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';

// --- IMMEDIATE TOP-LEVEL CHECK FOR CRITICAL ENVIRONMENT VARIABLES ---
// This check runs when the module is first loaded, on server or client.
let initialFirebaseInitError: string | null = null;
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
  initialFirebaseInitError = `CRITICAL ${typeof window === 'undefined' ? 'SERVER' : 'CLIENT'} STARTUP ERROR: The following critical Firebase environment variables are missing or empty in the execution environment: ${missingCriticalVars.join(', ')}. Firebase SDK WILL NOT initialize. This application will not function correctly. CHECK YOUR ${typeof window === 'undefined' ? 'SERVER DEPLOYMENT/FUNCTION' : 'BUILD'} ENVIRONMENT'S VARIABLE CONFIGURATION AND RE-DEPLOY. This can lead to 'Internal Server Error' or 'missing required error components' on deployed site.`;
  console.error("**********************************************************************************");
  console.error(initialFirebaseInitError);
  if (typeof window === 'undefined') { // Only log process.env on server
    criticalEnvVarNames.forEach(varName => {
      console.error(`Server-side check - ${varName}: ${JSON.stringify(process.env[varName])}`);
    });
  }
  console.error("**********************************************************************************");
}
// --- END OF IMMEDIATE TOP-LEVEL CHECK ---

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let firebaseInitialized = false;
let firebaseInitError: string | null = initialFirebaseInitError; // Initialize with error from top-level check
let currentFirebaseConfigValues: any = {};

console.log("firebase.ts module evaluation started (Client or Server). Firebase init error at module load:", firebaseInitError || "None");

function initializeFirebase() {
  if (firebaseInitialized) {
    if (firebaseInitError) {
      console.warn("Firebase initialization previously attempted and failed with: ", firebaseInitError);
    }
    return;
  }

  if (firebaseInitError) { // If error was detected at module load
    console.error("Skipping Firebase SDK initializeApp() call due to pre-existing critical environment variable errors.");
    firebaseInitialized = true; // Mark as "attempted"
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
    currentFirebaseConfigValues = { ...firebaseConfig };

    // Secondary check inside function, in case module-level process.env was different
    const missingConfigProps = criticalEnvVarNames.filter(varName => {
        const key = varName.replace('NEXT_PUBLIC_FIREBASE_', '').toLowerCase() as keyof typeof firebaseConfig;
        // Map keys: API_KEY -> apiKey, AUTH_DOMAIN -> authDomain, PROJECT_ID -> projectId
        const mappedKey = key === 'api_key' ? 'apiKey' : key === 'auth_domain' ? 'authDomain' : key === 'project_id' ? 'projectId' : key;
        return !firebaseConfig[mappedKey as keyof typeof firebaseConfig];
    });

    if (missingConfigProps.length > 0) {
        const configConstructionError = `Firebase Config Construction Error during initializeFirebase(): Critical properties derived from (${missingConfigProps.join(', ')}) are missing or empty. This usually means NEXT_PUBLIC_ environment variables are not set correctly in your build/deployment environment or are not being passed to the client/server runtime correctly.`;
        console.error(configConstructionError);
        if (!firebaseInitError) firebaseInitError = configConstructionError;
        firebaseInitialized = true;
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
        if (supported && app) {
          analytics = getAnalytics(app);
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
      console.log(`Firebase initialization completed. Status: FAILED (app is null, but no specific error caught during initializeApp). This can happen if critical env vars were missing initially.`);
      if (!firebaseInitError) firebaseInitError = "Firebase app is null after initialization attempt without a caught error. Critical environment variables might have been missing before initializeApp() was called.";
    }
  }
}

initializeFirebase();

export { app, analytics, firebaseInitialized, firebaseInitError, currentFirebaseConfigValues };
