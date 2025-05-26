
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
  firebaseInitError = `CRITICAL ${typeof window === 'undefined' ? 'SERVER' : 'CLIENT'} STARTUP ERROR: The following critical Firebase environment variables are missing or invalid: ${missingCriticalVars.join(', ')}. Firebase SDK WILL NOT initialize. This will lead to runtime errors on both client and server (e.g., 'Internal Server Error' or 'missing required error components'). CHECK YOUR DEPLOYMENT ENVIRONMENT'S VARIABLE CONFIGURATION AND RE-DEPLOY. For server-side issues, check Firebase Functions/Cloud Run logs.`;
  console.error("**********************************************************************************");
  console.error(firebaseInitError);
  console.error("**********************************************************************************");
}

function initializeFirebase() {
  if (firebaseInitialized) {
    console.log("Firebase already attempted initialization.");
    return;
  }

  if (firebaseInitError) { // If critical vars were missing at module load time
    console.warn("Firebase initialization skipped due to critical environment variable errors detected at module load.");
    firebaseInitialized = true; 
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
    currentFirebaseConfigValues = { ...firebaseConfig };

    console.log("Raw NEXT_PUBLIC_FIREBASE_API_KEY:", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_API_KEY), typeof process.env.NEXT_PUBLIC_FIREBASE_API_KEY, process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.length);
    console.log("Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN), typeof process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.length);
    console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID:", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID), typeof process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.length);
    
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
      firebaseInitError = `Firebase Error: Critical config properties (apiKey, authDomain, projectId) are missing or empty AFTER attempting to read from process.env. Firebase will not be initialized. This typically means NEXT_PUBLIC_ environment variables are not set correctly in your build/deployment environment. Review server logs for details.`;
      console.error(firebaseInitError);
      firebaseInitialized = true; 
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

    if (typeof window !== 'undefined' && app && firebaseConfig.measurementId) {
      isAnalyticsSupported().then(supported => {
        if (supported) {
          analytics = getAnalytics(app);
          console.log("Firebase Analytics initialized.");
        } else {
          console.log("Firebase Analytics is not supported in this environment or app is null.");
        }
      }).catch(err => console.error("Error checking analytics support:", err));
    } else if (typeof window !== 'undefined' && !firebaseConfig.measurementId) {
        console.log("Firebase Analytics not initialized because measurementId is missing in config.");
    }
    
  } catch (error: any) {
    firebaseInitError = `Firebase initializeApp error: ${error.message}. Check your Firebase project configuration and API key settings in Google Cloud Console. Details: ${error.stack || error}`;
    console.error(firebaseInitError);
    app = null;
    // auth = null;
    // db = null;
    analytics = null;
  } finally {
    firebaseInitialized = true;
  }
}

initializeFirebase();

export { app, analytics, firebaseInitialized, firebaseInitError, currentFirebaseConfigValues };
// auth and db removed from exports
