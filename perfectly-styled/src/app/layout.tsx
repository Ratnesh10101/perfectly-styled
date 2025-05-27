
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
    // This case might occur if firebase.ts itself had an issue even before setting firebaseInitialized
    console.warn("RootLayout Server (module scope): Firebase not initialized (firebaseInitialized=false), and no specific error reported by firebase.ts. This might still indicate issues if essential env vars were missing for firebase.ts's top-level checks to run or if firebase.ts module evaluation failed silently.");
  } else {
    console.log("RootLayout Server (module scope): Firebase appears initialized according to firebase.ts (firebaseInitialized=true, firebaseInitError=null).");
  }
}
// --- END OF IMMEDIATE TOP-LEVEL CHECK ---

export const metadata: Metadata = {
  title: 'Perfectly Styled',
  description: 'Get your personalised style analysis.',
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

    // Check for Firebase init error or if Firebase is not initialized
    // This check is crucial to prevent the "missing required error components" error.
    if (firebaseInitError || !firebaseInitialized) {
      const errorMessage = firebaseInitError || "Firebase services are not initialized. Critical environment variables (e.g., NEXT_PUBLIC_FIREBASE_PROJECT_ID) may be missing in the server deployment environment.";
      console.error("--- ROOT LAYOUT CRITICAL FAILURE (COMPONENT RENDER) ---");
      console.error(`RootLayout Server Component: Firebase Initialization Failed or Incomplete. Error: ${errorMessage}`);
      console.error("--- Rendering basic static error page. Check server logs for details, especially for 'CRITICAL SERVER STARTUP ERROR' from firebase.ts regarding missing Firebase environment variables. ---");
      // Render a very basic static HTML page
      return (
        <html lang="en">
          <head>
            <title>Critical Configuration Error</title>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>{`body { font-family: sans-serif; padding: 20px; color: #333; background-color: #fef2f2; } h1 { color: #b91c1c; } pre { background-color: #fee2e2; padding: 15px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; font-size: 0.9em; overflow-x: auto; }`}</style>
          </head>
          <body>
            <h1>Critical Server Configuration Error</h1>
            <p>The application cannot start due to a server-side configuration issue, most likely related to missing or incorrect Firebase environment variables.</p>
            <pre>{`Error Detail: ${errorMessage}`}</pre>
            <p><strong>Administrator Action Required:</strong> Please check the server deployment logs for "CRITICAL SERVER STARTUP ERROR" messages from 'firebase.ts'. These logs will specify which environment variables (e.g., NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_API_KEY) are missing or invalid. Ensure these are correctly set in your Firebase deployment environment and then re-deploy the application.</p>
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
        {/* Toaster component was previously removed */}
      </body>
    </html>
  );
}
    