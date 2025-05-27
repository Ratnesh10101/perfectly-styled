
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import Header from '@/components/Header';
import { firebaseInitialized, firebaseInitError } from '@/config/firebase'; // For server-side check

// --- IMMEDIATE TOP-LEVEL CHECK FOR SERVER ENVIRONMENT (module scope) ---
// This is primarily for logging during server startup or initial module load.
if (typeof window === 'undefined') { // Running on the server
  console.log("RootLayout: Server-side module evaluation started.");
  if (firebaseInitError) {
    console.error("--- ROOT LAYOUT DETECTED FIREBASE INIT ERROR (FROM IMPORTED firebase.ts) ---");
    console.error(`RootLayout Server (module scope): Firebase Initialization Failed as reported by firebase.ts: ${firebaseInitError}`);
    console.error("--- This will likely lead to RootLayout rendering a static error page. ---");
  } else if (!firebaseInitialized) {
    // This case means firebase.ts loaded, no init error reported, but not initialized.
    // This could happen if the top-level env var checks in firebase.ts didn't run or were bypassed.
    // Or if initializeFirebase() was never called or completed without setting firebaseInitialized=true and without error.
    // This is a less common state but worth noting.
    console.warn("RootLayout Server (module scope): Firebase not initialized, but no specific error reported by firebase.ts. This might indicate an issue with firebase.ts execution flow or that essential env vars were missing for its checks to run.");
  } else {
    console.log("RootLayout Server (module scope): Firebase appears initialized according to firebase.ts (firebaseInitialized=true, firebaseInitError=null).");
  }
}
// --- END OF IMMEDIATE TOP-LEVEL CHECK ---

export const metadata: Metadata = {
  title: 'Perfectly Styled',
  description: 'Get your personalized style analysis.',
};

export const viewport: Viewport = {
  themeColor: [ 
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Perform the server-side check again within the component function scope
  // This is the critical check that determines if we render the fallback error page.
  if (typeof window === 'undefined') { // Running on the server
    console.log("RootLayout Server Component: Rendering started.");
    console.log(`RootLayout Server Component: Imported firebaseInitialized: ${firebaseInitialized}, firebaseInitError: ${firebaseInitError || 'None'}`);

    // Check for Firebase init error from the config module OR if not initialized without specific error
    if (firebaseInitError || !firebaseInitialized) {
      const errorMessage = firebaseInitError || "Firebase critical services are not initialized, but no specific error was reported by firebase.ts. This usually indicates missing NEXT_PUBLIC_FIREBASE_... environment variables in the server/build environment.";
      console.error("--- ROOT LAYOUT CRITICAL FAILURE (COMPONENT RENDER) ---");
      console.error(`RootLayout Server Component: Firebase Initialization Failed or Incomplete. Error: ${errorMessage}`);
      console.error("--- Rendering basic static error page. Check server logs for details, especially for missing Firebase environment variables (like NEXT_PUBLIC_FIREBASE_PROJECT_ID). ---");
      // Render a very basic static HTML page
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
            <p>The application cannot start due to a server-side configuration issue, likely related to missing Firebase environment variables.</p>
            <pre>{`Error Detail: ${errorMessage}`}</pre>
            <p>Administrator: Please check the server deployment logs for more details, especially for messages about missing Firebase environment variables (e.g., NEXT_PUBLIC_FIREBASE_PROJECT_ID).</p>
          </body>
        </html>
      );
    }
    console.log("RootLayout Server Component: Firebase services appear to be initialized according to firebase.ts. Proceeding with normal render.");
  }

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`antialiased flex flex-col min-h-screen`}>
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        {/* Toaster component was removed */}
      </body>
    </html>
  );
}
