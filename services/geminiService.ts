
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Transaction, AiAdvice } from "../types";
import { loadAppSettings } from "./storageService";

const MAIN_MODEL = 'gemini-3-flash-preview';

export const analyzeStatement = async (base64Pdf: string): Promise<Transaction[]> => {
  const settings = loadAppSettings();
  // Her çağrıda yeni instance oluşturarak API anahtarı senkronizasyonunu garantiye alıyoruz
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Aşağıdaki PDF kredi kartı ekstresini analiz et. 
    
    KRİTİK FİLTRELEME KURALLARI:
    1. SADECE harcamaları (giderleri) çıkar.
    2. Kredi kartı borç ödemelerini (EFT, Havale, Ödeme), iadeleri ve "+" bakiye hareketlerini KESİNLİKLE YOKSAY. Bunları gelir olarak kaydetme.
    3. Analiz sonucundaki her işlem 'type': 'expense' olmalıdır.
    4. Tarihleri YYYY-MM-DD formatına çevir.
    5. Kategorileri şu listeden seç: (Market, Restoran, Teknoloji, Ulaşım, Eğlence, Sağlık, Giyim, Fatura, Diğer).
    
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

    const text = response.text || '[]';
    const transactions: any[] = JSON.parse(text);
    
    return transactions.map((t, index) => ({
      ...t,
      amount: Math.abs(Number(t.amount)) || 0,
      type: 'expense', // Kredi kartından gelen her şeyi gider olarak işaretle
      id: `tx-${Date.now()}-${index}`,
      source: 'ai'
    }));
  } catch (error) {
    console.error("Analiz Hatası:", error);
    throw error;
  }
};

export const analyzeSalarySlip = async (base64Pdf: string): Promise<Transaction> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Bu Maaş Bordrosunu analiz et. Net maaş miktarını ve bordro tarihini çıkar. JSON döndür. Tarih YYYY-MM-DD olmalı.`;

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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const summary = transactions.reduce((acc, t) => {
    if (t.type === 'expense') acc.totalExpense += t.amount;
    else acc.totalIncome += t.amount;
    return acc;
  }, { totalExpense: 0, totalIncome: 0 });

  const prompt = `
    Kullanıcının Toplam Gideri: ₺${summary.totalExpense}, Toplam Geliri: ₺${summary.totalIncome}.
    Harcamaları yorumla ve JSON döndür: { verdict: "yorum", tips: ["tavsiye1", "tavsiye2"], status: "saving|warning|critical" }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MAIN_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}') as AiAdvice;
  } catch (error) {
    return { verdict: "Şu an bütçeni yorumlayamıyorum.", tips: ["Bağlantını kontrol et."], status: "neutral" };
  }
};
