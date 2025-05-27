
"use server";

import type { QuestionnaireData, UserReportData, LineAnswer, ScaleAnswer } from "@/types";
import { firebaseInitialized, firebaseInitError } from "@/config/firebase"; // db and auth no longer needed
import { bodyShapeAdvice, dominantLineAdvice, dominantScaleAdvice } from '@/data/styleReports';

// This module is loaded on the server when an action is invoked.
console.log("questionnaireActions.ts module loaded on server (logic-based report version).");

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

// Helper function to map form body shape value to data key
function getBodyShapeKey(formValue: string): string | undefined {
    // "Pear Shape" -> "pear"
    // "Inverted Triangle" -> "invertedTriangle"
    // "Straight" -> "rectangle" (as per our styleReports.ts data structure)
    // "Round/Apple" -> "apple"
    // "Hourglass" -> "hourglass"
    const mapping: Record<string, string> = {
        "Pear Shape": "pear",
        "Inverted Triangle": "invertedTriangle",
        "Straight": "rectangle",
        "Round/Apple": "apple",
        "Hourglass": "hourglass",
    };
    return mapping[formValue];
}


function generateLogicBasedReport(questionnaireData: QuestionnaireData): string {
  console.log("--- generateLogicBasedReport called with questionnaireData:", JSON.stringify(questionnaireData, null, 2));
  let recommendations = "## Your Personalized Style Summary\n\n";

  try {
    // --- Line Analysis ---
    let straightCount = 0;
    let curvedCount = 0;
    questionnaireData.lineAnswers.forEach(ans => {
      if (ans.classification === 'straight') straightCount++;
      if (ans.classification === 'curved') curvedCount++;
    });

    let dominantLine: 'Straight' | 'Curved' | 'Combination' = 'Combination'; // Default
    if (straightCount > 0 && curvedCount === 0) {
        dominantLine = 'Straight';
    } else if (curvedCount > 0 && straightCount === 0) {
        dominantLine = 'Curved';
    } else if (straightCount > 0 && curvedCount > 0) { // Both present
        dominantLine = 'Combination';
    }
    // If both are 0, it stays 'Combination' (or could be an 'Incomplete' state)
    // For this logic, if both are present, it's always combination.
    // If only one type is present, it's that type.

    console.log(`Calculated dominantLine: ${dominantLine}`);

    recommendations += "### Line Analysis:\n";
    questionnaireData.lineAnswers.forEach(ans => {
      recommendations += `- ${ans.bodyPart}: ${ans.answer} (Classified as: ${ans.classification})\n`;
    });
    const lineAdviceKey = dominantLine.toLowerCase() as keyof typeof dominantLineAdvice;
    const lineAdvice = dominantLineAdvice[lineAdviceKey];

    if (lineAdvice) {
      recommendations += `\n**Your Dominant Line: ${lineAdvice.title}**\n`;
      recommendations += `${lineAdvice.advice}\n`;
      if (lineAdvice.elements) {
        for (const [key, value] of Object.entries(lineAdvice.elements)) {
          recommendations += `\n*${key.charAt(0).toUpperCase() + key.slice(1)}:*\n`;
          if (Array.isArray(value)) {
            value.forEach((item: string) => recommendations += `  - ${item}\n`);
          } else {
            recommendations += `  - ${value}\n`;
          }
        }
      }
    } else {
      recommendations += `\n**Dominant Line: ${dominantLine}**\nNo specific advice found for this dominant line type in the dataset.\n`;
      console.warn(`No specific advice found for dominantLine: ${dominantLine} (key: ${lineAdviceKey})`);
    }
    recommendations += "\n---\n";

    // --- Scale Assessment ---
    let smallScaleCount = 0;
    let mediumScaleCount = 0;
    let largeScaleCount = 0;
    questionnaireData.scaleAnswers.forEach(ans => {
      if (ans.answer.toLowerCase().includes("small")) smallScaleCount++;
      else if (ans.answer.toLowerCase().includes("medium")) mediumScaleCount++; // Added else if for exclusivity
      else if (ans.answer.toLowerCase().includes("large")) largeScaleCount++;
    });

    let dominantScale: 'Small' | 'Medium' | 'Large' = 'Medium'; // Default
    // Simpler majority rules, if tie then medium or based on priority.
    if (largeScaleCount > smallScaleCount && largeScaleCount > mediumScaleCount) dominantScale = 'Large';
    else if (smallScaleCount > largeScaleCount && smallScaleCount > mediumScaleCount) dominantScale = 'Small';
    else if (mediumScaleCount >= largeScaleCount && mediumScaleCount >= smallScaleCount) dominantScale = 'Medium';
    // Add tie-breaking if needed, e.g. if medium and large are equal, prefer large? For now, medium as default for ties.


    console.log(`Calculated dominantScale: ${dominantScale} (Counts: S-${smallScaleCount}, M-${mediumScaleCount}, L-${largeScaleCount})`);
    
    recommendations += "\n### Scale Assessment:\n";
    questionnaireData.scaleAnswers.forEach(ans => {
      recommendations += `- ${ans.category}: ${ans.answer}\n`;
    });

    const scaleAdviceKey = dominantScale.toLowerCase() as keyof typeof dominantScaleAdvice;
    const scaleAdvice = dominantScaleAdvice[scaleAdviceKey];

    if (scaleAdvice) {
      recommendations += `\n**Your Dominant Scale: ${scaleAdvice.title}**\n`;
      recommendations += `${scaleAdvice.description}\n`;
      if(scaleAdvice.note) recommendations += `*Note: ${scaleAdvice.note}*\n`;
      if (scaleAdvice.elements) {
        for (const [category, details] of Object.entries(scaleAdvice.elements as Record<string, any>)) {
            recommendations += `\n*${category.charAt(0).toUpperCase() + category.slice(1)}:*\n`;
            if (typeof details === 'object' && details !== null && !Array.isArray(details)) {
                for (const [subKey, subValue] of Object.entries(details as Record<string, string | string[]>)) {
                    recommendations += `  - **${subKey.charAt(0).toUpperCase() + subKey.slice(1)}:** `;
                    if (Array.isArray(subValue)) {
                        recommendations += subValue.join('; ') + '\n';
                    } else {
                        recommendations += `${subValue}\n`;
                    }
                }
            } else if (Array.isArray(details)) {
                details.forEach((item: string) => recommendations += `  - ${item}\n`);
            }
        }
      }
    } else {
      recommendations += `\n**Dominant Scale: ${dominantScale}**\nNo specific advice found for this dominant scale type in the dataset.\n`;
      console.warn(`No specific advice found for dominantScale: ${dominantScale} (key: ${scaleAdviceKey})`);
    }
    recommendations += "\n---\n";

    // --- Body Shape ---
    recommendations += `\n### Body Shape: ${questionnaireData.bodyShape}\n`;
    
    const internalShapeKey = getBodyShapeKey(questionnaireData.bodyShape);
    let shapeAdviceData;

    if (internalShapeKey) {
        shapeAdviceData = bodyShapeAdvice[internalShapeKey];
    }
    console.log(`Looking for body shape advice for: ${questionnaireData.bodyShape} (mapped to key: ${internalShapeKey}). Found: ${!!shapeAdviceData}`);

    if (shapeAdviceData) {
      recommendations += `${shapeAdviceData.description}\n`;
      if (shapeAdviceData.examples) recommendations += `*Examples: ${shapeAdviceData.examples}*\n`;
      if (shapeAdviceData.notes) recommendations += `*Notes: ${shapeAdviceData.notes}*\n\n`;
      
      recommendations += `**Styling Strategy:** ${shapeAdviceData.styling.balanceStrategy}\n\n`;
      
      recommendations += "**Fabrics & Patterns:**\n";
      recommendations += `- Recommended Fabrics: ${shapeAdviceData.styling.fabrics.recommended}\n`;
      if(shapeAdviceData.styling.fabrics.avoidIfLarger) recommendations += `- Avoid if Larger: ${shapeAdviceData.styling.fabrics.avoidIfLarger}\n`; // Check if exists
      recommendations += `- Patterns: ${shapeAdviceData.styling.fabrics.patterns}\n`;
      recommendations += `- Colors: ${shapeAdviceData.styling.fabrics.colors}\n\n`;
      
      recommendations += "**Clothing Specifics:**\n";
      if(shapeAdviceData.styling.clothing.general) recommendations += `- General: ${shapeAdviceData.styling.clothing.general}\n`;
      recommendations += `- Tops: ${shapeAdviceData.styling.clothing.tops}\n`;
      if(shapeAdviceData.styling.clothing.necklines) recommendations += `- Necklines: ${shapeAdviceData.styling.clothing.necklines}\n`;
      recommendations += `- Bottoms: ${shapeAdviceData.styling.clothing.bottoms}\n`;
      recommendations += `- Dresses: ${shapeAdviceData.styling.clothing.dresses}\n`;
      if(shapeAdviceData.styling.clothing.styling) recommendations += `- General Styling: ${shapeAdviceData.styling.clothing.styling}\n`;
      if(shapeAdviceData.styling.clothing.bras) recommendations += `- Bras: ${shapeAdviceData.styling.clothing.bras}\n`;


      if (shapeAdviceData.styling.avoid && shapeAdviceData.styling.avoid.length > 0) {
        recommendations += "\n**Avoid:**\n";
        shapeAdviceData.styling.avoid.forEach((item: string) => {
          recommendations += `- ${item}\n`;
        });
      }
      if (shapeAdviceData.styling.gobletSpecific) {
          recommendations += `\n**Goblet Shape Specifics:** ${shapeAdviceData.styling.gobletSpecific}\n`;
      }
      if (shapeAdviceData.styling.weightGain?.softened) {
          recommendations += `\n**Weight Gain - Softened Straight:** ${shapeAdviceData.styling.weightGain.softened}\n`;
      }
      if (shapeAdviceData.styling.weightGain?.barrel && shapeAdviceData.styling.barrelSpecific) {
          recommendations += `\n**Weight Gain - Barrel/Rectangle:** ${shapeAdviceData.styling.weightGain.barrel}\n`;
          shapeAdviceData.styling.barrelSpecific.forEach((item: string) => recommendations += `  - ${item}\n`);
      }
    } else {
      recommendations += `No specific styling advice found for "${questionnaireData.bodyShape}" in the dataset.\n`;
      console.warn(`No specific advice found for bodyShape: ${questionnaireData.bodyShape} (key: ${internalShapeKey})`);
    }

    recommendations += "\nRemember, these are guidelines. The best style is one that makes you feel confident and comfortable!\n";
  
  } catch (error: any) {
    console.error("--- CRITICAL ERROR in generateLogicBasedReport ---");
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    console.error("Error stack:", error.stack);
    if(questionnaireData) console.error("Questionnaire data at time of error:", JSON.stringify(questionnaireData));
    recommendations += "\n\n**Note:** An error occurred while generating a portion of your report. Some information may be missing.\n";
    // Optionally, re-throw or return a more specific error indicator if needed
  }

  return recommendations;
}


