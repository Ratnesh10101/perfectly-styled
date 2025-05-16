"use client";

import AuthForm from "@/components/AuthForm";
import { auth, db } from "@/config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { UserMeta } from "@/types";
import { Button } from "@/components/ui/button"; // Added import

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
      let errorMessage = "Failed to sign up. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use. Try logging in.";
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
