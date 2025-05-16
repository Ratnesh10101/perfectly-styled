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
  }
}
