
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Transaction, AiAdvice } from "../types";
import { loadAppSettings } from "./storageService";

const getPersonalityPrompt = (personality: string) => {
  switch (personality) {
    case 'accountant':
      return "Profesyonel bir muhasebecisin. Kesinlik ve finansal disipline odaklan. Resmi bir dil kullan.";
    case 'minimalist':
      return "Minimalist bir finans koçusun. Çok kısa ve öz konuş. Harcamaları kısmaya odaklan.";
    default:
      return "Samimi, gayriresmi bir 'başkan/abi' gibi konuş. Neşeli ve zeki ol.";
  }
};

// Ücretsiz katman için en verimli model
const MAIN_MODEL = 'gemini-3-flash-preview';

export const analyzeStatement = async (base64Pdf: string): Promise<Transaction[]> => {
  const settings = loadAppSettings();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Aşağıdaki PDF kredi kartı ekstresini analiz et. 
    ${settings.customInstructions ? `Özel Talimatlar: ${settings.customInstructions}` : ''}
    1. Tüm alışverişleri, iadeleri ve ödemeleri belirle.
    2. Tarihleri YYYY-MM-DD formatına çevir.
    3. Kategorileri belirle: (Market, Restoran, Teknoloji, Ulaşım, Eğlence, Sağlık, Giyim, Fatura, Diğer).
    Yalnızca JSON array döndür.
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

    const transactions: any[] = JSON.parse(response.text || '[]');
    return transactions.map((t, index) => ({
      ...t,
      id: `tx-${Date.now()}-${index}`,
    }));
  } catch (error) {
    console.error("Gemini Analiz Hatası:", error);
    throw error;
  }
};

export const analyzeSalarySlip = async (base64Pdf: string): Promise<Transaction> => {
  const settings = loadAppSettings();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Bu Maaş Bordrosunu analiz et. Net maaş miktarını ve tarihi çıkar. JSON döndür.`;

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
      date: data.date,
      description: data.description || "Maaş Ödemesi",
      amount: data.amount,
      category: "Maaş",
      type: "income",
      source: "salary_slip"
    };
  } catch (error) {
    throw error;
  }
};

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<AiAdvice> => {
  const settings = loadAppSettings();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const summary = transactions.reduce((acc, t) => {
    if (t.type === 'expense') {
      acc.totalExpense += t.amount;
    } else acc.totalIncome += t.amount;
    return acc;
  }, { totalExpense: 0, totalIncome: 0 });

  const prompt = `
    ${getPersonalityPrompt(settings.personality)}
    Giderler: $${summary.totalExpense}, Gelirler: $${summary.totalIncome}.
    JSON formatında: verdict (yorum), tips (3 tavsiye), status (saving, warning, critical, neutral) döndür.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MAIN_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: { type: Type.STRING },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
            status: { type: Type.STRING },
          },
          required: ["verdict", "tips", "status"],
        }
      }
    });
    return JSON.parse(response.text || '{}') as AiAdvice;
  } catch (error) {
    return { verdict: "Şu an analiz yapamıyorum başkan.", tips: ["Sonra dene."], status: "neutral" };
  }
};
