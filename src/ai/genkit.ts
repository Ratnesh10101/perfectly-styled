
import {genkit, type Genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

let aiInstance: Genkit | null = null;

try {
  aiInstance = genkit({
    plugins: [googleAI()], // This is where GOOGLE_API_KEY is needed
    model: 'googleai/gemini-2.0-flash',
  });
  console.log("Genkit initialized successfully with Google AI plugin.");
} catch (error: any) {
  console.error("CRITICAL: Genkit failed to initialize. This is likely due to missing GOOGLE_API_KEY environment variable or other Genkit/Google AI plugin configuration issues.");
  console.error("Genkit Initialization Error Message:", error.message);
  if (error.stack) {
    console.error("Genkit Initialization Error Stack:", error.stack);
  }
  // aiInstance remains null
}

// Export the potentially null instance. Consumers must check for null.
export const ai = aiInstance;
