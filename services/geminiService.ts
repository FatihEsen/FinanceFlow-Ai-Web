
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Transaction, AiAdvice } from "../types";
import { loadAppSettings } from "./storageService";



interface AiResponse {
  text: string;
}

const callAi = async (prompt: string, settings: any, isJson: boolean = true): Promise<string> => {
  const { provider, model, apiKeys } = settings;
  const apiKey = apiKeys[provider];

  if (provider === 'google') {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model || 'gemini-1.5-flash',
      contents: { parts: [{ text: prompt }] }, // Fixed: Object structure
      config: isJson ? { responseMimeType: "application/json" } : undefined
    });
    console.log("AI Response:", response);
    return response.text || '';
  }

  // OpenAI or Groq (Compatible API)
  const baseUrl = settings.baseUrl || (provider === 'groq'
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions');

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      response_format: isJson ? { type: 'json_object' } : undefined
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'AI Hatası oluştu.');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export const analyzeStatement = async (base64Pdf: string): Promise<Transaction[]> => {
  const settings = loadAppSettings();
  console.log("Using Settings for Analysis:", { provider: settings.provider, model: settings.model, hasKey: !!settings.apiKeys[settings.provider] });

  if (!settings.apiKeys[settings.provider]) {
    throw new Error("Lütfen önce Ayarlar (Settings) kısmından bir API Anahtarı girin başkan.");
  }

  // PDF Analizi Google ve OpenRouter (Claude vb.) ile destekleniyor.
  if (settings.provider !== 'google' && settings.provider !== 'openrouter') {
    throw new Error("PDF Ekstre analizi şu an sadece Google Gemini ve OpenRouter modelleri ile destekleniyor başkan. Diğer servisleri bütçe tavsiyesi için kullanabilirsin.");
  }

  const prompt = `
    Analiz Et: Kredi Kartı Ekstresi. 
    KURAL: Sadece harcamaları (gider) çıkar. 
    İPTAL ET: Ödeme, EFT, Havale, Artı Bakiye, İade, Nakit Avans Ödemesi. Bunları asla listeleme.
    Tarih: YYYY-MM-DD.
    Tip: Daima 'expense'.
    Daima saf bir JSON dizisi formatında döndür. JSON bloğu dışında hiçbir kelime yazma. (Örn: [{"date":"...","description":"...","amount":100,"category":"...","type":"expense"}])
  `;

  try {
    let text = '';

    if (settings.provider === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.apiKeys.openrouter}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: settings.model || 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64Pdf}` } }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'OpenRouter API Hatası');
      }

      const data = await response.json();
      text = data.choices[0].message.content;
    } else {
      const ai = new GoogleGenAI({ apiKey: settings.apiKeys.google });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: settings.model || 'gemini-1.5-flash',
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
      text = response.text?.trim() || '[]';
    }

    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const transactions = JSON.parse(text);
    return transactions.map((t: any, index: number) => ({
      ...t,
      amount: Math.abs(Number(t.amount)) || 0,
      type: 'expense',
      id: `tx-${Date.now()}-${index}`,
      source: 'ai'
    }));
  } catch (error: any) {
    throw error;
  }
};

export const analyzeSalarySlip = async (base64Pdf: string): Promise<Transaction> => {
  const settings = loadAppSettings();
  if (settings.provider !== 'google' && settings.provider !== 'openrouter') {
    throw new Error("Bordro analizi şu an sadece Google Gemini ve OpenRouter destekliyor.");
  }

  const prompt = `Analiz Et: Maaş Bordrosu. Net maaşı ve tarihi (YYYY-MM-DD) bul. Daima saf bir JSON objesi formatında döndür. Başka metin yazma. Örn: {"date":"2023-01-01","description":"Maaş","amount":10000}`;

  try {
    let text = '';

    if (settings.provider === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.apiKeys.openrouter}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: settings.model || 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64Pdf}` } }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'OpenRouter API Hatası');
      }

      const data = await response.json();
      text = data.choices[0].message.content;
    } else {
      const ai = new GoogleGenAI({ apiKey: settings.apiKeys.google });
      const response = await ai.models.generateContent({
        model: settings.model || 'gemini-1.5-flash',
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
      text = response.text || '{}';
    }

    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);
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
  if (!settings.apiKeys[settings.provider]) return { verdict: "API Anahtarı girilmemiş.", tips: ["Ayarlardan anahtarını gir."], status: "neutral" };

  const summary = transactions.reduce((acc, t) => {
    if (t.type === 'expense') acc.totalExpense += t.amount;
    else acc.totalIncome += t.amount;
    return acc;
  }, { totalExpense: 0, totalIncome: 0 });

  const prompt = `Bütçe Analizi: Gelir ₺${summary.totalIncome}, Gider ₺${summary.totalExpense}. 
  Bir tavsiye ver ve durumu (saving, warning, critical, neutral) belirle. 
  Şu formatta JSON döndür: {"verdict": "...", "tips": ["...", "..."], "status": "..."}`;

  try {
    const text = await callAi(prompt, settings);
    return JSON.parse(text || '{}') as AiAdvice;
  } catch (error) {
    return { verdict: "Şu an bütçeni yorumlayamıyorum.", tips: ["Bağlantını kontrol et."], status: "neutral" };
  }
};
