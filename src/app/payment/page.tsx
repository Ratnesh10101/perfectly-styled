
"use client";

import { useEffect, useState } from "react";
import PaymentComponent from "@/components/PaymentComponent";
import { useToast } from "@/hooks/use-toast";
import { processPaymentAndGenerateReport } from "@/actions/questionnaireActions";
import { useRouter } from "next/navigation";
import type { QuestionnaireData, UserReportData } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/LoadingSpinner";

const PENDING_QUESTIONNAIRE_KEY = "pendingQuestionnaireData_v2";
const REPORT_SESSION_KEY = "generatedReportData";

export default function PaymentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true); // For loading questionnaire data

  useEffect(() => {
    setIsLoadingData(true);
    console.log("PaymentPage: Attempting to load questionnaire data from localStorage.");
    const dataString = localStorage.getItem(PENDING_QUESTIONNAIRE_KEY);
    if (dataString) {
      try {
        const parsedData = JSON.parse(dataString);
        console.log("PaymentPage: Successfully parsed questionnaire data:", parsedData);
        setQuestionnaireData(parsedData);
      } catch (e) {
        console.error("PaymentPage: Error parsing questionnaire data from localStorage:", e);
        toast({ title: "Error Loading Data", description: "Could not load your questionnaire answers. Please complete the questionnaire again.", variant: "destructive" });
        router.push("/questionnaire");
      }
    } else {
      console.warn("PaymentPage: No questionnaire data found in localStorage. Redirecting to questionnaire.");
      toast({ title: "Questionnaire Data Missing", description: "Please complete the questionnaire first to proceed to payment.", variant: "destructive" });
      router.push("/questionnaire");
    }
    setIsLoadingData(false);
  }, [router, toast]);

  const handlePaymentSuccess = async () => {
    if (!questionnaireData) {
      toast({ title: "Error", description: "Questionnaire data is missing. Please complete the questionnaire again.", variant: "destructive" });
      router.push("/questionnaire");
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address to receive your report.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    console.log("Client: Initiating payment and report generation for email:", email);
    try {
      const result = await processPaymentAndGenerateReport(questionnaireData, email.trim());
      console.log("Client: Received response from server action:", result);

      if (result.success && result.reportData) {
        toast({ title: "Payment Successful!", description: "Your style report has been generated." });
        sessionStorage.setItem(REPORT_SESSION_KEY, JSON.stringify(result.reportData));
        localStorage.removeItem(PENDING_QUESTIONNAIRE_KEY);
        router.push("/report");
      } else {
        console.error("Client: Report generation failed. Server message:", result.message);
        toast({
          title: "Report Generation Failed",
          description: result.message || "An unknown error occurred on the server. Please check server logs for more details, especially regarding Genkit initialization and GOOGLE_API_KEY.",
          variant: "destructive",
          duration: 10000, 
        });
      }
    } catch (error: any) {
      console.error("Client: Critical error during handlePaymentSuccess:", error);
      let description = "Could not process payment or generate report due to a client-side or network error.";
      if (error instanceof Error) {
        description = error.message;
      } else if (typeof error === 'string') {
        description = error;
      }
      toast({
        title: "Processing Error",
        description: description,
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      console.log("Client: Setting isLoading to false in finally block.");
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
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>
      <PaymentComponent onPaymentSuccess={handlePaymentSuccess} />
      {isLoading && <LoadingSpinner fullPage />}
    </div>
  );
}
