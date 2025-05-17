
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the client-side logic component for the signup page
const SignupPageContent = dynamic(
  () => import('@/components/SignupPageContent').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-md p-6 text-center">Loading signup form...</div>
      </div>
    ),
  }
);

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-md p-6 text-center">Loading page...</div>
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
}
