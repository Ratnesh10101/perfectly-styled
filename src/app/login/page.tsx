"use client";

import AuthForm from "@/components/AuthForm";
import { auth } from "@/config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push("/");
    } catch (error: any) {
      let errorMessage = "Failed to login. Please check your credentials.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password.";
      }
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
      throw new Error(errorMessage); // Propagate error to AuthForm
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
