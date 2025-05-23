
'use server';
/**
 * @fileOverview Generates personalized styling recommendations based on detailed user inputs.
 *
 * - generateStyleRecommendations - A function that generates style recommendations.
 * - StyleRecommendationsInput - The input type for the generateStyleRecommendations function.
 * - StyleRecommendationsOutput - The return type for the generateStyleRecommendations function.
 */

import {ai} from '@/ai/genkit'; // This 'ai' can be null
import {z} from 'genkit';

const LineDetailSchema = z.object({
  bodyPart: z.string().describe("The part of the body being analyzed (e.g., Shoulders, Waist)."),
  answer: z.string().describe("The user's selected answer for that body part (e.g., straight, Defined)."),
  classification: z.enum(['straight', 'curved']).describe("The derived classification of the answer (straight or curved)."),
});

const ScaleDetailSchema = z.object({
  category: z.string().describe("The category of scale measurement (e.g., Wrist Circumference, Height)."),
  answer: z.string().describe("The user's selected answer for that scale category."),
});

export const StyleRecommendationsInputSchema = z.object({
  lineDetails: z.array(LineDetailSchema).describe("Detailed answers for line analysis, providing characteristics for different body parts."),
  scaleDetails: z.array(ScaleDetailSchema).describe("Detailed answers for scale analysis across different measurements."),
  bodyShape: z.string().describe('The user\u2019s overall body shape (e.g., Pear Shape, Hourglass).'),
  // preferences made optional as per previous request
  preferences: z.string().optional().describe('The user\u2019s general style preferences, likes, dislikes, and style goals (optional).'),
});
export type StyleRecommendationsInput = z.infer<typeof StyleRecommendationsInputSchema>;

export const StyleRecommendationsOutputSchema = z.object({
  recommendations: z.string().describe('Personalized styling recommendations for clothing and accessories, formatted as a comprehensive, easy-to-read report. Use markdown for formatting if appropriate, like headings, bullet points, and bold text for emphasis.'),
});
export type StyleRecommendationsOutput = z.infer<typeof StyleRecommendationsOutputSchema>;

// Define prompt and flow conditionally based on whether 'ai' was initialized
let promptInstance: any = null; 
let definedGenerateStyleRecommendationsFlow: (input: StyleRecommendationsInput) => Promise<StyleRecommendationsOutput>;

if (ai) {
  promptInstance = ai.definePrompt({
    name: 'styleRecommendationsPrompt',
    input: {schema: StyleRecommendationsInputSchema},
    output: {schema: StyleRecommendationsOutputSchema},
    prompt: `You are a professional personal style consultant. Your task is to generate detailed and personalized styling recommendations for clothing and accessories.
Use the following information about the user:

1.  **Line Analysis Details:**
    {{#each lineDetails}}
    -   **{{bodyPart}}**: Answer: "{{answer}}", Classified as: {{classification}}
    {{/each}}

2.  **Scale Assessment Details:**
    {{#each scaleDetails}}
    -   **{{category}}**: {{answer}}
    {{/each}}

3.  **Body Shape:** {{bodyShape}}

{{#if preferences}}
4.  **User's Style Preferences & Notes:**
    {{{preferences}}}
{{/if}}

**Instructions for your response:**
-   Synthesize all the provided information to create a cohesive style profile.
-   Provide specific recommendations for types of clothing (e.g., tops, bottoms, dresses, outerwear) and accessories (e.g., jewelry, belts, scarves, bags) that would best suit the user.
-   Explain *why* certain styles are recommended, linking back to their line, scale, body shape, and preferences (if provided). For example, "Given your {{lineDetails.[0].classification}} shoulders and {{bodyShape}} body shape, A-line dresses would be particularly flattering because..."
-   Consider elements like fabric, print, silhouette, and proportion in your recommendations.
-   Offer advice on what to emphasize and what to balance to create a harmonious look.
-   Structure the recommendations in a clear, organized, and easy-to-read manner. Use markdown for headings, bullet points, and bold text to improve readability.
-   The tone should be encouraging, expert, and helpful.
-   Ensure the recommendations are actionable and practical for everyday wear and special occasions, based on the user's preferences if provided.

Return the complete set of recommendations as a single string.
`,
  });

  definedGenerateStyleRecommendationsFlow = ai.defineFlow(
    {
      name: 'generateStyleRecommendationsFlow',
      inputSchema: StyleRecommendationsInputSchema,
      outputSchema: StyleRecommendationsOutputSchema,
    },
    async input => {
      const {output} = await promptInstance(input);
      if (!output) {
        console.error("AI prompt returned null or undefined output for style recommendations. Input was:", JSON.stringify(input));
        throw new Error("AI failed to generate recommendations (empty output).");
      }
      return output;
    }
  );
} else {
  // If ai is null, define a stub for definedGenerateStyleRecommendationsFlow that throws an error
  definedGenerateStyleRecommendationsFlow = async (input: StyleRecommendationsInput): Promise<StyleRecommendationsOutput> => {
    console.error("CRITICAL: Genkit 'ai' object is not initialized. Cannot execute generateStyleRecommendationsFlow. This is likely due to missing GOOGLE_API_KEY or other Genkit configuration issues.");
    throw new Error("AI Service Uninitialized: Genkit failed to initialize. Check server logs (especially for GOOGLE_API_KEY issues).");
  };
}

export async function generateStyleRecommendations(
  input: StyleRecommendationsInput
): Promise<StyleRecommendationsOutput> {
  // This function will now call either the real flow or the stub that throws an error.
  return definedGenerateStyleRecommendationsFlow(input);
}
