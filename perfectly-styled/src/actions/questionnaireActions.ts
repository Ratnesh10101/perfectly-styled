
'use server';
/**
 * @fileOverview Server actions for handling questionnaire data and report generation.
 * This version uses logic-based report generation without AI.
 */

import type { QuestionnaireData, UserReportData } from "@/types";
import { firebaseInitialized, firebaseInitError } from "@/config/firebase"; 
import { bodyShapeAdvice, dominantLineAdvice, dominantScaleAdvice } from '@/data/styleReports';

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
    const mapping: Record<string, string> = {
        "Pear Shape": "pear",
        "Inverted Triangle": "invertedTriangle",
        "Straight": "rectangle", // Questionnaire uses "Straight"
        "Round/Apple": "apple",
        "Hourglass": "hourglass",
    };
    return mapping[formValue];
}


function generateLogicBasedReport(questionnaireData: QuestionnaireData): string {
  console.log("--- generateLogicBasedReport called with questionnaireData:", JSON.stringify(questionnaireData, null, 2));
  
  let recommendations = "## Your Personalised Style Report\n\n";

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
    } else if (straightCount > 0 && curvedCount > 0) { 
        dominantLine = 'Combination';
    }
    
    console.log(`Calculated dominantLine: ${dominantLine}`);

    recommendations += "## Line Analysis Summary\n";
    questionnaireData.lineAnswers.forEach(ans => {
      recommendations += `- ${ans.bodyPart}: ${ans.answer} (Classified as: ${ans.classification})\n`;
    });
    
    const lineAdviceKey = dominantLine.toLowerCase() as keyof typeof dominantLineAdvice;
    const lineAdviceData = dominantLineAdvice[lineAdviceKey];

    if (lineAdviceData) {
      recommendations += `\n### Your Dominant Line: ${lineAdviceData.title}\n`;
      recommendations += `${lineAdviceData.advice}\n`;
      if (lineAdviceData.elements) {
        for (const [key, value] of Object.entries(lineAdviceData.elements)) {
          recommendations += `\n**${key.charAt(0).toUpperCase() + key.slice(1)}:**\n`;
          if (Array.isArray(value)) {
            value.forEach((item: string) => recommendations += `  - ${item}\n`);
          } else {
            recommendations += `  - ${value}\n`;
          }
        }
      }
    } else {
      recommendations += `\n### Dominant Line: ${dominantLine}\nNo specific advice found for this dominant line type in the dataset.\n`;
      console.warn(`No specific advice found for dominantLine: ${dominantLine} (key: ${lineAdviceKey})`);
    }
    recommendations += "\n---\n";

    // --- Scale Assessment ---
    let smallScaleCount = 0;
    let mediumScaleCount = 0;
    let largeScaleCount = 0;
    questionnaireData.scaleAnswers.forEach(ans => {
      if (ans.answer.toLowerCase().includes("small")) smallScaleCount++;
      else if (ans.answer.toLowerCase().includes("medium")) mediumScaleCount++;
      else if (ans.answer.toLowerCase().includes("large")) largeScaleCount++;
    });

    let dominantScale: 'Small' | 'Medium' | 'Large' = 'Medium'; 
    if (largeScaleCount > smallScaleCount && largeScaleCount > mediumScaleCount) dominantScale = 'Large';
    else if (smallScaleCount > largeScaleCount && smallScaleCount > mediumScaleCount) dominantScale = 'Small';
    else if (mediumScaleCount >= largeScaleCount && mediumScaleCount >= smallScaleCount) dominantScale = 'Medium';
    
    console.log(`Calculated dominantScale: ${dominantScale} (Counts: S-${smallScaleCount}, M-${mediumScaleCount}, L-${largeScaleCount})`);
    
    recommendations += "\n## Scale Assessment Summary\n";
    questionnaireData.scaleAnswers.forEach(ans => {
      recommendations += `- ${ans.category}: ${ans.answer}\n`;
    });

    const scaleAdviceKey = dominantScale.toLowerCase() as keyof typeof dominantScaleAdvice;
    const scaleAdviceData = dominantScaleAdvice[scaleAdviceKey];

    if (scaleAdviceData) {
      recommendations += `\n### Your Dominant Scale: ${scaleAdviceData.title}\n`;
      recommendations += `${scaleAdviceData.description}\n`;
      if(scaleAdviceData.note) recommendations += `*Note: ${scaleAdviceData.note}*\n`;
      if (scaleAdviceData.elements) {
        for (const [category, details] of Object.entries(scaleAdviceData.elements as Record<string, any>)) {
            recommendations += `\n**${category.charAt(0).toUpperCase() + category.slice(1)}:**\n`;
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
      recommendations += `\n### Dominant Scale: ${dominantScale}\nNo specific advice found for this dominant scale type in the dataset.\n`;
      console.warn(`No specific advice found for dominantScale: ${dominantScale} (key: ${scaleAdviceKey})`);
    }
    recommendations += "\n---\n";

    // --- Body Shape ---
    recommendations += `\n## Body Shape: ${questionnaireData.bodyShape}\n`;
    
    const internalShapeKey = getBodyShapeKey(questionnaireData.bodyShape);
    let shapeAdviceData;

    if (internalShapeKey) {
        shapeAdviceData = bodyShapeAdvice[internalShapeKey];
    }
    console.log(`Looking for body shape advice for: ${questionnaireData.bodyShape} (mapped to key: ${internalShapeKey}). Found: ${!!shapeAdviceData}`);

    if (shapeAdviceData) {
      if(shapeAdviceData.description) recommendations += `${shapeAdviceData.description}\n`;
      if (shapeAdviceData.examples) recommendations += `*Examples: ${shapeAdviceData.examples}*\n`;
      if (shapeAdviceData.notes) recommendations += `*Notes: ${shapeAdviceData.notes}*\n\n`;
      
      if(shapeAdviceData.styling?.balanceStrategy) {
        recommendations += `### Styling Strategy\n${shapeAdviceData.styling.balanceStrategy}\n\n`;
      }
      
      if(shapeAdviceData.styling?.fabrics) {
        recommendations += "### Fabrics & Patterns\n";
        if(shapeAdviceData.styling.fabrics.recommended) recommendations += `- Recommended Fabrics: ${shapeAdviceData.styling.fabrics.recommended}\n`;
        if(shapeAdviceData.styling.fabrics.avoidIfLarger) recommendations += `- Avoid if Larger: ${shapeAdviceData.styling.fabrics.avoidIfLarger}\n`;
        if(shapeAdviceData.styling.fabrics.patterns) recommendations += `- Patterns: ${shapeAdviceData.styling.fabrics.patterns}\n`;
        if(shapeAdviceData.styling.fabrics.colours) recommendations += `- colours: ${shapeAdviceData.styling.fabrics.colours}\n\n`;
      }
      
      if(shapeAdviceData.styling?.clothing) {
        recommendations += "### Clothing Specifics\n";
        if(shapeAdviceData.styling.clothing.general) recommendations += `- General: ${shapeAdviceData.styling.clothing.general}\n`;
        if(shapeAdviceData.styling.clothing.tops) recommendations += `- Tops: ${shapeAdviceData.styling.clothing.tops}\n`;
        if(shapeAdviceData.styling.clothing.necklines) recommendations += `- Necklines: ${shapeAdviceData.styling.clothing.necklines}\n`;
        if(shapeAdviceData.styling.clothing.bottoms) recommendations += `- Bottoms: ${shapeAdviceData.styling.clothing.bottoms}\n`;
        if(shapeAdviceData.styling.clothing.dresses) recommendations += `- Dresses: ${shapeAdviceData.styling.clothing.dresses}\n`;
        if(shapeAdviceData.styling.clothing.styling) recommendations += `- General Styling: ${shapeAdviceData.styling.clothing.styling}\n`;
        if(shapeAdviceData.styling.clothing.bras) recommendations += `- Bras: ${shapeAdviceData.styling.clothing.bras}\n\n`;
      }

      if (shapeAdviceData.styling?.avoid && shapeAdviceData.styling.avoid.length > 0) {
        recommendations += "### Avoid:\n";
        shapeAdviceData.styling.avoid.forEach((item: string) => {
          recommendations += `- ${item}\n`;
        });
        recommendations += "\n";
      }
      if (shapeAdviceData.styling?.gobletSpecific) {
          recommendations += `**Goblet Shape Specifics:** ${shapeAdviceData.styling.gobletSpecific}\n\n`;
      }
      if (shapeAdviceData.styling?.weightGain?.softened) {
          recommendations += `**Weight Gain - Softened Straight:** ${shapeAdviceData.styling.weightGain.softened}\n\n`;
      }
      if (shapeAdviceData.styling?.weightGain?.barrel && shapeAdviceData.styling.barrelSpecific) {
          recommendations += `**Weight Gain - Barrel/Rectangle:** ${shapeAdviceData.styling.weightGain.barrel}\n`;
          shapeAdviceData.styling.barrelSpecific.forEach((item: string) => recommendations += `  - ${item}\n`);
          recommendations += "\n";
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
