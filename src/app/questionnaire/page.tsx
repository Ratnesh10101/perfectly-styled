"use client";

import QuestionnaireForm from "@/components/QuestionnaireForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { saveQuestionnaireAndGenerateReport } from "@/actions/questionnaireActions";
import { useRouter } from "next/navigation";
import type { QuestionnaireData } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function QuestionnairePage() {
  const { currentUser, userMeta } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (data: QuestionnaireData) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      router.push("/login");
      return;
    }
    try {
      const result = await saveQuestionnaireAndGenerateReport(currentUser.uid, data);
      if (result.success) {
        toast({ title: "Questionnaire Saved!", description: "Proceed to payment to get your report." });
        router.push("/payment");
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Submission Error", description: "Could not save questionnaire.", variant: "destructive" });
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto">
        {userMeta?.questionnaireComplete && !userMeta?.hasGeneratedReport ? (
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
        ) : userMeta?.hasGeneratedReport ? (
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
        ) : (
          <QuestionnaireForm onSubmit={handleSubmit} />
        )}
      </div>
    </ProtectedRoute>
  );
}
