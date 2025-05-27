
"use server";

import { firebaseInitialized, firebaseInitError } from "@/config/firebase";
// AI and Genkit imports are removed as AI functionality is no longer used.
import type { QuestionnaireData, UserReportData, LineAnswer, ScaleAnswer } from "@/types";
import { bodyShapeAdvice, dominantLineAdvice, dominantScaleAdvice } from "@/data/styleReports";

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

    let dominantLine: 'Straight' | 'Curved' | 'Combination' = 'Combination';
    if (straightCount > 0 && curvedCount === 0) {
      dominantLine = 'Straight';
    } else if (curvedCount > 0 && straightCount === 0) {
      dominantLine = 'Curved';
    } else if (straightCount > curvedCount && curvedCount > 0) {
        // If both present, but one is more dominant by a certain threshold (e.g. more than 2/3rds)
        // For simplicity, if one is greater, we'll lean that way, otherwise combination.
        // A more nuanced approach might be needed for true "combination" if counts are close but not equal.
        // Current logic: if straight is more, it's straight. if curved is more, it's curved. If equal or both present and one not decisively more, it's combination.
        // Let's refine this: if one is strictly greater, it's that. If they are equal and non-zero, it's combination. If one is zero, it's the other.
      if (straightCount > curvedCount) dominantLine = 'Straight';
      else if (curvedCount > straightCount) dominantLine = 'Curved';
      else dominantLine = 'Combination'; // Equal and non-zero
    } else if (straightCount === 0 && curvedCount === 0) {
      // No line answers, default to combination or handle as error/incomplete
      dominantLine = 'Combination'; // Or perhaps a neutral default
    }
    // If straightCount and curvedCount are equal and > 0, it's Combination.
    // If one is 0 and the other is >0, it's the one >0.
    // If both are >0 and unequal, it's the greater one.
    // This logic could be refined based on how "Combination" is truly defined by the style guide.
    // A simpler approach:
    if (straightCount > 0 && curvedCount > 0) {
        dominantLine = 'Combination'; // If both types of lines are present, it's a combination.
                                      // Could also be majority rule: if straightCount > curvedCount, dominantLine = 'Straight', etc.
                                      // Let's use: if both present, it's combination. If only one type present, it's that type.
    } else if (straightCount > 0) {
        dominantLine = 'Straight';
    } else if (curvedCount > 0) {
        dominantLine = 'Curved';
    } else {
        dominantLine = 'Combination'; // Default if no line answers or mixed with no clear majority.
    }


    console.log(`Calculated dominantLine: ${dominantLine}`);

    recommendations += "### Line Analysis:\n";
    questionnaireData.lineAnswers.forEach(ans => {
      recommendations += `- ${ans.bodyPart}: ${ans.answer} (Classified as: ${ans.classification})\n`;
    });
    const lineAdvice = dominantLineAdvice[dominantLine.toLowerCase() as keyof typeof dominantLineAdvice];
    if (lineAdvice) {
      recommendations += `\n**Your Dominant Line: ${lineAdvice.title}**\n`;
      recommendations += `${lineAdvice.advice}\n`;
      if (lineAdvice.elements) {
        for (const [key, value] of Object.entries(lineAdvice.elements)) {
          recommendations += `\n*${key.charAt(0).toUpperCase() + key.slice(1)}:*\n`;
          if (Array.isArray(value)) {
            value.forEach(item => recommendations += `  - ${item}\n`);
          } else {
            recommendations += `  - ${value}\n`;
          }
        }
      }
    } else {
      recommendations += `\n**Dominant Line: ${dominantLine}**\nNo specific advice found for this dominant line type in the dataset.\n`;
      console.warn(`No specific advice found for dominantLine: ${dominantLine}`);
    }
    recommendations += "\n---\n";

    // --- Scale Assessment ---
    let smallScaleCount = 0;
    let mediumScaleCount = 0;
    let largeScaleCount = 0;
    questionnaireData.scaleAnswers.forEach(ans => {
      if (ans.answer.toLowerCase().includes("small")) smallScaleCount++;
      if (ans.answer.toLowerCase().includes("medium")) mediumScaleCount++;
      if (ans.answer.toLowerCase().includes("large")) largeScaleCount++;
    });

    let dominantScale: 'Small' | 'Medium' | 'Large' = 'Medium'; // Default
    if (largeScaleCount >= 2 || (largeScaleCount === 1 && mediumScaleCount <=1 && smallScaleCount === 0) ) {
      dominantScale = 'Large';
    } else if (smallScaleCount >= 2 || (smallScaleCount === 1 && mediumScaleCount <=1 && largeScaleCount === 0)) {
      dominantScale = 'Small';
    }
    //This logic favors medium if counts are spread. More specific rules might be better.
    // Simpler approach: majority rules, if tie then medium.
    if (largeScaleCount > smallScaleCount && largeScaleCount > mediumScaleCount) dominantScale = 'Large';
    else if (smallScaleCount > largeScaleCount && smallScaleCount > mediumScaleCount) dominantScale = 'Small';
    else dominantScale = 'Medium';


    console.log(`Calculated dominantScale: ${dominantScale}`);
    
    recommendations += "\n### Scale Assessment:\n";
    questionnaireData.scaleAnswers.forEach(ans => {
      recommendations += `- ${ans.category}: ${ans.answer}\n`;
    });
    const scaleAdvice = dominantScaleAdvice[dominantScale.toLowerCase() as keyof typeof dominantScaleAdvice];
    if (scaleAdvice) {
      recommendations += `\n**Your Dominant Scale: ${scaleAdvice.title}**\n`;
      recommendations += `${scaleAdvice.description}\n`;
      if(scaleAdvice.note) recommendations += `*Note: ${scaleAdvice.note}*\n`;
      if (scaleAdvice.elements) {
        for (const [category, details] of Object.entries(scaleAdvice.elements)) {
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
                details.forEach(item => recommendations += `  - ${item}\n`);
            }
        }
      }
    } else {
      recommendations += `\n**Dominant Scale: ${dominantScale}**\nNo specific advice found for this dominant scale type in the dataset.\n`;
      console.warn(`No specific advice found for dominantScale: ${dominantScale}`);
    }
    recommendations += "\n---\n";

    // --- Body Shape ---
    recommendations += `\n### Body Shape: ${questionnaireData.bodyShape}\n`;
    const shapeKey = questionnaireData.bodyShape;
    // Find the internal key from bodyShapeKeyMap
    let internalShapeKey: string | undefined;
    for (const [displayName, key] of Object.entries(bodyShapeAdvice)) {
        if (bodyShapeAdvice[key as keyof typeof bodyShapeAdvice].title === shapeKey) {
            internalShapeKey = key;
            break;
        }
    }

    // A simpler direct mapping if questionnaireData.bodyShape is already the key we need
    // (e.g. "pear" instead of "Pear Shape")
    // This depends on how bodyShape is stored from the form.
    // Assuming questionnaireData.bodyShape is a key like "pear", "hourglass" etc.
    // If questionnaireData.bodyShape is "Pear Shape", we need to map it.
    // Let's assume a mapping might be needed or the keys in bodyShapeAdvice are direct.
    // The data/styleReports.ts has bodyShapeAdvice keyed by e.g. "pear".
    // The QuestionnaireForm.tsx saves bodyShape as "Pear Shape", "Hourglass" etc.
    // We need to map "Pear Shape" to "pear". Let's assume bodyShapeKeyMap in styleReports.ts handles this.
    // However, styleReports.ts is not exporting bodyShapeKeyMap directly.
    // Let's adjust to find the advice object by its title property for robustness.

    let shapeAdviceData;
    for (const key in bodyShapeAdvice) {
        if (bodyShapeAdvice[key as keyof typeof bodyShapeAdvice].title === questionnaireData.bodyShape) {
            shapeAdviceData = bodyShapeAdvice[key as keyof typeof bodyShapeAdvice];
            break;
        }
    }
    console.log(`Looking for body shape advice for: ${questionnaireData.bodyShape}. Found: ${!!shapeAdviceData}`);

    if (shapeAdviceData) {
      recommendations += `${shapeAdviceData.description}\n`;
      if (shapeAdviceData.examples) recommendations += `*Examples: ${shapeAdviceData.examples}*\n`;
      if (shapeAdviceData.notes) recommendations += `*Notes: ${shapeAdviceData.notes}*\n\n`;
      
      recommendations += `**Styling Strategy:** ${shapeAdviceData.styling.balanceStrategy}\n\n`;
      
      recommendations += "**Fabrics & Patterns:**\n";
      recommendations += `- Recommended Fabrics: ${shapeAdviceData.styling.fabrics.recommended}\n`;
      if(shapeAdviceData.styling.fabrics.avoidIfLarger) recommendations += `- Avoid if Larger: ${shapeAdviceData.styling.fabrics.avoidIfLarger}\n`;
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
        shapeAdviceData.styling.avoid.forEach(item => {
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
          shapeAdviceData.styling.barrelSpecific.forEach(item => recommendations += `  - ${item}\n`);
      }


    } else {
      recommendations += `No specific styling advice found for "${questionnaireData.bodyShape}" in the dataset.\n`;
      console.warn(`No specific advice found for bodyShape: ${questionnaireData.bodyShape}`);
    }

    recommendations += "\nRemember, these are guidelines. The best style is one that makes you feel confident and comfortable!\n";
  
  } catch (error: any) {
    console.error("--- CRITICAL ERROR in generateLogicBasedReport ---");
    console.error("Error message:", error.message);
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
  // Removed Genkit related logs

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
  
  console.log("Received Questionnaire Data:", JSON.stringify(questionnaireData, null, 2));
  console.log("Received Email:", email);

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
      // Decide if this should be a partial failure or not. For now, proceed with success message as report is generated.
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
      // Updated generic message for client
      message: "An unexpected server error occurred while generating your report. Please try again later."
    };
  }
}

    