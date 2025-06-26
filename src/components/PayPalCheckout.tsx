"use client";

import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useState } from "react";

interface PayPalCheckoutProps {
  amount: number; // USD
  onSuccess: (orderId: string) => void;
  onError: (error: any) => void;
}

export default function PayPalCheckout({ amount, onSuccess, onError }: PayPalCheckoutProps) {
  const [{ isPending }] = usePayPalScriptReducer();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="w-full flex flex-col items-center">
      {isPending && <div className="text-gray-500">Loading PayPal...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <PayPalButtons
        style={{ layout: "vertical" }}
        createOrder={async (data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: amount.toFixed(2),
                  currency_code: "USD",
                },
              },
            ],
          });
        }}
        onApprove={async (data, actions) => {
          try {
            const details = await actions.order?.capture();
            if (details?.id) {
              onSuccess(details.id);
            } else {
              setError("Payment approved but no order ID found.");
              onError("No order ID");
            }
          } catch (err) {
            setError("Payment could not be captured.");
            onError(err);
          }
        }}
        onError={(err) => {
          setError("Payment failed. Please try again.");
          onError(err);
        }}
      />
    </div>
  );
}
