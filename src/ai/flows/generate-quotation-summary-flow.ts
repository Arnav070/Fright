
'use server';
/**
 * @fileOverview A Genkit flow to generate a summary for a quotation.
 *
 * - generateQuotationSummary - A function that handles the quotation summary generation.
 * - GenerateQuotationSummaryInput - The input type for the generateQuotationSummary function.
 * - GenerateQuotationSummaryOutput - The return type for the generateQuotationSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuotationSummaryInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  pol: z.string().describe('The Port of Loading.'),
  pod: z.string().describe('The Port of Discharge.'),
  equipment: z.string().describe('The type of equipment used for shipment.'),
  volume: z.string().describe('The volume of the shipment.'),
  type: z.enum(['Import', 'Export', 'Cross-Trade']).describe('The type of quotation (Import, Export, or Cross-Trade).'),
});
export type GenerateQuotationSummaryInput = z.infer<typeof GenerateQuotationSummaryInputSchema>;

const GenerateQuotationSummaryOutputSchema = z.object({
  summary: z.string().describe('A brief, professional summary or note for the quotation.'),
});
export type GenerateQuotationSummaryOutput = z.infer<typeof GenerateQuotationSummaryOutputSchema>;

export async function generateQuotationSummary(input: GenerateQuotationSummaryInput): Promise<GenerateQuotationSummaryOutput> {
  return generateQuotationSummaryFlow(input);
}

const quotationSummaryPrompt = ai.definePrompt({
  name: 'quotationSummaryPrompt',
  input: {schema: GenerateQuotationSummaryInputSchema},
  output: {schema: GenerateQuotationSummaryOutputSchema},
  prompt: `You are a helpful freight logistics assistant. Based on the following quotation details, please generate a concise and professional summary note. This note is for internal records and should be suitable to be placed in a notes field.

Quotation Details:
- Customer: {{{customerName}}}
- Port of Loading (POL): {{{pol}}}
- Port of Discharge (POD): {{{pod}}}
- Equipment: {{{equipment}}}
- Volume: {{{volume}}}
- Type: {{{type}}}

Generate a summary note.`,
});

const generateQuotationSummaryFlow = ai.defineFlow(
  {
    name: 'generateQuotationSummaryFlow',
    inputSchema: GenerateQuotationSummaryInputSchema,
    outputSchema: GenerateQuotationSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await quotationSummaryPrompt(input);
    if (!output) {
      throw new Error("AI failed to generate a summary.");
    }
    return output;
  }
);
