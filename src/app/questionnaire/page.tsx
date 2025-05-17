
"use client";

import QuestionnaireForm from "@/components/QuestionnaireForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { saveQuestionnaireData } from "@/actions/questionnaireActions";
import { useRouter } from "next/navigation";
import type { QuestionnaireData } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// New key for localStorage to avoid conflicts with old structure if any
const PENDING_QUESTIONNAIRE_KEY = "pendingQuestionnaireData_v2"; 

export default function QuestionnairePage() {
  const { currentUser, userMeta, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (data: QuestionnaireData) => {
    if (currentUser) { // User is logged in
      try {
        const result = await saveQuestionnaireData(currentUser.uid, data);
        if (result.success) {
          toast({ title: "Questionnaire Saved!", description: "Proceed to payment to get your report." });
          localStorage.removeItem(PENDING_QUESTIONNAIRE_KEY); // Clear any pending anonymous data
          router.push("/payment");
        } else {
          toast({ title: "Error Saving Questionnaire", description: result.message, variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Submission Error", description: "Could not save questionnaire.", variant: "destructive" });
      }
    } else { // User is not logged in (anonymous)
      try {
        localStorage.setItem(PENDING_QUESTIONNAIRE_KEY, JSON.stringify(data));
        toast({ title: "Answers Recorded!", description: "Please sign up or log in to save your progress and get your report." });
        router.push("/signup?fromQuestionnaire=true"); 
      } catch (error) {
        toast({ title: "Error Temporarily Saving Answers", description: "Could not save your answers locally. Please try again.", variant: "destructive" });
        console.error("Error saving questionnaire to localStorage:", error);
      }
    }
  };

  // If logged in and questionnaire is complete but report not generated, redirect to payment.
  if (!authLoading && currentUser && userMeta?.questionnaireComplete && !userMeta?.hasGeneratedReport) {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <Card className="text-center">
                <CardHeader>
                <CardTitle>Questionnaire Already Completed!</CardTitle>
                <CardDescription>You've already filled out your style questionnaire.</CardDescription>
                </CardHeader>
                <CardContent>
                <p className="mb-4">Ready to get your personalized style report?</p>
                <Button asChild size="lg">
                    <Link href="/payment">Proceed to Payment</Link>
                </Button>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  // If logged in and report is already generated, redirect to report.
  if (!authLoading && currentUser && userMeta?.hasGeneratedReport) {
     return (
        <div className="max-w-4xl mx-auto py-8">
            <Card className="text-center">
                <CardHeader>
                <CardTitle>Report Already Generated!</CardTitle>
                <CardDescription>You already have a style report.</CardDescription>
                </CardHeader>
                <CardContent>
                <Button asChild size="lg">
                    <Link href="/report">View Your Report</Link>
                </Button>
                </CardContent>
            </Card>
        </div>
     );
  }

  // For logged-out users, or logged-in users who haven't completed it yet.
  return (
    <div className="max-w-2xl mx-auto py-8"> {/* Adjusted max-width to match new form */}
      <QuestionnaireForm onSubmit={handleSubmit} />
    </div>
  );
}
