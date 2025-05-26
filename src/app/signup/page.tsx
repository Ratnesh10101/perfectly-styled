
<<<<<<< HEAD
"use client";

import AuthForm from "@/components/AuthForm";
import { auth, db } from "@/config/firebase";
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

=======
'use client'; // <--- ADD THIS LINE

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
>>>>>>> master
