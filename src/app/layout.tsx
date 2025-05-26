
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import Header from '@/components/Header';
// Toaster component was previously removed, AuthProvider also removed.

// Explicit check for critical environment variables on the server
if (typeof window === 'undefined') { // Only run this check on the server
  console.log("RootLayout: Server-side rendering context detected.");
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.error("**********************************************************************************");
    console.error("CRITICAL SERVER-SIDE ERROR in RootLayout: NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing or undefined.");
    console.error("This indicates a fundamental problem with environment variable configuration in your deployment.");
    console.error("This can lead to 'missing required error components' or other severe errors if Firebase services fail to initialize.");
    console.error("Please verify your Firebase deployment's environment variable settings.");
    console.error("**********************************************************************************");
  }
  if (!process.env.GOOGLE_API_KEY) {
    console.error("**********************************************************************************");
    console.error("CRITICAL SERVER-SIDE ERROR in RootLayout: GOOGLE_API_KEY for Genkit is missing or undefined.");
    console.error("This indicates a fundamental problem with environment variable configuration in your deployment.");
    console.error("This can lead to 'missing required error components' or other severe errors if Genkit services fail to initialize.");
    console.error("Please verify your Firebase deployment's environment variable settings for Genkit.");
    console.error("**********************************************************************************");
  }
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
