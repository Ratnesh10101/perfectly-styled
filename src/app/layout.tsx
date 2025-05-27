
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
    console.warn("RootLayout Server (module scope): Firebase not initialized, but no specific error reported by firebase.ts. This might still indicate issues if variables were missing for firebase.ts itself to run its top-level checks.");
  } else {
    console.log("RootLayout Server (module scope): Firebase appears initialized according to firebase.ts.");
  }
}
// --- END OF IMMEDIATE TOP-LEVEL CHECK ---

export const metadata: Metadata = {
  title: 'Perfectly Styled',
  description: 'Get your personalized style analysis.',
};

export const viewport: Viewport = {
  themecolour: [ 
    { media: '(prefers-colour-scheme: light)', colour: '#ffffff' },
    { media: '(prefers-colour-scheme: dark)', colour: '#000000' },
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
    // Check for Firebase init error from the config module
    if (firebaseInitError) {
      console.error("--- ROOT LAYOUT CRITICAL FAILURE (COMPONENT RENDER) ---");
      console.error(`RootLayout Server Component: Firebase Initialization Failed. Error: ${firebaseInitError}`);
      console.error("--- Rendering basic static error page due to Firebase init failure. Check server logs for details, especially for missing Firebase environment variables (like NEXT_PUBLIC_FIREBASE_PROJECT_ID) or Genkit GOOGLE_API_KEY. ---");
      // Render a very basic static HTML page
      return (
        <html lang="en">
          <head>
            <title>Critical Configuration Error</title>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>{`body { font-family: sans-serif; padding: 20px; colour: #333; background-colour: #fef2f2; } h1 { colour: #b91c1c; } pre { background-colour: #fee2e2; padding: 15px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; font-size: 0.9em; }`}</style>
          </head>
          <body>
            <h1>Critical Server Configuration Error</h1>
            <p>The application cannot start due to a server-side configuration issue, likely related to missing Firebase or Genkit (AI) environment variables.</p>
            <pre>{`Error Detail: ${firebaseInitError}`}</pre>
            <p>Administrator: Please check the server deployment logs for more details, especially for messages about missing Firebase environment variables (e.g., NEXT_PUBLIC_FIREBASE_PROJECT_ID) or Genkit environment variables (e.g., GOOGLE_API_KEY).</p>
          </body>
        </html>
      );
    }
    // If no init error but still not initialized, it's a strange state but proceed with caution.
    if (!firebaseInitialized) {
        console.warn("RootLayout Server Component: Firebase services are reported as NOT initialized by firebase.ts, but no specific error was found. Application might not function correctly.");
    } else {
        console.log("RootLayout Server Component: Firebase services appear to be initialized according to firebase.ts.");
    }
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
