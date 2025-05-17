
"use server";

console.log("questionnaireActions.ts module loaded on server."); // MODULE-LEVEL LOG

import { auth, db } from "@/config/firebase"; // db and auth can be null if init fails
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { generateStyleRecommendations, type StyleRecommendationsInput } from "@/ai/flows/generate-style-recommendations";
import type { QuestionnaireData, UserReport } from "@/types";
import { revalidatePath } from "next/cache";

export async function saveQuestionnaireData(
  userId: string,
  data: QuestionnaireData
): Promise<{ success: boolean; message: string }> {
  console.log("--- saveQuestionnaireData action entered on server. ---");
  console.log("Current db status:", db ? "db object exists" : "db is null/undefined");
  console.log("Current auth status:", auth ? "auth object exists" : "auth is null/undefined");

  if (!db) {
    console.error("saveQuestionnaireData ERRORED: Firebase 'db' is not initialized. This usually means environment variables (like NEXT_PUBLIC_FIREBASE_PROJECT_ID) are missing or incorrect in the deployment's server environment.");
    return { success: false, message: "Firebase database service is not configured correctly on the server. Please check server logs and environment variables." };
  }
  if (!auth) { 
    console.error("saveQuestionnaireData ERRORED: Firebase 'auth' is not initialized. This usually means environment variables (like NEXT_PUBLIC_FIREBASE_API_KEY) are missing or incorrect in the deployment's server environment.");
    return { success: false, message: "Firebase authentication service is not configured correctly on the server. Please check server logs and environment variables." };
  }


  if (!userId) {
    console.error("saveQuestionnaireData ERRORED: No userId provided.");
    return { success: false, message: "User not authenticated." };
  }

  try {
    const questionnaireRef = doc(db, "users", userId, "questionnaire", "data");
    const questionnaireWithTimestamp = {
      ...data, // This is now the new QuestionnaireData structure
      userId, 
      createdAt: serverTimestamp(),
    };
    await setDoc(questionnaireRef, questionnaireWithTimestamp);
    console.log(`Questionnaire data saved for userId: ${userId}`);

    const userMetaRef = doc(db, "users", userId, "meta", "data");
    await setDoc(userMetaRef, { questionnaireComplete: true }, { merge: true });
    console.log(`User meta updated for userId: ${userId} - questionnaireComplete: true`);

    revalidatePath("/questionnaire");
    revalidatePath("/payment");
    revalidatePath("/"); 

    return { success: true, message: "Questionnaire data saved successfully!" };

  } catch (error) {
    console.error(`Error saving questionnaire data for userId ${userId}:`, error);
    return { success: false, message: "Failed to save questionnaire data due to a server error." };
  }
}


export async function processPaymentAndGenerateReport(
  userId: string
): Promise<{ success: boolean; message: string; reportId?: string }> {
  console.log("--- processPaymentAndGenerateReport action entered on server. ---");
  console.log("Current db status:", db ? "db object exists" : "db is null/undefined");
  console.log("Current auth status:", auth ? "auth object exists" : "auth is null/undefined");

  if (!db) {
    console.error("processPaymentAndGenerateReport ERRORED: Firebase 'db' is not initialized. This usually means environment variables (like NEXT_PUBLIC_FIREBASE_PROJECT_ID) are missing or incorrect in the deployment's server environment.");
     return { success: false, message: "Firebase database service is not configured correctly on the server. Please check server logs and environment variables." };
  }
  if (!auth) {
    console.error("processPaymentAndGenerateReport ERRORED: Firebase 'auth' is not initialized. This usually means environment variables (like NEXT_PUBLIC_FIREBASE_API_KEY) are missing or incorrect in the deployment's server environment.");
    return { success: false, message: "Firebase authentication service is not configured correctly on the server. Please check server logs and environment variables." };
  }

  if (!userId) {
    console.error("processPaymentAndGenerateReport ERRORED: No userId provided.");
    return { success: false, message: "User not authenticated." };
  }
  try {
    const userMetaRef = doc(db, "users", userId, "meta", "data");
    await setDoc(userMetaRef, { hasPaid: true }, { merge: true });
    console.log(`User meta updated for userId: ${userId} - hasPaid: true`);

    const questionnaireRef = doc(db, "users", userId, "questionnaire", "data");
    const questionnaireSnap = await getDoc(questionnaireRef);
    if (!questionnaireSnap.exists()) {
      console.error(`processPaymentAndGenerateReport ERRORED: Questionnaire data not found for userId: ${userId}.`);
      await setDoc(userMetaRef, { hasPaid: false }, { merge: true });
      return { success: false, message: "Questionnaire data not found. Please complete the questionnaire first." };
    }
    const questionnaireData = questionnaireSnap.data() as QuestionnaireData; // Now has new structure
    console.log(`Questionnaire data fetched for userId: ${userId}`);

    // Prepare input for the updated AI flow
    const aiInput: StyleRecommendationsInput = {
      lineDetails: questionnaireData.lineAnswers,
      scaleDetails: questionnaireData.scaleAnswers,
      bodyShape: questionnaireData.bodyShape,
      preferences: questionnaireData.preferences,
    };
    console.log(`Calling generateStyleRecommendations for userId: ${userId} with detailed input.`);
    const aiOutput = await generateStyleRecommendations(aiInput);
    console.log(`AI recommendations received for userId: ${userId}`);

    const reportId = `report-${Date.now()}`; 
    const reportRef = doc(db, "users", userId, "reports", reportId);
    const userReport: UserReport = {
      userId,
      recommendations: aiOutput.recommendations,
      questionnaireData: questionnaireData, // Save the new detailed structure
      generatedAt: serverTimestamp(),
    };
    await setDoc(reportRef, userReport);
    console.log(`Report ${reportId} saved for userId: ${userId}`);

    await setDoc(userMetaRef, { hasGeneratedReport: true, activeReportId: reportId }, { merge: true });
    console.log(`User meta updated for userId: ${userId} - hasGeneratedReport: true, activeReportId: ${reportId}`);

    revalidatePath("/report");
    revalidatePath("/payment");
    revalidatePath("/");

    return { success: true, message: "Report generated successfully!", reportId };

  } catch (error) {
    console.error(`Error in processPaymentAndGenerateReport for userId ${userId}:`, error);
    if (db) { 
        const userMetaRef = doc(db, "users", userId, "meta", "data");
        await setDoc(userMetaRef, { hasPaid: false, hasGeneratedReport: false, activeReportId: null }, { merge: true });
        console.log(`Payment status rolled back for userId: ${userId} due to error.`);
    } else {
        console.error("Cannot rollback payment status because Firebase 'db' is not initialized during error handling.");
    }
    return { success: false, message: "Failed to generate report after payment due to a server error." };
  }
}
