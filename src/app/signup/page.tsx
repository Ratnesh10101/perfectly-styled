
"use client";

import AuthForm from "@/components/AuthForm";
import { auth, db } from "@/config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { UserMeta, QuestionnaireData } from "@/types";
import { Button } from "@/components/ui/button";
import { saveQuestionnaireData } from "@/actions/questionnaireActions";

const PENDING_QUESTIONNAIRE_KEY = "pendingQuestionnaireData";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (values: { email: string; password: string }) => {
    if (!auth) {
      toast({ 
        title: "Configuration Error", 
        description: "Firebase Auth is not configured. Please contact support.", 
        variant: "destructive" 
      });
      throw new Error("Firebase Auth service not initialized.");
    }
     if (!db) {
      toast({ 
        title: "Configuration Error", 
        description: "Firebase Firestore is not configured. Please contact support.", 
        variant: "destructive" 
      });
      throw new Error("Firebase Firestore service not initialized.");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userMetaRef = doc(db, "users", user.uid, "meta", "data");
      const initialMeta: UserMeta = {
        email: user.email,
        hasPaid: false,
        hasGeneratedReport: false,
        questionnaireComplete: false,
      };
      await setDoc(userMetaRef, initialMeta);
      
      toast({ title: "Signup Successful", description: "Welcome to Perfectly Styled!" });

      // Check for pending questionnaire data
      const pendingDataString = localStorage.getItem(PENDING_QUESTIONNAIRE_KEY);
      if (pendingDataString) {
        try {
          const questionnaireData = JSON.parse(pendingDataString) as QuestionnaireData;
          const saveResult = await saveQuestionnaireData(user.uid, questionnaireData);
          if (saveResult.success) {
            toast({ title: "Questionnaire Saved!", description: "Your style profile is updated." });
            localStorage.removeItem(PENDING_QUESTIONNAIRE_KEY);
          } else {
            toast({ title: "Error Saving Questionnaire", description: saveResult.message, variant: "destructive" });
          }
        } catch (e) {
          console.error("Error processing pending questionnaire data:", e);
          toast({ title: "Error", description: "Could not process saved questionnaire data.", variant: "destructive" });
        }
      }
      
      router.push("/payment"); // Proceed to payment after signup (and potential questionnaire save)

    } catch (error: any) {
      console.error("Signup error:", error);
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
            errorMessage = "Email/password sign-up is not enabled for this project. Please contact support.";
            break;
          case "auth/weak-password":
            errorMessage = "The password is too weak. Please choose a stronger password (at least 6 characters).";
            break;
          case "auth/configuration-not-found":
             errorMessage = "Firebase configuration error. Please ensure environment variables are correctly set for the deployment.";
            break;
          default:
            if (error.message) {
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
          <Link href="/login">Login</Link>
        </Button>
      </p>
    </>
  );
}

