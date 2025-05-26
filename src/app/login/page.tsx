
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
// Import AuthForm directly as it's used by the dynamic component
// import AuthForm from "@/components/AuthForm"; 
// No, AuthForm is part of ClientLoginPage now, so direct import not needed here.

const ClientLoginPage = dynamic(() =>
  import("@/components/AuthForm").then((mod) => {
    const AuthForm = mod.default;
    // Firebase related imports are now conditional or handled differently as auth is removed
    // const { auth, firebaseInitialized, firebaseInitError } = require("@/config/firebase"); 
    // const { signInWithEmailAndPassword } = require("firebase/auth");
    const { useRouter, useSearchParams } = require("next/navigation");
    const { useToast } = require("@/hooks/use-toast");
    const Link = require("next/link").default; // .default for NextLink
    const { Button } = require("@/components/ui/button");

    const PENDING_QUESTIONNAIRE_KEY = "pendingQuestionnaireData_v2";

    return function WrappedLogin() {
      const router = useRouter();
      const searchParams = useSearchParams(); // Still used for query params
      const { toast } = useToast();

      // Login logic is mostly deprecated with no-account flow
      const handleLogin = async (values: { email: string; password: string }) => {
        toast({
          title: "Login Not Available",
          description: "User accounts are not part of the current application flow. Please use the questionnaire directly.",
          variant: "destructive",
        });
        // In a real app with auth, Firebase would be initialized and used here
        // For now, just throw an error to prevent form submission or redirect
        throw new Error("Login functionality is currently disabled.");
      };

      return (
        <>
          <AuthForm
            mode="login"
            onSubmit={handleLogin}
            title="Welcome Back!"
            description="Log in to access your style profile (Feature currently disabled as part of no-account flow)."
            buttonText="Login (Currently Disabled)"
          />
          <p className="text-center text-sm text-muted-foreground">
            This login page is temporarily inactive as the application has shifted to a no-account flow. 
            Please proceed via the <Link href="/questionnaire" className="underline">questionnaire</Link>.
          </p>
        </>
      );
    };
  }),
  { ssr: false }
);

export default function LoginPage() {
  // This page is largely deprecated with the new "no-account" flow.
  // It's kept for routing integrity but directs users to the main flow.
  return (
    <Suspense fallback={<div>Loading login form...</div>}>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-full max-w-md p-6 text-center bg-card rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Login Not Required</h1>
          <p className="mb-6 text-muted-foreground">
            Perfectly Styled now operates without user accounts. You can directly complete the
            questionnaire and receive your report.
          </p>
          <dynamic(() => import('@/components/ui/button').then(mod => mod.Button), {ssr: false}) asChild>
            <dynamic(() => import('next/link').then(mod => mod.default), {ssr: false}) href="/questionnaire">Start Questionnaire</dynamic(() => import('next/link').then(mod => mod.default), {ssr: false})>
          </dynamic(() => import('@/components/ui/button').then(mod => mod.Button), {ssr: false})>
        </div>
      </div>
      {/* <ClientLoginPage />  // Optionally re-enable if a minimal login is ever needed, but current flow bypasses. */}
    </Suspense>
  );
}
