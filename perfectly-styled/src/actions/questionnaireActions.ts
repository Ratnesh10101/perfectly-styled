
"use server";

import { firebaseInitialized, firebaseInitError } from "@/config/firebase";
// Genkit and AI flow imports removed
import type { QuestionnaireData, UserReportData, LineAnswer, ScaleAnswer } from "@/types";

// This module is loaded on the server when an action is invoked.
console.log("questionnaireActions.ts module loaded on server.");


// Placeholder for actual email sending logic
async function sendReportByEmail(email: string, reportContent: string, questionnaireData: QuestionnaireData) {
  console.log(`--- sendReportByEmail action entered (SIMULATED) ---`);
  console.log(`Recipient Email: ${email}`);
  console.log(`Report Content Length: ${reportContent.length > 0 ? reportContent.length : 'N/A (empty)'}`);
  console.log(`Questionnaire Data Body Shape (from sendReportByEmail):`, questionnaireData?.bodyShape);
  console.log(`SIMULATED: Email with style report would be sent to ${email}.`);
  return { success: true, message: `Report (simulated) would be sent to ${email}.` };
}

function generateLogicBasedReport(questionnaireData: QuestionnaireData): string {
  let recommendations = "## Your Personalized Style Summary\n\n";

  recommendations += "### Based on Your Inputs:\n\n";

  recommendations += "**Line Analysis:**\n";
  let straightCount = 0;
  let curvedCount = 0;
  questionnaireData.lineAnswers.forEach(ans => {
    recommendations += `- ${ans.bodyPart}: ${ans.answer} (Classified as: ${ans.classification})\n`;
    if (ans.classification === 'straight') straightCount++;
    if (ans.classification === 'curved') curvedCount++;
  });

  let dominantLine = "mixed";
  if (straightCount > curvedCount) dominantLine = "predominantly straight";
  if (curvedCount > straightCount) dominantLine = "predominantly curved";
  recommendations += `Your overall line appears to be ${dominantLine}.\n\n`;

  recommendations += "**Scale Assessment:**\n";
  questionnaireData.scaleAnswers.forEach(ans => {
    recommendations += `- ${ans.category}: ${ans.answer}\n`;
  });
  recommendations += "\n";

  recommendations += `**Body Shape:** ${questionnaireData.bodyShape}\n\n`;

  recommendations += "### General Styling Suggestions:\n\n";

  if (dominantLine === "predominantly straight") {
    recommendations += "- **For Straight Lines:** Consider structured garments, crisp fabrics, tailored cuts, and geometric patterns. Straight lines in clothing will often harmonize with your natural lines.\n";
  } else if (dominantLine === "predominantly curved") {
    recommendations += "- **For Curved Lines:** Soft fabrics, draped styles, rounded details, and flowing silhouettes can be very flattering. Curved lines in clothing will echo your natural curves.\n";
  } else {
    recommendations += "- **For Mixed Lines:** You may find a balance of structured and softer elements works well, or you can choose to emphasize one aspect over the other depending on the look you want to achieve.\n";
  }

  switch (questionnaireData.bodyShape) {
    case "Pear Shape":
      recommendations += "- **Pear Shape Tip:** Aim to add volume or interest to your upper body (e.g., statement necklaces, detailed tops) and choose A-line or gently skimming styles for your lower body.\n";
      break;
    case "Inverted Triangle":
      recommendations += "- **Inverted Triangle Tip:** Focus on adding volume or width to your lower body (e.g., fuller skirts, wide-leg trousers) while keeping your upper body sleeker.\n";
      break;
    case "Straight":
      recommendations += "- **Straight Shape Tip:** You can create curves with peplums, ruffles, or by cinching the waist with a belt. Layering can also add dimension.\n";
      break;
    case "Round/Apple":
      recommendations += "- **Round/Apple Shape Tip:** Empire waists, A-line silhouettes, and structured fabrics that skim over the midsection can be flattering. V-necks can elongate.\n";
      break;
    case "Hourglass":
      recommendations += "- **Hourglass Tip:** Styles that define your waist will often look best. Body-skimming (not overly tight) silhouettes highlight your balanced proportions.\n";
      break;
  }
  
  // Simple scale advice
  const hasSmallScale = questionnaireData.scaleAnswers.some(ans => ans.answer.toLowerCase().includes("small"));
  const hasLargeScale = questionnaireData.scaleAnswers.some(ans => ans.answer.toLowerCase().includes("large"));

  if (hasSmallScale && !hasLargeScale) {
    recommendations += "- **Scale Tip:** For a smaller scale, consider finer details, smaller prints, and accessories that are in proportion to your frame.\n";
  } else if (hasLargeScale && !hasSmallScale) {
    recommendations += "- **Scale Tip:** For a larger scale, you can often carry off bolder prints, larger accessories, and more substantial fabrics and details.\n";
  } else {
     recommendations += "- **Scale Tip:** For a medium scale, you have versatility with prints and accessories. Choose what feels balanced and harmonious.\n";
  }
  
  recommendations += "\nRemember, these are general guidelines. The best style is one that makes you feel confident and comfortable!\n";

  return recommendations;
}


export async function processPaymentAndGenerateReport(
  questionnaireData: QuestionnaireData | null,
  email: string | null
): Promise<{ success: boolean; message: string; reportData?: UserReportData }> {
  console.log("--- processPaymentAndGenerateReport action entered on server (NO-AI flow) ---");
  console.log(`Initial Firebase Initialized: ${firebaseInitialized}, Firebase Init Error: ${firebaseInitError || 'None'}`);
  // Genkit related logs removed

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

  // Firebase and Genkit initialization checks are still relevant if other parts of app use Firebase.
  // For this specific action now, only Firebase related checks might be relevant if we decide to store reports later.
  // Since we are not using AI, the Genkit check is removed from this particular path.

  console.log("Received Questionnaire Data Body Shape:", questionnaireData.bodyShape);
  console.log("Received Email:", email);

  try {
    console.log(`Proceeding to generate report for email: ${email}`);

    // Generate report using simple logic
    const reportContent = generateLogicBasedReport(questionnaireData);
    console.log(`Logic-based report generated successfully for email: ${email}. Report length: ${reportContent.length}`);
    
    const reportData: UserReportData = {
      recommendations: reportContent,
      questionnaireData: questionnaireData,
      recipientEmail: email,
      generatedAtClient: new Date().toISOString(),
    };

    console.log(`Report content generated for email: ${email}. Attempting to send (simulated) email.`);
    const emailResult = await sendReportByEmail(email, reportData.recommendations, reportData.questionnaireData);
    if (!emailResult.success) {
      console.warn(`Failed to send email (simulated) to ${email}: ${emailResult.message}`);
    }

    console.log(`Report generated and (simulated) email process completed for: ${email}. Returning success.`);
    return { success: true, message: "Report generated successfully! It will also be (simulated) sent to your email.", reportData };

  } catch (error: any) {
    console.error("--- processPaymentAndGenerateReport UNEXPECTED CRITICAL ERROR (NO-AI flow) ---");
    console.error("Critical Error during report processing for email:", email);
    let errorMessage = "An unknown server error occurred during report processing.";
    if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        if ((error as any).cause) console.error("Error cause:", (error as any).cause);
    } else {
        console.error("Critical Error (not an Error object):", error);
        try { errorMessage = JSON.stringify(error); } catch { errorMessage = "Could not stringify critical error object."; }
    }
    console.error(`Returning critical failure for ${email}: ${errorMessage}`);
    return {
      success: false,
      message: "An unexpected server error occurred. Please try again later."
    };
  }
}
