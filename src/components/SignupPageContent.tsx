
'use client';

import AuthForm from "@/components/AuthForm";
// Firebase imports (auth, createUserWithEmailAndPassword) are removed as this page is deprecated
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// saveQuestionnaireData import is removed as it's no longer used here

const PENDING_QUESTIONNAIRE_KEY = "pendingQuestionnaireData_v2"; 

export default function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleSignup = async (values: { email: string; password: string }) => {
    // Since signup is removed, this function now indicates the feature is disabled
    toast({
      title: "Account Creation Not Available",
      description: "This application now operates without user accounts. Please proceed via the questionnaire.",
      variant: "destructive",
    });
    // Redirect to questionnaire or payment if appropriate
    const fromQuestionnaire = searchParams.get("fromQuestionnaire") === "true";
    if (fromQuestionnaire) {
      router.push("/payment"); 
    } else {
      router.push("/questionnaire");
    }
    throw new Error("Account creation is disabled."); // Prevent form from proceeding
  };

  const fromQuestionnaire = searchParams.get("fromQuestionnaire") === "true";
  // The login link is also less relevant in a no-account flow
  const loginHref = fromQuestionnaire ? "/payment" : "/questionnaire"; // Simplified redirection

  return (
    <>
      <AuthForm
        mode="signup"
        onSubmit={handleSignup}
        title="Account Creation (Optional)"
        description={fromQuestionnaire 
          ? "Optionally create an account, or proceed to payment with your email." 
          : "Join Perfectly Styled."}
        buttonText="Sign Up (Not Required)"
      />
      <p className="text-center text-sm text-muted-foreground mt-4">
        {fromQuestionnaire 
          ? "To get your report, " 
          : "To get started, "}
        {fromQuestionnaire ? (
          <Button variant="link" asChild className="p-0 h-auto">
            <Link href="/payment">
              Proceed to Payment
            </Link>
          </Button>
        ) : (
          <Button variant="link" asChild className="p-0 h-auto">
            <Link href="/questionnaire">Start the Questionnaire</Link>
          </Button>
        )}
      </p>
    </>
  );
}
