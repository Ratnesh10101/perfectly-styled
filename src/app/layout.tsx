
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import Header from '@/components/Header';
import { firebaseInitialized, firebaseInitError } from '@/config/firebase'; // For server-side check

// --- IMMEDIATE TOP-LEVEL CHECK FOR SERVER ENVIRONMENT (module scope) ---
let criticalServerSideError: string | null = null;
if (typeof window === 'undefined') { // Running on the server
  console.log("RootLayout: Server-side module evaluation started.");

  const essentialFirebaseVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];
  const missingFirebaseVars = essentialFirebaseVars.filter(
    (varName) => !process.env[varName] || process.env[varName]?.trim() === ''
  );

  if (missingFirebaseVars.length > 0) {
    criticalServerSideError = `CRITICAL SERVER-SIDE ERROR in RootLayout: The following Firebase environment variables are missing or empty: ${missingFirebaseVars.join(', ')}. Firebase client SDK cannot initialize. This can lead to 'missing required error components' or other severe errors. Please verify your Firebase deployment's environment variable settings.`;
    console.error("**********************************************************************************");
    console.error(criticalServerSideError);
    console.error("**********************************************************************************");
  }

  // Check for Firebase init error from the config module
  if (!criticalServerSideError && firebaseInitError) {
    criticalServerSideError = `RootLayout Server: Firebase Initialization Failed as reported by firebase.ts: ${firebaseInitError}`;
    console.error("--- ROOT LAYOUT DETECTED FIREBASE INIT ERROR (from firebase.ts) ---");
    console.error(criticalServerSideError);
    console.error("--- Rendering basic static error page due to Firebase init failure. ---");
  }

  if (criticalServerSideError) {
    // This block is tricky because we can't return JSX from module scope.
    // The check will be repeated in the component function.
    console.log("RootLayout: Server-side critical error detected at module scope. Component will render error page.");
  } else {
    console.log("RootLayout: Server-side initial environment variable checks passed at module scope.");
    console.log(`RootLayout Server (module scope): Firebase Initialized Status from import: ${firebaseInitialized}, Firebase Init Error from import: ${firebaseInitError || 'None'}`);
  }
}
// --- END OF IMMEDIATE TOP-LEVEL CHECK ---

export const metadata: Metadata = {
  title: 'Perfectly Styled',
  description: 'Get your personalized style analysis.',
};

export const viewport: Viewport = {
  themeColor: [ // Example theme color, adjust as needed
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  // other viewport settings
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Perform the server-side check again within the component function scope
  if (typeof window === 'undefined') {
    // Re-evaluate criticalServerSideError based on current state of imported vars
    // This ensures the component itself renders the error page if needed
    let serverCheckError: string | null = null;
    const essentialFirebaseVars = [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    ];
    const missingFirebaseVars = essentialFirebaseVars.filter(
        (varName) => !process.env[varName] || process.env[varName]?.trim() === ''
    );

    if (missingFirebaseVars.length > 0) {
        serverCheckError = `CRITICAL SERVER-SIDE ERROR from RootLayout component: The following Firebase environment variables are missing or empty: ${missingFirebaseVars.join(', ')}. Firebase client SDK cannot initialize.`;
    }
    if (!serverCheckError && firebaseInitError) {
        serverCheckError = `RootLayout Server Component: Firebase Initialization Failed as reported by firebase.ts: ${firebaseInitError}`;
    }

    if (serverCheckError) {
      console.error("--- ROOT LAYOUT CRITICAL FAILURE (COMPONENT RENDER) ---");
      console.error(serverCheckError);
      console.error("--- Rendering basic static error page. Check server logs for details. ---");
      return (
        <html lang="en">
          <head>
            <title>Critical Configuration Error</title>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>{`body { font-family: sans-serif; padding: 20px; color: #333; background-color: #fef2f2; } h1 { color: #b91c1c; } pre { background-color: #fee2e2; padding: 15px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; font-size: 0.9em; }`}</style>
          </head>
          <body>
            <h1>Critical Server Configuration Error</h1>
            <p>The application cannot start due to a server-side configuration issue.</p>
            <pre>{serverCheckError}</pre>
            <p>Administrator: Please check the server deployment logs for more details, especially for messages about missing Firebase environment variables (like NEXT_PUBLIC_FIREBASE_PROJECT_ID) or Genkit environment variables (like GOOGLE_API_KEY).</p>
          </body>
        </html>
      );
    }
    console.log("RootLayout Server Component: Firebase services appear to be initialized or no init errors reported by firebase.ts.");
  }

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`antialiased flex flex-col min-h-screen`}>
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        {/* Toaster component was previously removed */}
      </body>
    </html>
  );
}
