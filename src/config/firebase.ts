
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';
// Auth and Firestore are no longer directly used/exported from this module in the no-auth flow
// import { getAuth, type Auth } from 'firebase/auth';
// import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
// let auth: Auth | null = null; // Removed as auth is no longer initialized here
// let db: Firestore | null = null; // Removed as db is no longer initialized here
let analytics: Analytics | null = null;
let firebaseInitialized = false;
let firebaseInitError: string | null = null;
let currentFirebaseConfigValues: any = {}; // For debugging

console.log("firebase.ts module evaluation started (Client or Server).");

// --- IMMEDIATE TOP-LEVEL CHECK FOR SERVER ENVIRONMENT ---
if (typeof window === 'undefined') { // Running on the server
  const criticalEnvVarNamesServer = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];
  const missingCriticalVarsServer = criticalEnvVarNamesServer.filter(varName => {
    const value = process.env[varName];
    return !value || typeof value !== 'string' || value.trim() === '';
  });

  if (missingCriticalVarsServer.length > 0) {
    firebaseInitError = `CRITICAL SERVER STARTUP ERROR: The following critical Firebase environment variables are missing or empty in the server's execution environment: ${missingCriticalVarsServer.join(', ')}. Firebase SDK WILL NOT initialize. This can lead to 'Internal Server Error' or 'missing required error components'. CHECK YOUR DEPLOYMENT ENVIRONMENT'S VARIABLE CONFIGURATION AND RE-DEPLOY. For server-side issues, check Firebase Functions/Cloud Run logs.`;
    console.error("**********************************************************************************");
    console.error(firebaseInitError);
    console.error("**********************************************************************************");
  }
}
// --- END OF IMMEDIATE TOP-LEVEL CHECK ---


function initializeFirebase() {
  if (firebaseInitialized) { // Prevents re-initialization
    if (firebaseInitError) {
      console.warn("Firebase already attempted initialization and failed due to: ", firebaseInitError);
    } else {
      console.log("Firebase already successfully initialized.");
    }
    return;
  }

  console.log("Attempting Firebase initialization...");
  try {
    // Check for critical env vars specifically for client-side initialization context
    // This log is more for client-side debugging if the server-side check somehow didn't cover it
    const criticalClientEnvVarNames = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    ];
    const missingCriticalClientVars = criticalClientEnvVarNames.filter(varName => {
      const value = process.env[varName];
      return !value || typeof value !== 'string' || value.trim() === '';
    });

    if (missingCriticalClientVars.length > 0) {
      firebaseInitError = `Firebase Initialization Error: The following critical environment variables are missing or empty: ${missingCriticalClientVars.join(', ')}. Firebase will not be initialized. This impacts BOTH client and server functionality. Ensure these are set in your deployment environment (for server-side & build-time) and available to client-side code (often via build process). If you see 'missing required error components', this is a likely cause.`;
      console.error(firebaseInitError);
      // No further initialization if critical vars are missing for the client
      firebaseInitialized = true; // Mark as attempted
      return;
    }
    
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
        console.log("Raw NEXT_PUBLIC_FIREBASE_API_KEY:", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_API_KEY), typeof process.env.NEXT_PUBLIC_FIREBASE_API_KEY, process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.length);
        console.log("Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN), typeof process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.length);
        console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID:", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID), typeof process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.length);
    }


    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
      firebaseInitError = `Firebase Config Error: Critical properties (apiKey, authDomain, projectId) are missing or empty AFTER attempting to read from process.env. Firebase will not be initialized. This usually means NEXT_PUBLIC_ environment variables are not set correctly in your build/deployment environment or are not being passed to the client correctly. Review deployment settings.`;
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

    // auth = getAuth(app); // Removed for no-auth flow
    // if(auth) console.log("DEBUG: Initialized Auth service is using options:", JSON.stringify((auth as any)?.app?.options));
    
    // db = getFirestore(app); // Removed for no-auth flow
    // if(db) console.log("Firebase Firestore service obtained.");

    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      isAnalyticsSupported().then(supported => {
        if (supported && app) { // Added explicit 'app' check here
          analytics = getAnalytics(app);
          console.log("Firebase Analytics initialized.");
        } else {
          if (!app) {
            console.log("Firebase Analytics not initialized because Firebase app instance is null.");
          } else {
            console.log("Firebase Analytics is not supported in this environment.");
          }
        }
      }).catch(err => console.error("Error checking analytics support:", err));
    } else if (typeof window !== 'undefined' && !firebaseConfig.measurementId) {
        console.log("Firebase Analytics not initialized because measurementId is missing in config.");
    }
    
  } catch (error: any) {
    firebaseInitError = `Firebase initializeApp critical error: ${error.message}. This is a severe issue, check your Firebase project configuration and API key settings in Google Cloud Console. Details: ${error.stack || error}`;
    console.error("**********************************************************************************");
    console.error(firebaseInitError);
    console.error("**********************************************************************************");
    app = null;
    // auth = null; // ensure these are null if init fails
    // db = null;
    analytics = null;
  } finally {
    firebaseInitialized = true; // Mark initialization as attempted, regardless of outcome
    console.log(`Firebase initialization attempt complete. Status: ${firebaseInitError ? 'FAILED' : 'SUCCESS'}. Error: ${firebaseInitError || 'None'}`);
  }
}

initializeFirebase();

export { app, analytics, firebaseInitialized, firebaseInitError, currentFirebaseConfigValues };
// auth and db removed from exports
