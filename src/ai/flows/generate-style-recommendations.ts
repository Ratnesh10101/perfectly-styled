
'use server';
/**
 * @fileOverview Generates personalized styling recommendations based on detailed user inputs.
 *
 * - generateStyleRecommendations - A function that generates style recommendations.
 * - StyleRecommendationsInput - The input type for the generateStyleRecommendations function.
 * - StyleRecommendationsOutput - The return type for the generateStyleRecommendations function.
 */

import {ai} from '@/ai/genkit';
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

const StyleRecommendationsInputSchema = z.object({
  lineDetails: z.array(LineDetailSchema).describe("Detailed answers for line analysis, providing characteristics for different body parts."),
  scaleDetails: z.array(ScaleDetailSchema).describe("Detailed answers for scale analysis across different measurements."),
  bodyShape: z.string().describe('The user\u2019s overall body shape (e.g., Pear Shape, Hourglass).'),
  preferences: z.string().describe('The user\u2019s general style preferences, likes, dislikes, and style goals.'),
});
export type StyleRecommendationsInput = z.infer<typeof StyleRecommendationsInputSchema>;

const StyleRecommendationsOutputSchema = z.object({
  recommendations: z.string().describe('Personalized styling recommendations for clothing and accessories, formatted as a comprehensive, easy-to-read report. Use markdown for formatting if appropriate, like headings, bullet points, and bold text for emphasis.'),
});
export type StyleRecommendationsOutput = z.infer<typeof StyleRecommendationsOutputSchema>;

export async function generateStyleRecommendations(
  input: StyleRecommendationsInput
): Promise<StyleRecommendationsOutput> {
  return generateStyleRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
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

4.  **User's Style Preferences & Notes:**
    {{{preferences}}}

**Instructions for your response:**
-   Synthesize all the provided information to create a cohesive style profile.
-   Provide specific recommendations for types of clothing (e.g., tops, bottoms, dresses, outerwear) and accessories (e.g., jewelry, belts, scarves, bags) that would best suit the user.
-   Explain *why* certain styles are recommended, linking back to their line, scale, body shape, and preferences. For example, "Given your {{lineDetails.[0].classification}} shoulders and {{bodyShape}} body shape, A-line dresses would be particularly flattering because..."
-   Consider elements like fabric, print, silhouette, and proportion in your recommendations.
-   Offer advice on what to emphasize and what to balance to create a harmonious look.
-   Structure the recommendations in a clear, organized, and easy-to-read manner. Use markdown for headings, bullet points, and bold text to improve readability.
-   The tone should be encouraging, expert, and helpful.
-   Ensure the recommendations are actionable and practical for everyday wear and special occasions, based on the user's preferences if provided.

Return the complete set of recommendations as a single string.
`,
});

const generateStyleRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateStyleRecommendationsFlow',
    inputSchema: StyleRecommendationsInputSchema,
    outputSchema: StyleRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
