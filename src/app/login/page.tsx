
"use client";

import AuthForm from "@/components/AuthForm";
import { auth } from "@/config/firebase";
import { signInWithEmailAndPassword, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { saveQuestionnaireData } from "@/actions/questionnaireActions";
import type { QuestionnaireData } from "@/types";

const PENDING_QUESTIONNAIRE_KEY = "pendingQuestionnaireData";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (values: { email: string; password: string }) => {
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
      const user = userCredential.user as User;
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
            router.push("/payment"); // Go to payment after saving questionnaire
            return;
          } else {
            toast({ title: "Error Saving Questionnaire", description: saveResult.message, variant: "destructive" });
          }
        } catch (e) {
          console.error("Error processing pending questionnaire data:", e);
          toast({ title: "Error", description: "Could not process saved questionnaire data.", variant: "destructive" });
        }
      }
      
      // Standard redirect if no pending questionnaire data
      router.push("/"); 

    } catch (error: any) {
      let errorMessage = "Failed to login. Please check your credentials.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password.";
      } else if (error.message && error.message.includes("auth/configuration-not-found")) {
        errorMessage = "Firebase configuration error. Please contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
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
          <Link href="/signup">Sign up</Link>
        </Button>
      </p>
    </>
  );
}
