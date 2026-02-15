
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Transaction, AiAdvice } from "../types";
import { loadAppSettings } from "./storageService";

const MAIN_MODEL = 'gemini-3-flash-preview';

export const analyzeStatement = async (base64Pdf: string): Promise<Transaction[]> => {
  // Instance'ı fonksiyon içinde oluşturuyoruz (API Key taze kalsın)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analiz Et: Kredi Kartı Ekstresi. 
    KURAL: Sadece harcamaları (gider) çıkar. 
    İPTAL ET: Ödeme, EFT, Havale, Artı Bakiye, İade, Nakit Avans Ödemesi. Bunları asla listeleme.
    Tarih: YYYY-MM-DD.
    Tip: Daima 'expense'.
    JSON formatında döndür.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MAIN_MODEL,
      contents: {
        parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: prompt }],
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

    const text = response.text?.trim() || '[]';
    let transactions: any[] = [];
    
    try {
      transactions = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON Parse Hatası:", text);
      return [];
    }
    
    return transactions.map((t, index) => ({
      ...t,
      amount: Math.abs(Number(t.amount)) || 0,
      type: 'expense',
      id: `tx-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      source: 'ai'
    }));
  } catch (error: any) {
    console.error("AI Analiz Servis Hatası:", error);
    throw error;
  }
};

export const analyzeSalarySlip = async (base64Pdf: string): Promise<Transaction> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analiz Et: Maaş Bordrosu. Net maaşı ve tarihi (YYYY-MM-DD) bul. JSON döndür.`;

  try {
    const response = await ai.models.generateContent({
      model: MAIN_MODEL,
      contents: {
        parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
          },
          required: ["date", "description", "amount"],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    return {
      id: `salary-${Date.now()}`,
      date: data.date || new Date().toISOString().split('T')[0],
      description: data.description || "Maaş Ödemesi",
      amount: Math.abs(Number(data.amount)) || 0,
      category: "Maaş",
      type: "income",
      source: "salary_slip"
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get financial advice based on transactions summary.
 * Uses responseSchema for structured JSON output as recommended by Google GenAI guidelines.
 */
export const getFinancialAdvice = async (transactions: Transaction[]): Promise<AiAdvice> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const summary = transactions.reduce((acc, t) => {
    if (t.type === 'expense') acc.totalExpense += t.amount;
    else acc.totalIncome += t.amount;
    return acc;
  }, { totalExpense: 0, totalIncome: 0 });

  const prompt = `Bütçe Analizi: Gelir ₺${summary.totalIncome}, Gider ₺${summary.totalExpense}. Bir tavsiye ver ve durumu (saving, warning, critical, neutral) belirle. JSON döndür.`;

  try {
    const response = await ai.models.generateContent({
      model: MAIN_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
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
            status: { 
              type: Type.STRING,
              description: "One of: saving, warning, critical, neutral"
            },
          },
          required: ["verdict", "tips", "status"],
        }
      }
    });
    return JSON.parse(response.text || '{}') as AiAdvice;
  } catch (error) {
    return { verdict: "Şu an bütçeni yorumlayamıyorum.", tips: ["Bağlantını kontrol et."], status: "neutral" };
  }
};
