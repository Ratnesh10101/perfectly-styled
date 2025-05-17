// src/ai/flows/generate-style-recommendations.ts
'use server';
/**
 * @fileOverview Generates personalized styling recommendations based on user inputs.
 *
 * - generateStyleRecommendations - A function that generates style recommendations.
 * - StyleRecommendationsInput - The input type for the generateStyleRecommendations function.
 * - StyleRecommendationsOutput - The return type for the generateStyleRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StyleRecommendationsInputSchema = z.object({
  questionnaireResponses: z.string().describe('The user\u2019s responses to the style questionnaire.'),
  dominantLine: z.string().describe('The user\u2019s dominant line (e.g., straight, curved).'),
  bodyShape: z.string().describe('The user\u2019s body shape (e.g., hourglass, pear).'),
  scale: z.string().describe('The user\u2019s scale (e.g., small, medium, large).'),
});
export type StyleRecommendationsInput = z.infer<typeof StyleRecommendationsInputSchema>;

const StyleRecommendationsOutputSchema = z.object({
  recommendations: z.string().describe('Personalized styling recommendations for clothing and accessories.'),
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
  prompt: `You are a personal style consultant. Generate personalized styling recommendations based on the following information:

Questionnaire Responses: {{{questionnaireResponses}}}
Dominant Line: {{{dominantLine}}}
Body Shape: {{{bodyShape}}}
Scale: {{{scale}}}

Focus on clothing and accessories that suit the user's characteristics. Return the answer as a string.`,
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
