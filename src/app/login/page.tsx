
'use client';

import { auth } from "@/config/firebase";
import { signInWithEmailAndPassword, type User } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation"; // Added useSearchParams
import { useToast } from "@/hooks/use-toast"; // Keep useToast here
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { saveQuestionnaireData } from "@/actions/questionnaireActions";
import type { QuestionnaireData } from "@/types";

import { Suspense } from 'react'; // Import Suspense
const PENDING_QUESTIONNAIRE_KEY = "pendingQuestionnaireData_v2"; // Ensure this matches
import dynamic from 'next/dynamic';

// Dynamically import AuthForm and the component that uses useSearchParams
const ClientLoginPage = dynamic(() => import('@/components/AuthForm').then(mod => {
    // Return a component that wraps AuthForm and uses the hooks
    return () => {
        const router = useRouter();
        const searchParams = useSearchParams(); // To check if redirected from questionnaire
        const { toast } = useToast();

        // Your existing handleLogin logic goes here
        const handleLogin = async (values: { email: string; password: string }) => {
  const router = useRouter();
          if (!auth) {
            toast({
              title: "Login Failed",
              description: "Firebase Auth is not configured correctly. Please contact support.",
              variant: "destructive",
            });
            throw new Error("Firebase auth service not available.");
          }
          try {
            const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user as User; // Cast to Firebase User
            toast({ title: "Login Successful", description: "Welcome back!" });

            // Check for pending questionnaire data
            const pendingDataString = localStorage.getItem(PENDING_QUESTIONNAIRE_KEY);
            if (pendingDataString) {
              try {
                const questionnaireData = JSON.parse(pendingDataString) as QuestionnaireData;
                const saveResult = await saveQuestionnaireData(user.uid, questionnaireData);
                if (saveResult.success) {
                  toast({ title: "Questionnaire Saved!", description: "Your style profile is updated." });
                  localStorage.removeItem(PENDING_QUESTIONNAIRE_KEY);
                  // If questionnaire saved and user intended to go to payment (e.g., from signup flow)
                  if (searchParams.get("fromQuestionnaire") === "true" || searchParams.get("redirectToPayment") === "true") {
                    router.push("/payment");
                  } else {
                    router.push("/"); // Default to homepage or profile page later
                  }
                  return;
                } else {
                  toast({ title: "Error Saving Questionnaire", description: saveResult.message, variant: "destructive" });
                  // Fall through to standard redirect even if questionnaire save fails, error is shown
                }
              } catch (e) {
                console.error("Error processing pending questionnaire data:", e);
                toast({ title: "Error", description: "Could not process saved questionnaire data.", variant: "destructive" });
              }
            }

            // Standard redirect logic if no pending questionnaire data or after handling it
            // Check if user was trying to access payment or report page before login
            const fromQuestionnaire = searchParams.get("fromQuestionnaire") === "true";
            const redirectToPayment = searchParams.get("redirectToPayment") === "true";

            if (redirectToPayment || fromQuestionnaire) {
               router.push("/payment");
            } else {
               router.push("/"); // Default redirect
            }

          } catch (error: any) {
            let errorMessage = "Failed to login. Please check your credentials.";
            if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
              errorMessage = "Invalid email or password.";
            } else if (error.message && error.message.includes("auth/configuration-not-found")) {
              errorMessage = "Firebase configuration error. Please contact support.";
            } else if (error.message && error.message.includes("Firebase: Error (auth/network-request-failed).")) {
               errorMessage = "Network error. Please check your internet connection and try again.";
            } else if (error.message) {
              errorMessage = error.message;
            }
            toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
            throw new Error(errorMessage); // Rethrow to be caught by AuthForm
          }
        };

        return (
          <>
            <mod.default // Use the imported AuthForm component
              mode="login"
              onSubmit={handleLogin}
              title="Welcome Back!"
              description="Log in to access your style profile."
              buttonText="Login"
            />
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Button variant="link" asChild className="p-0 h-auto">
                {/* Pass query param if user was trying to complete questionnaire */}
                <Link href={`/signup${searchParams.get("fromQuestionnaire") ? "?fromQuestionnaire=true" : ""}`}>Sign up</Link>
              </Button>
            </p>
          </>
        );
    };
}), { ssr: false });

export default function LoginPage() { // Keep the default export for the page
  return (
    <Suspense fallback={<div>Loading login form...</div>}>
      <ClientLoginPage />
    </Suspense>
  );
}
      toast({
        title: "Login Failed",
        description: "Firebase Auth is not configured correctly. Please contact support.",
        variant: "destructive",
      });
      throw new Error("Firebase auth service not available.");
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user as User; // Cast to Firebase User
      toast({ title: "Login Successful", description: "Welcome back!" });

      // Check for pending questionnaire data
      const pendingDataString = localStorage.getItem(PENDING_QUESTIONNAIRE_KEY);
      if (pendingDataString) {
        try {
          const questionnaireData = JSON.parse(pendingDataString) as QuestionnaireData;
          const saveResult = await saveQuestionnaireData(user.uid, questionnaireData);
          if (saveResult.success) {
            toast({ title: "Questionnaire Saved!", description: "Your style profile is updated." });
            localStorage.removeItem(PENDING_QUESTIONNAIRE_KEY);
            // If questionnaire saved and user intended to go to payment (e.g., from signup flow)
            if (searchParams.get("fromQuestionnaire") === "true" || searchParams.get("redirectToPayment") === "true") {
              router.push("/payment"); 
            } else {
              router.push("/"); // Default to homepage or profile page later
            }
            return;
          } else {
            toast({ title: "Error Saving Questionnaire", description: saveResult.message, variant: "destructive" });
            // Fall through to standard redirect even if questionnaire save fails, error is shown
          }
        } catch (e) {
          console.error("Error processing pending questionnaire data:", e);
          toast({ title: "Error", description: "Could not process saved questionnaire data.", variant: "destructive" });
        }
      }
      
      // Standard redirect logic if no pending questionnaire data or after handling it
      // Check if user was trying to access payment or report page before login
      const fromQuestionnaire = searchParams.get("fromQuestionnaire") === "true";
      const redirectToPayment = searchParams.get("redirectToPayment") === "true";

      if (redirectToPayment || fromQuestionnaire) {
         router.push("/payment");
      } else {
         router.push("/"); // Default redirect
      }

    } catch (error: any) {
      let errorMessage = "Failed to login. Please check your credentials.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password.";
      } else if (error.message && error.message.includes("auth/configuration-not-found")) {
        errorMessage = "Firebase configuration error. Please contact support.";
      } else if (error.message && error.message.includes("Firebase: Error (auth/network-request-failed).")) {
         errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
      throw new Error(errorMessage); // Rethrow to be caught by AuthForm
    }
  };

  // Render the content inside Suspense
  const LoginContent = () => (
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
          {/* Pass query param if user was trying to complete questionnaire */}
          <Link href={`/signup${searchParams.get("fromQuestionnaire") ? "?fromQuestionnaire=true" : ""}`}>Sign up</Link>
        </Button>
      </p>
    </>
  );

  return (
    <Suspense fallback={<div>Loading login form...</div>}> {/* Add Suspense boundary */}
      <LoginContent />
    </Suspense>
  );
}
