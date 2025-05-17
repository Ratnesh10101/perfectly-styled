
"use client";

import AuthForm from "@/components/AuthForm";
import { auth, db } from "@/config/firebase"; // db might not be needed here but auth is crucial
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { UserMeta } from "@/types";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (values: { email: string; password: string }) => {
    if (!auth || !db) { // Check if Firebase auth/db services are available
      toast({ 
        title: "Configuration Error", 
        description: "Firebase is not configured correctly. Please ensure environment variables are set and contact support if the issue persists.", 
        variant: "destructive" 
      });
      throw new Error("Firebase services (auth/db) not initialized. Check environment variables.");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Create user meta document
      const userMetaRef = doc(db, "users", user.uid, "meta", "data");
      const initialMeta: UserMeta = {
        email: user.email,
        hasPaid: false,
        hasGeneratedReport: false,
        questionnaireComplete: false,
      };
      await setDoc(userMetaRef, initialMeta);
      
      toast({ title: "Signup Successful", description: "Welcome to Perfectly Styled!" });
      router.push("/questionnaire"); // Redirect to questionnaire after signup
    } catch (error: any) {
      console.error("Signup error:", error); // Log the full error for debugging
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
          case "auth/configuration-not-found": // Explicitly handle this
            errorMessage = "Firebase configuration is missing or invalid. Please contact support.";
            break;
          default:
            if (error.message) {
                 errorMessage = `Signup failed: ${error.message}`;
            }
            // Check if it might be a Firestore error after successful auth
            if (error.message && error.message.toLowerCase().includes("firestore")) {
                 errorMessage = "Account created, but failed to save user profile information. Please try logging in or contact support.";
            }
        }
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      toast({ title: "Signup Failed", description: errorMessage, variant: "destructive" });
      throw new Error(errorMessage); // Propagate error to AuthForm
    }
  };

  return (
    <>
      <AuthForm
        mode="signup"
        onSubmit={handleSignup}
        title="Create Your Account"
        description="Join Perfectly Styled to discover your unique style."
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
