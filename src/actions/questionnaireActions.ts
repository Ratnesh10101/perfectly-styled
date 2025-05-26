<<<<<<< HEAD
"use server";

import { auth, db } from "@/config/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { generateStyleRecommendations } from "@/ai/flows/generate-style-recommendations";
import type { QuestionnaireData, UserReport, UserMeta } from "@/types";
import { revalidatePath } from "next/cache";

export async function saveQuestionnaireAndGenerateReport(
  userId: string,
  data: QuestionnaireData
): Promise<{ success: boolean; message: string; reportId?: string }> {
  if (!userId) {
    return { success: false, message: "User not authenticated." };
  }

  try {
    const questionnaireRef = doc(db, "users", userId, "questionnaire", "data");
    const questionnaireWithTimestamp = {
      ...data,
      userId,
      createdAt: serverTimestamp(),
    };
    await setDoc(questionnaireRef, questionnaireWithTimestamp);
    
    // Update user meta to indicate questionnaire is complete
    const userMetaRef = doc(db, "users", userId, "meta", "data");
    await setDoc(userMetaRef, { questionnaireComplete: true }, { merge: true });

    revalidatePath("/questionnaire"); // Revalidate if user comes back
    revalidatePath("/payment"); // User will be redirected here
    revalidatePath("/"); // For homepage CTA updates

    return { success: true, message: "Questionnaire saved! Proceed to payment." };

  } catch (error) {
    console.error("Error saving questionnaire:", error);
    return { success: false, message: "Failed to save questionnaire." };
  }
}


export async function processPaymentAndGenerateReport(
  userId: string
): Promise<{ success: boolean; message: string; reportId?: string }> {
 if (!userId) {
    return { success: false, message: "User not authenticated." };
  }
  try {
    // 1. Simulate Payment & Update User Meta
    const userMetaRef = doc(db, "users", userId, "meta", "data");
    await setDoc(userMetaRef, { hasPaid: true }, { merge: true });

    // 2. Fetch Questionnaire Data
    const questionnaireRef = doc(db, "users", userId, "questionnaire", "data");
    const questionnaireSnap = await getDoc(questionnaireRef);
    if (!questionnaireSnap.exists()) {
      return { success: false, message: "Questionnaire data not found." };
    }
    const questionnaireData = questionnaireSnap.data() as QuestionnaireData;

    // 3. Generate AI Report
    const aiInput = {
      questionnaireResponses: questionnaireData.preferences,
      dominantLine: questionnaireData.dominantLine,
      bodyShape: questionnaireData.bodyShape,
      scale: questionnaireData.scale,
    };
    const aiOutput = await generateStyleRecommendations(aiInput);

    // 4. Save Report
    const reportId = `report-${Date.now()}`; // Simple unique ID
    const reportRef = doc(db, "users", userId, "reports", reportId);
    const userReport: UserReport = {
      userId,
      recommendations: aiOutput.recommendations,
      questionnaireData: questionnaireData,
      generatedAt: serverTimestamp(),
    };
    await setDoc(reportRef, userReport);

    // 5. Update User Meta: Report Generated
    await setDoc(userMetaRef, { hasGeneratedReport: true, activeReportId: reportId }, { merge: true });
    
    revalidatePath("/report");
    revalidatePath("/payment");
    revalidatePath("/");

    return { success: true, message: "Report generated successfully!", reportId };

  } catch (error) {
    console.error("Error processing payment and generating report:", error);
    const userMetaRef = doc(db, "users", userId, "meta", "data");
    // Rollback payment status if report generation failed catastrophically after payment was marked
    await setDoc(userMetaRef, { hasPaid: false, hasGeneratedReport: false }, { merge: true });
    return { success: false, message: "Failed to generate report after payment." };
=======

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
  console.log(`Questionnaire Data Body Shape (from sendReportByEmail):`, questionnaireData?.bodyShape);
  // In a real application, this would use an email service.
  // For now, just log and return success.
  console.log(`SIMULATED: Email with style report would be sent to ${email}.`);
  return { success: true, message: `Report (simulated) would be sent to ${email}.` };
}

export async function processPaymentAndGenerateReport(
  questionnaireData: QuestionnaireData | null, // Allow null for validation
  email: string | null // Allow null for validation
): Promise<{ success: boolean; message: string; reportData?: UserReportData }> {
  console.log("--- processPaymentAndGenerateReport action entered on server (no auth flow) ---");

  if (!questionnaireData) {
    const errorMsg = "processPaymentAndGenerateReport ERRORED: No questionnaire data provided. This should have been caught client-side.";
    console.error(errorMsg);
    return { success: false, message: "Questionnaire data is missing. Cannot generate report." };
  }
  if (!email || !email.includes('@') || typeof email !== 'string') {
    const errorMsg = `processPaymentAndGenerateReport ERRORED: Invalid or missing email provided: ${String(email)}. This should have been caught client-side.`;
    console.error(errorMsg);
    return { success: false, message: "A valid email address is required to send the report." };
  }
  console.log("Received Questionnaire Data Body Shape:", questionnaireData.bodyShape);
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

    console.log(`Attempting to call generateStyleRecommendations for email: ${email}. Input bodyShape: ${aiInput.bodyShape}`);
    
    let aiOutput;
    try {
      aiOutput = await generateStyleRecommendations(aiInput);
      if (!aiOutput || !aiOutput.recommendations) {
        console.error(`AI generateStyleRecommendations returned null or no recommendations for email: ${email}. AI Output:`, aiOutput);
        return { success: false, message: "Failed to generate style recommendations. The AI model did not return a report." };
      }
      console.log(`AI recommendations received successfully for email: ${email}. Recommendations length: ${aiOutput.recommendations.length}`);
    } catch (aiError: any) {
      console.error("--- ERROR DURING AI CALL (generateStyleRecommendations) ---");
      console.error(`AI Error for email: ${email}`);
      let errorMessage = "An unknown AI error occurred while generating the report.";
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
      console.error(`Returning AI failure for ${email}: ${errorMessage}`);
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
    
    console.log(`Report content generated for email: ${email}. Attempting to send (simulated) email.`);
    const emailResult = await sendReportByEmail(email, reportData.recommendations, reportData.questionnaireData);
    if (!emailResult.success) {
      console.warn(`Failed to send email (simulated) to ${email}: ${emailResult.message}`);
      // Decide if this should be a partial failure or not. For now, proceed with success message as report is generated.
    }
    
    console.log(`Report generated and (simulated) email process completed for: ${email}. Returning success.`);
    
    return { success: true, message: "Report generated successfully! It will also be (simulated) sent to your email.", reportData };

  } catch (error: any) {
    // This catch block is for unexpected errors outside the AI call itself.
    console.error("--- processPaymentAndGenerateReport UNEXPECTED CRITICAL ERROR ---");
    console.error("Critical Error during payment/report processing for email:", email);
    let criticalErrorMessage = "An unknown server error occurred during report processing.";
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
    console.error(`Returning critical failure for ${email}: ${criticalErrorMessage}`);
    return { 
      success: false, 
      message: `An unexpected server error occurred. Please try again later. Details: ${criticalErrorMessage}` 
    };
>>>>>>> master
  }
}
