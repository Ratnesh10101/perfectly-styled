
'use client';

import AuthForm from "@/components/AuthForm";
import { auth } from "@/config/firebase"; // db removed as it's not used here
import { createUserWithEmailAndPassword, type User } from "firebase/auth";
// import { doc, setDoc } from "firebase/firestore"; // No longer writing user meta here
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
// import type { UserMeta, QuestionnaireData } from "@/types"; // UserMeta and QuestionnaireData not directly used here anymore
import { Button } from "@/components/ui/button";
// import { saveQuestionnaireData } from "@/actions/questionnaireActions"; // Removed import

const PENDING_QUESTIONNAIRE_KEY = "pendingQuestionnaireData_v2"; 

export default function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleSignup = async (values: { email: string; password: string }) => {
    if (!auth) {
      toast({
        title: "Signup Failed: Firebase Not Ready",
        description: "CRITICAL: Firebase Authentication service is not available. This usually means critical environment variables (like NEXT_PUBLIC_FIREBASE_API_KEY) are missing or incorrect in your deployment environment. Please check server logs and contact support. Also verify API key restrictions (HTTP referrers, API restrictions) and enabled services (like Identity Toolkit API) in Google Cloud Console.",
        variant: "destructive",
      });
      throw new Error("Firebase Auth service not initialized when attempting signup.");
    }
    // db check removed as we are not writing to Firestore here anymore

    try {
      // User creation is still relevant if you intend to use Firebase for other features later,
      // but it's not strictly needed for the current no-account flow.
      // For now, we'll keep the user creation part but remove Firestore writes.
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      // const user = userCredential.user as User; // user object not used

      toast({ title: "Signup Successful (Simulation)", description: "Proceed to payment to get your report." });

      // Check if coming from questionnaire to redirect appropriately
      // No longer saving questionnaire data here; payment page handles it from localStorage
      const fromQuestionnaire = searchParams.get("fromQuestionnaire") === "true";
      if (fromQuestionnaire) {
        // If data was in localStorage, payment page will pick it up.
        router.push("/payment");
      } else {
        // If not from questionnaire, this signup path is less defined in the new flow.
        // Defaulting to homepage, or consider redirecting to questionnaire.
        router.push("/"); 
      }

    } catch (error: any) {
      console.error("Signup error:", error);
      if (auth && auth.app && auth.app.options) {
        // console.error("DEBUG: Auth options at point of signup failure:", JSON.stringify(auth.app.options));
      }
      let errorMessage = "An unexpected error occurred during sign up. Please try again.";

      if (error && typeof error.code === 'string') {
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage = "This email address is already in use. Please try logging in or use a different email.";
            break;
          case "auth/invalid-email":
            errorMessage = "The email address you entered is not valid. Please check and try again.";
            break;
          case "auth/operation-not-allowed":
            errorMessage = "Email/password sign-up is not enabled for this project. Please contact support. (Ensure Email/Password provider is enabled in Firebase Authentication settings).";
            break;
          case "auth/weak-password":
            errorMessage = "The password is too weak. Please choose a stronger password (at least 6 characters).";
            break;
          case "auth/configuration-not-found":
            errorMessage = "CRITICAL: Firebase Authentication failed (auth/configuration-not-found). This indicates a problem with your Firebase/Google Cloud project setup. Please meticulously re-check your API Key settings (HTTP referrers, API restrictions, enabled 'Identity Toolkit API') and ensure environment variables (like NEXT_PUBLIC_FIREBASE_API_KEY) are correctly set and propagated in your deployment environment. Refer to Firebase/Google Cloud console documentation for API Key and service enablement. Also check server logs if deploying with server-side components.";
            console.error("SIGNUP FAILED - CRITICAL CONFIGURATION ISSUE (auth/configuration-not-found): This indicates a problem with your Firebase/Google Cloud project setup. Verify API Key restrictions, ensure 'Identity Toolkit API' is enabled, and check environment variable propagation in your Firebase deployment.", error);
            break;
          default:
            if (error.message && error.message.includes("Firebase: Error (auth/network-request-failed).")) {
              errorMessage = "Network error. Please check your internet connection and try again.";
            } else if (error.message) {
              errorMessage = `Signup failed: ${error.message}`;
            }
        }
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      toast({ title: "Signup Failed", description: errorMessage, variant: "destructive" });
      throw new Error(errorMessage); 
    }
  };

  const fromQuestionnaire = searchParams.get("fromQuestionnaire") === "true";
  const loginQueryParam = fromQuestionnaire ? "?fromQuestionnaire=true" : "";
  const loginHref = `/login${loginQueryParam}`;

  return (
    <>
      <AuthForm
        mode="signup"
        onSubmit={handleSignup}
        title="Create Your Account (Optional)"
        description={fromQuestionnaire 
          ? "Optionally create an account, or proceed to payment with your email." 
          : "Join Perfectly Styled."}
        buttonText="Sign Up (Not Required)"
      />
      <p className="text-center text-sm text-muted-foreground mt-4">
        {fromQuestionnaire 
          ? "Alternatively, " 
          : "Already have an account? "}
        {fromQuestionnaire ? (
          <Button variant="link" asChild className="p-0 h-auto">
            <Link href="/payment">
              Skip to Payment
            </Link>
          </Button>
        ) : (
          <Button variant="link" asChild className="p-0 h-auto">
            <Link href={loginHref}>Login</Link>
          </Button>
        )}
      </p>
      {fromQuestionnaire && (
         <p className="text-center text-sm text-muted-foreground mt-2">
            Or, if you have an existing account:{" "}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href={loginHref}>Login</Link>
            </Button>
          </p>
      )}
    </>
  );
}
