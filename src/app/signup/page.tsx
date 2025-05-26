
'use client'; 

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the client-side logic component for the signup page
const SignupPageContent = dynamic(
  () => import('@/components/SignupPageContent').then(mod => mod.default),
  {
    ssr: false, // This component uses client-side hooks like useSearchParams
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-md p-6 text-center">Loading signup form...</div>
      </div>
    ),
  }
);

export default function SignupPage() {
  // This page is largely deprecated with the new "no-account" flow.
  // It's kept for routing integrity but directs users to the main flow.
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-md p-6 text-center">Loading page...</div>
      </div>
    }>
      {/* <SignupPageContent /> // Intentionally commented out, as this page is being phased out */}
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-full max-w-md p-6 text-center bg-card rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Account Creation Not Required</h1>
          <p className="mb-6 text-muted-foreground">
            Perfectly Styled now operates without user accounts. You can directly complete the
            questionnaire and receive your report.
          </p>
          <dynamic(() => import('@/components/ui/button').then(mod => mod.Button), {ssr: false}) asChild>
            <dynamic(() => import('next/link').then(mod => mod.default), {ssr: false}) href="/questionnaire">Start Questionnaire</dynamic(() => import('next/link').then(mod => mod.default), {ssr: false})>
          </dynamic(() => import('@/components/ui/button').then(mod => mod.Button), {ssr: false})>
        </div>
      </div>
    </Suspense>
  );
}
