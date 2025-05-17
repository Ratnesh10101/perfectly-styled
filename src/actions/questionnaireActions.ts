
"use server";

import { auth, db } from "@/config/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { generateStyleRecommendations } from "@/ai/flows/generate-style-recommendations";
import type { QuestionnaireData, UserReport } from "@/types";
import { revalidatePath } from "next/cache";

export async function saveQuestionnaireData(
  userId: string,
  data: QuestionnaireData
): Promise<{ success: boolean; message: string }> {
  console.log("saveQuestionnaireData action entered on server.");
  console.log("Initial db status:", db ? "initialized" : "null");
  console.log("Initial auth status:", auth ? "initialized" : "null");

  if (!db) {
    console.error("saveQuestionnaireData: Firebase 'db' is not initialized. This usually means environment variables are missing or incorrect in the deployment's server environment.");
    return { success: false, message: "Firebase is not configured correctly on the server. Please check server logs and environment variables." };
  }
  if (!auth) { // Added auth check for consistency, though not strictly used in this function directly
    console.error("saveQuestionnaireData: Firebase 'auth' is not initialized. This usually means environment variables are missing or incorrect in the deployment's server environment.");
    return { success: false, message: "Firebase is not configured correctly on the server. Please check server logs and environment variables." };
  }


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

    revalidatePath("/questionnaire");
    revalidatePath("/payment");
    revalidatePath("/");

    return { success: true, message: "Questionnaire data saved successfully!" };

  } catch (error) {
    console.error("Error saving questionnaire data:", error);
    return { success: false, message: "Failed to save questionnaire data." };
  }
}


export async function processPaymentAndGenerateReport(
  userId: string
): Promise<{ success: boolean; message: string; reportId?: string }> {
  console.log("processPaymentAndGenerateReport action entered on server.");
  console.log("Initial db status:", db ? "initialized" : "null");
  console.log("Initial auth status:", auth ? "initialized" : "null");

  if (!db || !auth) {
    console.error("processPaymentAndGenerateReport: Firebase 'db' or 'auth' is not initialized. This usually means environment variables are missing or incorrect in the deployment's server environment.");
    return { success: false, message: "Firebase is not configured correctly on the server. Please check server logs and environment variables." };
  }

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
      return { success: false, message: "Questionnaire data not found. Please complete the questionnaire first." };
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
    // Ensure db is checked before trying to use it in rollback
    if (db) {
        const userMetaRef = doc(db, "users", userId, "meta", "data");
        // Rollback payment status if report generation failed
        await setDoc(userMetaRef, { hasPaid: false, hasGeneratedReport: false, activeReportId: null }, { merge: true });
    } else {
        console.error("Cannot rollback payment status because Firebase 'db' is not initialized.");
    }
    return { success: false, message: "Failed to generate report after payment." };
  }
}
