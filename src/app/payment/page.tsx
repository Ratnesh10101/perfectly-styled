
"use client";

import PaymentComponent from "@/components/PaymentComponent";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { processPaymentAndGenerateReport } from "@/actions/questionnaireActions";
import { useRouter } from "next/navigation";
import type { UserMeta } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const paymentCheck = (meta: UserMeta | null): boolean => {
  // Allow access if questionnaire is complete AND (user hasn't paid OR payment failed and report not generated)
  return !!( // Coerce the entire expression to boolean
    meta &&
    meta.questionnaireComplete &&
    (!meta.hasPaid || !meta.hasGeneratedReport)
  );
};

export default function PaymentPage() {
  const { currentUser, userMeta } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handlePaymentSuccess = async () => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      router.push("/login");
      return;
    }

    try {
      const result = await processPaymentAndGenerateReport(currentUser.uid);
      if (result.success) {
        toast({ title: "Payment Successful!", description: "Your style report is being generated." });
        router.push("/report");
      } else {
        toast({ title: "Report Generation Failed", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not process payment or generate report.", variant: "destructive" });
    }
  };

  if (userMeta?.hasGeneratedReport) {
     return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Report Already Generated!</CardTitle>
            <CardDescription>You have already paid and your report is available.</CardDescription>
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

  if (userMeta && !userMeta.questionnaireComplete) {
     return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Questionnaire Not Completed</CardTitle>
            <CardDescription>Please complete your style questionnaire before proceeding to payment.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/questionnaire">Go to Questionnaire</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <ProtectedRoute checkMeta={paymentCheck} redirectPath="/questionnaire">
      <div className="max-w-4xl mx-auto py-8">
        <PaymentComponent onPaymentSuccess={handlePaymentSuccess} />
      </div>
    </ProtectedRoute>
  );
}
