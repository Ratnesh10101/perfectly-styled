
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import Header from '@/components/Header';
import { firebaseInitialized, firebaseInitError } from '@/config/firebase'; // For server-side check
// Genkit related import removed

// Explicit check for critical environment variables and service initialization status on the server
// This block runs when the module is loaded on the server.
if (typeof window === 'undefined') { // Only run this check on the server
  console.log("RootLayout: Server-side module evaluation started.");
  // Check direct environment variables to ensure they are passed to the server environment
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.error("**********************************************************************************");
    console.error("CRITICAL SERVER-SIDE ERROR in RootLayout: NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing or undefined in the server environment.");
    console.error("This indicates a fundamental problem with environment variable configuration for Firebase client SDK on the server.");
    console.error("This can lead to 'missing required error components' or other severe errors if Firebase services fail to initialize.");
    console.error("Please verify your Firebase deployment's environment variable settings.");
    console.error("**********************************************************************************");
  }
  // GOOGLE_API_KEY check removed as Genkit is removed
}

export const metadata: Metadata = {
  title: 'Perfectly Styled',
  description: 'Get your personalized style analysis.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side check for critical service initialization failures
  if (typeof window === 'undefined') {
    console.log("--- RootLayout Component Render: SERVER-SIDE ---");
    console.log(`RootLayout Server: Firebase Initialized Status: ${firebaseInitialized}, Firebase Init Error: ${firebaseInitError || 'None'}`);
    // Genkit service error log removed

    if (firebaseInitError) { // Only check for Firebase error now
      let errorMessages: string[] = [];
      if (firebaseInitError) {
        errorMessages.push(`Firebase Initialization Failed: ${firebaseInitError}`);
      }
      // Genkit error message construction removed
      
      const fullErrorMessage = `A critical server configuration error occurred preventing the application from starting. ${errorMessages.join('; ')}. Please check server logs and ensure all required environment variables (Firebase client SDK config) are correctly set in your deployment environment.`;
      
      console.error("--- ROOT LAYOUT CRITICAL FAILURE ---");
      console.error(fullErrorMessage);
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
            <pre>{fullErrorMessage}</pre>
            <p>Administrator: Please check the server deployment logs for more details, especially for messages about missing Firebase environment variables (like NEXT_PUBLIC_FIREBASE_PROJECT_ID).</p>
          </body>
        </html>
      );
    }
    console.log("RootLayout Server: Firebase services appear to be initialized or no init errors reported.");
  }

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`antialiased flex flex-col min-h-screen`}>
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        {/* Toaster component was previously removed as part of auth flow simplification */}
      </body>
    </html>
  );
}
