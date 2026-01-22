
import { GoogleGenAI } from "@google/genai";
import { CalculationResult } from "../types";

export const getFinancialAdvice = async (result: CalculationResult, type: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const prompt = `
      As a world-class senior financial strategist and personal advisor, analyze this scenario:
      Context: ${type} Calculation
      Loan Principal: ₹${result.principal.toLocaleString()}
      Interest Rate: ${((result.totalInterest / result.principal) * 100 / (result.tenureMonths ? result.tenureMonths / 12 : 1)).toFixed(2)}% (Approx effective rate)
      Duration: ${result.tenureMonths} Months
      Total Interest: ₹${result.totalInterest.toLocaleString()}
      Total Maturity/Payback: ₹${result.totalAmount.toLocaleString()}
      Monthly Installment (EMI): ${result.monthlyPayment ? `₹${result.monthlyPayment.toLocaleString()}` : 'N/A (Lump sum interest model)'}

      Please provide:
      1. A critical evaluation of the cost efficiency (is it high-interest or reasonable?).
      2. 2-3 actionable strategies to optimize this specific plan (e.g., pre-payments, switching types, or tenure adjustments).
      3. A warning about any potential risks specific to this amount and rate.
      
      Tone: Ultra-professional yet encouraging. Be direct and insightful. Max 4 concise sentences.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.9,
      },
    });

    return response.text || "I was unable to analyze this data at the moment. Please check your inputs.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI intelligence engine is currently refreshing. Your mathematical results are ready above!";
  }
};
