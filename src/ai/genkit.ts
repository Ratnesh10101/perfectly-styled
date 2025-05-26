
import {genkit, type Genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

let aiInstance: Genkit | null = null;
let genkitServiceInitError: string | null = null;

console.log("genkit.ts module evaluation started (Client or Server).");

// --- IMMEDIATE TOP-LEVEL CHECK FOR SERVER ENVIRONMENT ---
if (typeof window === 'undefined') { // Running on the server
  if (!process.env.GOOGLE_API_KEY) {
    genkitServiceInitError = `CRITICAL SERVER STARTUP ERROR: GOOGLE_API_KEY environment variable is missing or empty in the server's execution environment. Genkit Google AI plugin will NOT initialize. This is a fatal error for AI-related server-side operations. Check deployment configuration.`;
    console.error("**********************************************************************************");
    console.error(genkitServiceInitError);
    console.error("**********************************************************************************");
  }
}
// --- END OF IMMEDIATE TOP-LEVEL CHECK ---


try {
  // Only attempt initialization if no critical server startup error was detected
  if (!genkitServiceInitError) {
    aiInstance = genkit({
      plugins: [googleAI()], // This is where GOOGLE_API_KEY is needed
      // model: 'googleai/gemini-2.0-flash', // Model can be specified per-call
    });
    console.log("Genkit initialized successfully with Google AI plugin.");
  } else {
    console.warn("Genkit initialization skipped due to missing critical server GOOGLE_API_KEY env var.");
  }
} catch (error: any) {
  genkitServiceInitError = `CRITICAL: Genkit failed to initialize during genkit() call. This is likely due to missing GOOGLE_API_KEY environment variable or other Genkit/Google AI plugin configuration issues. Error Message: ${error.message}`;
  console.error(genkitServiceInitError);
  if (error.stack) {
    console.error("Genkit Initialization Error Stack:", error.stack);
  }
  aiInstance = null; // Ensure aiInstance is null if there's any error
}

// Export the potentially null instance. Consumers must check for null.
export const ai = aiInstance;
export { genkitServiceInitError }; // Export error for diagnostics

    
