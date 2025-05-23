
'use client';

import AuthForm from "@/components/AuthForm";
import { auth, db } from "@/config/firebase";
import { createUserWithEmailAndPassword, type User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { UserMeta, QuestionnaireData } from "@/types";
import { Button } from "@/components/ui/button";
import { saveQuestionnaireData } from "@/actions/questionnaireActions";

const PENDING_QUESTIONNAIRE_KEY = "pendingQuestionnaireData_v2"; 

export default function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleSignup = async (values: { email: string; password: string }) => {
    if (!auth) {
      toast({
        title: "Signup Failed: Firebase Not Ready",
        description: "Firebase Authentication service is not available. This usually means critical environment variables (like NEXT_PUBLIC_FIREBASE_API_KEY) are missing or incorrect in your deployment environment. Please check server logs and contact support.",
        variant: "destructive",
      });
      throw new Error("Firebase Auth service not initialized when attempting signup.");
    }
    if (!db) {
      toast({
        title: "Signup Failed: Firebase Not Ready",
        description: "Firebase Firestore service is not available. This usually means critical environment variables (like NEXT_PUBLIC_FIREBASE_PROJECT_ID) are missing or incorrect in your deployment environment. Please check server logs and contact support.",
        variant: "destructive",
      });
      throw new Error("Firebase Firestore service not initialized when attempting to create user profile.");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user as User; 

      const userMetaRef = doc(db, "users", user.uid, "meta", "data");
      const initialMeta: UserMeta = {
        email: user.email,
        hasPaid: false,
        hasGeneratedReport: false,
        questionnaireComplete: false, 
      };

      toast({ title: "Signup Successful", description: "Welcome to Perfectly Styled!" });

      const pendingDataString = localStorage.getItem(PENDING_QUESTIONNAIRE_KEY);
      let questionnaireSaved = false;
      if (pendingDataString) {
        try {
          const questionnaireData = JSON.parse(pendingDataString) as QuestionnaireData;
          const saveResult = await saveQuestionnaireData(user.uid, questionnaireData);
          if (saveResult.success) {
            toast({ title: "Questionnaire Saved!", description: "Your style profile is updated." });
            localStorage.removeItem(PENDING_QUESTIONNAIRE_KEY);
            initialMeta.questionnaireComplete = true; 
            questionnaireSaved = true;
          } else {
            toast({ title: "Error Saving Questionnaire", description: saveResult.message, variant: "destructive" });
          }
        } catch (e) {
          console.error("Error processing pending questionnaire data:", e);
          toast({ title: "Error", description: "Could not process saved questionnaire data.", variant: "destructive" });
        }
      }
      
      await setDoc(userMetaRef, initialMeta);
      
      if (questionnaireSaved || searchParams.get("fromQuestionnaire") === "true") {
        router.push("/payment");
      } else {
        router.push("/");
      }

    } catch (error: any) {
      console.error("Signup error:", error);
       if (auth && auth.app && auth.app.options) {
        console.error("DEBUG: Auth options at point of signup failure:", JSON.stringify(auth.app.options));
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
            errorMessage = "CRITICAL: Firebase Authentication failed (auth/configuration-not-found). This indicates a problem with your Firebase/Google Cloud project setup. Please meticulously re-check your API Key settings (HTTP referrers, API restrictions, enabled 'Identity Toolkit API') and ensure environment variables (like NEXT_PUBLIC_FIREBASE_API_KEY) are correctly set and propagated in your deployment environment. Refer to Firebase/Google Cloud console documentation.";
            console.error("SIGNUP FAILED - CRITICAL CONFIGURATION ISSUE (auth/configuration-not-found): This indicates a problem with your Firebase/Google Cloud project setup. Verify API Key restrictions, ensure 'Identity Toolkit API' is enabled, and check environment variable propagation in your Firebase deployment.", error);
            break;
          default:
            if (error.message && error.message.includes("Firebase: Error (auth/network-request-failed).")) {
              errorMessage = "Network error. Please check your internet connection and try again.";
            } else if (error.message) {
              errorMessage = `Signup failed: ${error.message}`;
            }
            if (error.message && error.message.toLowerCase().includes("firestore")) {
              errorMessage = "Account created, but failed to save user profile information. Please try logging in or contact support.";
            }
        }
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      toast({ title: "Signup Failed", description: errorMessage, variant: "destructive" });
      throw new Error(errorMessage); 
    }
  };

  const loginQueryParam = searchParams.get("fromQuestionnaire") === "true" ? "?fromQuestionnaire=true" : "";
  const loginHref = `/login${loginQueryParam}`;

  return (
    <>
      <AuthForm
        mode="signup"
        onSubmit={handleSignup}
        title="Create Your Account"
        description="Join Perfectly Styled to discover your unique style. Complete the questionnaire first, then sign up to save and get your report!"
        buttonText="Sign Up"
      />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Button variant="link" asChild className="p-0 h-auto">
          <Link href={loginHref}>Login</Link>
        </Button>
      </p>
    </>
  );
}
