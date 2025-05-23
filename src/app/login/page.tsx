
'use client';

import { auth } from "@/config/firebase";
import { signInWithEmailAndPassword, type User } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { saveQuestionnaireData } from "@/actions/questionnaireActions";
import type { QuestionnaireData } from "@/types";
import { Suspense } from "react";
import dynamic from "next/dynamic";

const PENDING_QUESTIONNAIRE_KEY = "pendingQuestionnaireData_v2";

// Dynamically import AuthForm and wrap it in a client component
const ClientLoginPage = dynamic(() =>
  import("@/components/AuthForm").then((mod) => {
    const AuthForm = mod.default;

    return function WrappedLogin() {
      const router = useRouter();
      const searchParams = useSearchParams();
      const { toast } = useToast();

      const handleLogin = async (values: { email: string; password: string }) => {
        if (!auth) {
          toast({
            title: "Login Failed: Firebase Not Ready",
            description: "Firebase Authentication service is not available. This usually means critical environment variables (like NEXT_PUBLIC_FIREBASE_API_KEY) are missing or incorrect in your deployment environment. Please check server logs and contact support.",
            variant: "destructive",
          });
          throw new Error("Firebase auth service not available when attempting login.");
        }

        try {
          const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
          const user = userCredential.user as User;

          toast({ title: "Login Successful", description: "Welcome back!" });

          // Check for pending questionnaire data
          const pendingDataString = localStorage.getItem(PENDING_QUESTIONNAIRE_KEY);
          if (pendingDataString) {
            try {
              const questionnaireData = JSON.parse(pendingDataString) as QuestionnaireData;
              const saveResult = await saveQuestionnaireData(user.uid, questionnaireData);

              if (saveResult.success) {
                toast({
                  title: "Questionnaire Saved!",
                  description: "Your style profile is updated.",
                });

                localStorage.removeItem(PENDING_QUESTIONNAIRE_KEY);

                if (
                  searchParams.get("fromQuestionnaire") === "true" ||
                  searchParams.get("redirectToPayment") === "true"
                ) {
                  router.push("/payment");
                } else {
                  router.push("/");
                }

                return;
              } else {
                toast({
                  title: "Error Saving Questionnaire",
                  description: saveResult.message,
                  variant: "destructive",
                });
              }
            } catch (e) {
              console.error("Error processing pending questionnaire data:", e);
              toast({
                title: "Error",
                description: "Could not process saved questionnaire data.",
                variant: "destructive",
              });
            }
          }

          // Redirect logic if no pending data
          const fromQuestionnaire = searchParams.get("fromQuestionnaire") === "true";
          const redirectToPayment = searchParams.get("redirectToPayment") === "true";

          if (redirectToPayment || fromQuestionnaire) {
            router.push("/payment");
          } else {
            router.push("/");
          }
        } catch (error: any) {
          console.error("Login error:", error);
          if (auth && auth.app && auth.app.options) {
            console.error("DEBUG: Auth options at point of login failure:", JSON.stringify(auth.app.options));
          }
          let errorMessage = "Failed to login. Please check your credentials.";

          if (error.code === "auth/user-not-found" ||
              error.code === "auth/wrong-password" ||
              error.code === "auth/invalid-credential") {
            errorMessage = "Invalid email or password.";
          } else if (error.code === "auth/configuration-not-found") {
            errorMessage = "CRITICAL: Firebase Authentication failed (auth/configuration-not-found). This indicates a problem with your Firebase/Google Cloud project setup. Please meticulously re-check your API Key settings (HTTP referrers, API restrictions, enabled 'Identity Toolkit API') and ensure environment variables (like NEXT_PUBLIC_FIREBASE_API_KEY) are correctly set and propagated in your deployment environment. Refer to Firebase/Google Cloud console documentation.";
            console.error("LOGIN FAILED - CRITICAL CONFIGURATION ISSUE (auth/configuration-not-found): This indicates a problem with your Firebase/Google Cloud project setup. Verify API Key restrictions, ensure 'Identity Toolkit API' is enabled, and check environment variable propagation in your Firebase deployment.", error);
          } else if (error.message?.includes("auth/network-request-failed")) {
            errorMessage = "Network error. Please check your internet connection and try again.";
          } else if (error.message) {
            errorMessage = error.message;
          }

          toast({
            title: "Login Failed",
            description: errorMessage,
            variant: "destructive",
          });

          throw new Error(errorMessage);
        }
      };

      return (
        <>
          <AuthForm
            mode="login"
            onSubmit={handleLogin}
            title="Welcome Back!"
            description="Log in to access your style profile."
            buttonText="Login"
          />
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link
                href={`/signup${
                  searchParams.get("fromQuestionnaire") ? "?fromQuestionnaire=true" : ""
                }`}
              >
                Sign up
              </Link>
            </Button>
          </p>
        </>
      );
    };
  }),
  { ssr: false }
);

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading login form...</div>}>
      <ClientLoginPage />
    </Suspense>
  );
}
