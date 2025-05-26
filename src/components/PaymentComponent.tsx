<<<<<<< HEAD
=======

>>>>>>> master
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Diamond, CreditCard } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import Image from "next/image";

interface PaymentComponentProps {
<<<<<<< HEAD
  onPaymentSuccess: () => Promise<void>;
=======
  onPaymentSuccess: () => Promise<void>; // Email is now collected in parent
>>>>>>> master
  price?: string;
}

export default function PaymentComponent({ onPaymentSuccess, price = "£19.99" }: PaymentComponentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    // In a real app, you would integrate Stripe Elements here
    // For now, simulate a successful payment
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
<<<<<<< HEAD
    await onPaymentSuccess();
    // setIsLoading(false); // Parent component will handle navigation, so loading state might end there
=======
    await onPaymentSuccess(); 
    // setIsLoading is handled by parent or navigation
>>>>>>> master
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
            <Diamond className="h-16 w-16 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold text-primary">Unlock Your Style Report</CardTitle>
        <CardDescription className="text-lg pt-1">
          One-time payment for your personalized AI style analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-4xl font-extrabold ">{price}</p>
          <p className="text-sm text-muted-foreground">Includes comprehensive analysis and personalized recommendations.</p>
        </div>
        <div className="flex justify-center">
            <Image src="https://placehold.co/300x60.png" alt="Secure Payment Gateway Logos" data-ai-hint="payment logos" width={300} height={60}/>
        </div>
        <p className="text-xs text-muted-foreground text-center">
           This is a secure transaction. For demonstration purposes, clicking "Pay Now" will simulate a successful payment and generate your report. No actual payment will be processed.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handlePayment} className="w-full text-lg py-6" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size={24} className="mr-2" /> : <CreditCard className="mr-2 h-5 w-5" />}
<<<<<<< HEAD
          {isLoading ? "Processing..." : `Pay ${price} Now`}
        </Button>
      </CardFooter>
    </Card>
=======
          {isLoading ? "Processing..." : `Pay ${price} Now & Get Report`}
        </Button>
      </CardFooter>
    </Card> // Added closing Card tag here
>>>>>>> master
  );
}
