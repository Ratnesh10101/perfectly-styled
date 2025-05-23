
"use client";

import { useEffect, useState } from "react";
import PaymentComponent from "@/components/PaymentComponent";
// ProtectedRoute removed
// import { useAuth } from "@/hooks/useAuth"; // useAuth removed
import { useToast } from "@/hooks/use-toast";
import { processPaymentAndGenerateReport } from "@/actions/questionnaireActions";
import { useRouter } from "next/navigation";
import type { QuestionnaireData, UserReportData } from "@/types"; // UserMeta removed
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/LoadingSpinner";

const PENDING_QUESTIONNAIRE_KEY = "pendingQuestionnaireData_v2";
const REPORT_SESSION_KEY = "generatedReportData";

export default function PaymentPage() {
  // Removed useAuth related state
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const dataString = localStorage.getItem(PENDING_QUESTIONNAIRE_KEY);
    if (dataString) {
      try {
        setQuestionnaireData(JSON.parse(dataString));
      } catch (e) {
        console.error("Error parsing questionnaire data from localStorage:", e);
        toast({ title: "Error", description: "Could not load your questionnaire answers. Please try again.", variant: "destructive" });
        router.push("/questionnaire");
      }
    } else {
      toast({ title: "Questionnaire Data Missing", description: "Please complete the questionnaire first.", variant: "destructive" });
      router.push("/questionnaire");
    }
    setIsLoadingData(false);
  }, [router, toast]);

  const handlePaymentSuccess = async () => {
    if (!questionnaireData) {
      toast({ title: "Error", description: "Questionnaire data is missing.", variant: "destructive" });
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Pass questionnaireData and email to the action
      const result = await processPaymentAndGenerateReport(questionnaireData, email.trim());
      if (result.success && result.reportData) {
        toast({ title: "Payment Successful!", description: "Your style report is being generated." });
        
        // Store report data in sessionStorage for the report page to access
        sessionStorage.setItem(REPORT_SESSION_KEY, JSON.stringify(result.reportData));
        localStorage.removeItem(PENDING_QUESTIONNAIRE_KEY); // Clear questionnaire from localStorage
        
        router.push("/report");
      } else {
        toast({ title: "Report Generation Failed", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      console.error("Payment/Report generation error:", error);
      toast({ title: "Error", description: "Could not process payment or generate report.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return <LoadingSpinner fullPage />;
  }

  if (!questionnaireData && !isLoadingData) {
     return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Questionnaire Not Found</CardTitle>
            <CardDescription>We couldn't find your questionnaire answers. Please complete it first.</CardDescription>
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

  // Removed ProtectedRoute wrapper and userMeta checks
  return (
    <div className="max-w-4xl mx-auto py-8 flex flex-col items-center">
      <Card className="w-full max-w-md mb-8">
        <CardHeader>
          <CardTitle>Your Email</CardTitle>
          <CardDescription>Please provide your email address to receive your style report.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
          </div>
        </CardContent>
      </Card>
      <PaymentComponent onPaymentSuccess={handlePaymentSuccess} />
    </div>
  );
}
