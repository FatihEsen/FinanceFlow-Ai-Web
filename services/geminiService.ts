
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
    2. Tarihleri KESİNLİKLE YYYY-MM-DD formatına çevir.
    3. Kategorileri belirle: (Market, Restoran, Teknoloji, Ulaşım, Eğlence, Sağlık, Giyim, Fatura, Diğer).
    4. Type alanı SADECE 'expense' veya 'income' değerlerini alabilir. Kredi kartı ödemeleri ve iadeler 'income', harcamalar 'expense'dir.
    5. Miktarları (amount) sadece pozitif sayılar olarak döndür.
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
              date: { type: Type.STRING, description: "YYYY-MM-DD formatında tarih" },
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              category: { type: Type.STRING },
              type: { type: Type.STRING, description: "Sadece 'expense' veya 'income'" },
            },
            required: ["date", "description", "amount", "category", "type"],
          },
        },
      },
    });

    const text = response.text || '[]';
    const transactions: any[] = JSON.parse(text);
    return transactions.map((t, index) => ({
      ...t,
      amount: Math.abs(Number(t.amount)) || 0,
      type: t.type === 'income' ? 'income' : 'expense',
      id: `tx-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
    }));
  } catch (error) {
    console.error("Gemini Analiz Hatası:", error);
    throw error;
  }
};

export const analyzeSalarySlip = async (base64Pdf: string): Promise<Transaction> => {
  const settings = loadAppSettings();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Bu Maaş Bordrosunu analiz et. Net maaş miktarını ve tarihi çıkar. JSON döndür. Tarih YYYY-MM-DD olmalı.`;

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

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<AiAdvice> => {
  const settings = loadAppSettings();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const summary = transactions.reduce((acc, t) => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'expense') {
      acc.totalExpense += amt;
    } else acc.totalIncome += amt;
    return acc;
  }, { totalExpense: 0, totalIncome: 0 });

  const prompt = `
    ${getPersonalityPrompt(settings.personality)}
    Kullanıcının verileri: Toplam Gider: ₺${summary.totalExpense}, Toplam Gelir: ₺${summary.totalIncome}.
    Harcamaları analiz et ve JSON formatında: verdict (yorum), tips (3 tavsiye), status (saving, warning, critical, neutral) döndür.
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
    return { verdict: "Şu an analiz yapamıyorum başkan, bağlantını kontrol et.", tips: ["Biraz sonra tekrar dene."], status: "neutral" };
  }
};
