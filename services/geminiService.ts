
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Transaction, AiAdvice } from "../types";

export const analyzeStatement = async (base64Pdf: string): Promise<Transaction[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze the following PDF credit card statement. 
    Please follow these rules:
    1. Identify all purchases, refunds, and payments.
    2. Debits or negative balances are expenses.
    3. Credits or positive entries/refunds are income.
    4. Convert dates to YYYY-MM-DD format.
    5. Select categories from this list: (Grocery, Restaurant, Tech, Transport, Entertainment, Health, Clothing, Utilities, Other).
    
    Return the output strictly as a valid JSON array. Each object must contain:
    - date: string
    - description: string
    - amount: number (as a positive value)
    - category: string
    - type: 'expense' | 'income'

    Return ONLY the JSON, no explanations.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Pdf,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              category: { type: Type.STRING },
              type: { type: Type.STRING },
            },
            required: ["date", "description", "amount", "category", "type"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from model.");
    
    const transactions: any[] = JSON.parse(text);
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return transactions.map((t, index) => ({
      ...t,
      id: `tx-${Date.now()}-${randomSuffix}-${index}`,
    }));
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<AiAdvice> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const summary = transactions.reduce((acc, t) => {
    if (t.type === 'expense') {
      acc.categories[t.category] = (acc.categories[t.category] || 0) + t.amount;
      acc.totalExpense += t.amount;
    } else {
      acc.totalIncome += t.amount;
    }
    return acc;
  }, { categories: {} as Record<string, number>, totalExpense: 0, totalIncome: 0 });

  const prompt = `
    You are a financial advisor but you talk like a friendly, informal bro/buddy (use words like "boss", "chief", "buddy", "my man").
    Here is the user's spending summary:
    - Total Expense: $${summary.totalExpense}
    - Total Income: $${summary.totalIncome}
    - Spending by Category: ${JSON.stringify(summary.categories)}

    Analyze this data and give the user cheerful, slightly witty but truly helpful advice.
    - verdict: A friendly summary sentence (Max 15 words).
    - tips: 3 specific tips (Max 20 words each).
    - status: Choose 'saving' (if good), 'warning' (a bit high), 'critical' (trouble), 'neutral' (normal).

    Return ONLY JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: { type: Type.STRING },
            tips: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            },
            status: { type: Type.STRING },
          },
          required: ["verdict", "tips", "status"],
        }
      }
    });

    return JSON.parse(response.text || '{}') as AiAdvice;
  } catch (error) {
    console.error("AI Advice Error:", error);
    return {
      verdict: "Listen up boss, we had a technical glitch, but keep an eye on those expenses anyway!",
      tips: ["Try again later, chief.", "Keep that wallet closed for a bit.", "Take a breath and check back soon."],
      status: "neutral"
    };
  }
};