export async function processPaymentAndGenerateReport(
  questionnaireData: QuestionnaireData | null,
  email: string | null
): Promise<{ success: boolean; message: string; reportData?: UserReportData }> {
  console.log("--- processPaymentAndGenerateReport action entered on server (logic-based report) ---");
  console.log(`Initial Firebase Initialized: ${firebaseInitialized}, Firebase Init Error: ${firebaseInitError || 'None'}`);

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
  
  console.log("Received Questionnaire Data for logic-based report:", JSON.stringify(questionnaireData, null, 2));
  console.log("Received Email for logic-based report:", email);

  try {
    console.log(`Proceeding to generate logic-based report for email: ${email}`);
    
    const reportContent = generateLogicBasedReport(questionnaireData);
    console.log(`Logic-based report generated successfully for email: ${email}. Report length: ${reportContent.length}`);
    
    const reportData: UserReportData = {
      recommendations: reportContent,
      questionnaireData: questionnaireData,
      recipientEmail: email,
      generatedAtClient: new Date().toISOString(), // Use current server time as "generatedAt"
    };

    console.log(`Report content generated for email: ${email}. Attempting to send (simulated) email.`);
    const emailResult = await sendReportByEmail(email, reportData.recommendations, reportData.questionnaireData);
    if (!emailResult.success) {
      console.warn(`Failed to send email (simulated) to ${email}: ${emailResult.message}`);
      // For logic-based report, still consider it a success if report is generated
    }
    
    console.log(`Report generated and (simulated) email process completed for: ${email}. Returning success.`);
    return { success: true, message: "Report generated successfully! It will also be (simulated) sent to your email.", reportData };

  } catch (error: any) {
    console.error("--- processPaymentAndGenerateReport UNEXPECTED CRITICAL ERROR (logic-based report) ---");
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
      message: "An unexpected server error occurred while generating your report. Please try again later."
    };
  }
}

    

    