
"use server";

import { generateStyleRecommendations, type StyleRecommendationsInput } from "@/ai/flows/generate-style-recommendations";
import type { QuestionnaireData, UserReportData } from "@/types";

// This module is loaded on the server when an action is invoked.
console.log("questionnaireActions.ts module loaded on server.");

// Placeholder for actual email sending logic
async function sendReportByEmail(email: string, reportContent: string, questionnaireData: QuestionnaireData) {
  console.log(`--- sendReportByEmail action entered (SIMULATED) ---`);
  console.log(`Recipient Email: ${email}`);
  console.log(`Report Content Length: ${reportContent.length > 0 ? reportContent.length : 'N/A (empty)'}`);
  console.log(`Questionnaire Data Body Shape:`, questionnaireData.bodyShape); // Log a sample to confirm data presence
  // In a real application, this would use an email service.
  // For now, just log and return success.
  console.log(`SIMULATED: Email with report would be sent to ${email}.`);
  return { success: true, message: `Report (simulated) would be sent to ${email}.` };
}

export async function processPaymentAndGenerateReport(
  questionnaireData: QuestionnaireData,
  email: string
): Promise<{ success: boolean; message: string; reportData?: UserReportData }> {
  console.log("--- processPaymentAndGenerateReport action entered on server (no auth flow) ---");
  
  if (!questionnaireData) {
    const errorMsg = "processPaymentAndGenerateReport ERRORED: No questionnaire data provided. This should have been caught client-side.";
    console.error(errorMsg);
    return { success: false, message: "Questionnaire data is missing. Cannot generate report." };
  }
  if (!email || !email.includes('@')) { 
    const errorMsg = `processPaymentAndGenerateReport ERRORED: Invalid email provided: ${email}. This should have been caught client-side.`;
    console.error(errorMsg);
    return { success: false, message: "A valid email address is required to send the report." };
  }
  console.log("Received Questionnaire Data (first line answer):", questionnaireData.lineAnswers.length > 0 ? questionnaireData.lineAnswers[0] : "No line answers");
  console.log("Received Email:", email);

  try {
    // Simulate payment processing success
    console.log(`Simulated payment successful for email: ${email}`);

    const aiInput: StyleRecommendationsInput = {
      lineDetails: questionnaireData.lineAnswers,
      scaleDetails: questionnaireData.scaleAnswers,
      bodyShape: questionnaireData.bodyShape,
      preferences: "", // Preferences were removed from the questionnaire
    };

    console.log(`Calling generateStyleRecommendations for email: ${email}. Input bodyShape: ${aiInput.bodyShape}`);
    
    let aiOutput;
    try {
      aiOutput = await generateStyleRecommendations(aiInput);
      console.log(`AI recommendations received for email: ${email}. Output recommendations length: ${aiOutput?.recommendations?.length ?? 'N/A'}`);
      if (!aiOutput || !aiOutput.recommendations) {
        console.error(`AI generateStyleRecommendations returned null or no recommendations for email: ${email}`);
        return { success: false, message: "Failed to generate style recommendations. The AI model did not return a report." };
      }
    } catch (aiError: any) {
      console.error("--- ERROR DURING AI CALL (generateStyleRecommendations) ---");
      console.error(`AI Error for email: ${email}`);
      // Avoid stringifying potentially complex input if it's not strictly needed for this console log,
      // especially if it could be very large or have circular references.
      // console.error("Input used (sample):", { bodyShape: aiInput.bodyShape, lineAnswersCount: aiInput.lineDetails.length });
      
      let errorMessage = "An unknown AI error occurred.";
      if (aiError instanceof Error) {
        errorMessage = aiError.message;
        console.error("AI Error message:", aiError.message);
        console.error("AI Error stack:", aiError.stack);
        if ((aiError as any).cause) console.error("AI Error cause:", (aiError as any).cause);
      } else {
        console.error("AI Error (not an Error object):", aiError);
        try {
          errorMessage = JSON.stringify(aiError);
        } catch {
          errorMessage = "Could not stringify AI error object.";
        }
      }
      return { 
        success: false, 
        message: `An error occurred while generating the style report with AI. Please try again later. Details: ${errorMessage}`
      };
    }

    const reportData: UserReportData = {
      recommendations: aiOutput.recommendations,
      questionnaireData: questionnaireData,
      recipientEmail: email,
      generatedAtClient: new Date().toISOString(), 
    };
    
    console.log(`Attempting to send report by email to ${email}`);
    const emailResult = await sendReportByEmail(email, reportData.recommendations, reportData.questionnaireData);
    if (!emailResult.success) {
      console.warn(`Failed to send email (simulated) to ${email}: ${emailResult.message}`);
      // Decide if this should be a partial failure or not. For now, proceed with success message as report is generated.
    }
    
    console.log(`Report generated and (simulated) email process completed for: ${email}`);
    
    return { success: true, message: "Report generated successfully! It will also be (simulated) sent to your email.", reportData };

  } catch (error: any) {
    // This catch block is for unexpected errors outside the AI call itself.
    console.error("--- processPaymentAndGenerateReport UNEXPECTED CRITICAL ERROR ---");
    console.error("Error during payment/report processing for email:", email);
    let criticalErrorMessage = "An unknown server error occurred.";
    if (error instanceof Error) {
        criticalErrorMessage = error.message;
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        if ((error as any).cause) {
          console.error("Error cause:", (error as any).cause);
        }
    } else {
        console.error("Critical Error (not an Error object):", error);
        try {
            criticalErrorMessage = JSON.stringify(error);
        } catch {
            criticalErrorMessage = "Could not stringify critical error object.";
        }
    }
    return { 
      success: false, 
      message: `An unexpected server error occurred. Please try again later. Details: ${criticalErrorMessage}` 
    };
  }
}
