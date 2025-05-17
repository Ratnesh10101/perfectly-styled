
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, DraftingCompass, LogIn, FileText, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

export default function HomePage() {
  const { currentUser, userMeta, loading } = useAuth();

  const getButtonLink = () => {
    if (!currentUser) {
      return "/questionnaire"; // New users start with questionnaire
    }
    if (userMeta?.hasGeneratedReport) {
      return "/report";
    }
    if (userMeta?.questionnaireComplete && !userMeta?.hasPaid) {
      return "/payment";
    }
    // Default for logged-in users who haven't completed all steps or if meta is loading
    return "/questionnaire"; 
  };

  const getButtonTextAndIcon = () => {
    if (!currentUser) {
      return { text: "Start Your Style Questionnaire", icon: <DraftingCompass className="ml-2 h-5 w-5" /> };
    }
    if (userMeta?.hasGeneratedReport) {
      return { text: "View Your Report", icon: <FileText className="ml-2 h-5 w-5" /> };
    }
    if (userMeta?.questionnaireComplete && !userMeta?.hasPaid) {
      return { text: "Proceed to Payment", icon: <ArrowRight className="ml-2 h-5 w-5" /> };
    }
    return { text: "Complete Your Style Questionnaire", icon: <DraftingCompass className="ml-2 h-5 w-5" /> };
  };

  const { text: buttonText, icon: buttonIcon } = getButtonTextAndIcon();

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-2xl shadow-xl animate-pulse">
                <CardHeader className="pb-4">
                    <div className="flex justify-center mb-6">
                        <div className="h-32 w-32 bg-muted rounded-full"></div>
                    </div>
                    <div className="h-8 bg-muted rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-muted rounded w-full mt-2"></div>
                    <div className="h-4 bg-muted rounded w-5/6 mx-auto mt-1"></div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="h-6 bg-muted rounded w-1/2 mx-auto"></div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                    <div className="h-12 bg-muted rounded w-60"></div>
                    {!currentUser && <div className="h-12 bg-muted rounded w-32"></div>}
                </CardFooter>
            </Card>
        </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-6">
             <Image src="https://placehold.co/120x120.png" alt="Perfectly Styled Logo" data-ai-hint="logo fashion" width={120} height={120} className="rounded-full" />
          </div>
          <CardTitle className="text-4xl font-bold tracking-tight text-primary">Welcome to Perfectly Styled!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Discover your unique style identity. Our AI-powered analysis helps you understand your body shape, scale, and dominant lines to curate a wardrobe that truly represents you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 border rounded-lg bg-background">
              <h3 className="font-semibold text-lg mb-1">Personalized Insights</h3>
              <p className="text-sm text-muted-foreground">Unlock recommendations tailored to your specific features and preferences.</p>
            </div>
             <div className="p-4 border rounded-lg bg-background">
              <h3 className="font-semibold text-lg mb-1">AI-Powered Precision</h3>
              <p className="text-sm text-muted-foreground">Leverage cutting-edge AI to analyze your style inputs effectively.</p>
            </div>
             <div className="p-4 border rounded-lg bg-background">
              <h3 className="font-semibold text-lg mb-1">Boost Confidence</h3>
              <p className="text-sm text-muted-foreground">Dress with confidence knowing your outfits are perfectly styled for you.</p>
            </div>
          </div>
           <p className="text-muted-foreground">
            First, complete our style questionnaire. Then, sign up to save your results and proceed to get your comprehensive style report for just <strong className="text-primary">£19.99</strong>.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
          <Button asChild size="lg">
            <Link href={getButtonLink()}>{buttonText} {buttonIcon}</Link>
          </Button>
          {!currentUser && (
            <>
              <Button variant="outline" asChild size="lg">
                <Link href="/login">Login <LogIn className="ml-2 h-5 w-5" /></Link>
              </Button>
               <Button variant="ghost" asChild size="lg" className="text-sm">
                <Link href="/signup">Or Sign Up <UserPlus className="ml-2 h-4 w-4" /></Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
