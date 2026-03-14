
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Transaction, AiAdvice } from "../types";
import { loadAppSettings } from "./storageService";

const getLang = () => localStorage.getItem('financeflow_lang') || 'tr';

const callAi = async (prompt: string, settings: any, isJson: boolean = true): Promise<string> => {
  const { provider, model, apiKeys } = settings;
  const apiKey = apiKeys[provider];

  if (provider === 'google') {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model || 'gemini-2.0-flash',
      contents: { parts: [{ text: prompt }] },
      config: isJson ? { responseMimeType: "application/json" } : undefined
    });
    return response.text || '';
  }

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
    const lang = getLang();
    throw new Error(err.error?.message || (lang === 'tr' ? 'AI Hatası oluştu.' : 'AI Error occurred.'));
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export const analyzeStatement = async (base64Pdf: string): Promise<Transaction[]> => {
  const settings = loadAppSettings();
  const lang = getLang();

  if (!settings.apiKeys[settings.provider]) {
    throw new Error(lang === 'tr' 
      ? "Lütfen önce Ayarlar (Settings) kısmından bir API Anahtarı girin başkan." 
      : "Please enter an API Key in Settings first.");
  }

  if (settings.provider !== 'google' && settings.provider !== 'openrouter') {
    throw new Error(lang === 'tr'
      ? "PDF Ekstre analizi şu an sadece Google Gemini ve OpenRouter modelleri ile destekleniyor başkan."
      : "PDF Statement analysis is currently only supported by Google Gemini and OpenRouter models.");
  }

  const prompt = lang === 'tr' ? `
    Analiz Et: Kredi Kartı Ekstresi. 
    KURAL: Sadece harcamaları (gider) çıkar. 
    İPTAL ET: Ödeme, EFT, Havale, Artı Bakiye, İade, Nakit Avans Ödemesi. Bunları asla listeleme.
    Tarih: YYYY-MM-DD.
    Tip: Daima 'expense'.
    Daima saf bir JSON dizisi formatında döndür. JSON bloğu dışında hiçbir kelime yazma.
  ` : `
    Analyze: Credit Card Statement.
    RULE: Extract only expenses.
    IGNORE: Payments, Transfers, Refunds, Cash Advances, Positive Balance. Do not list these.
    Date: YYYY-MM-DD.
    Type: Always 'expense'.
    Always return in pure JSON array format. No words outside the JSON block.
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
      if (!response.ok) throw new Error('OpenRouter Error');
      const data = await response.json();
      text = data.choices[0].message.content;
    } else {
      const ai = new GoogleGenAI({ apiKey: settings.apiKeys.google });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: settings.model || 'gemini-1.5-flash',
        contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: prompt }] },
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
  const lang = getLang();

  if (settings.provider !== 'google' && settings.provider !== 'openrouter') {
    throw new Error(lang === 'tr' ? "Bordro analizi şu an sadece Google Gemini ve OpenRouter destekliyor." : "Payslip analysis currently only supports Google Gemini and OpenRouter.");
  }

  const prompt = lang === 'tr' 
    ? `Analiz Et: Maaş Bordrosu. Net maaşı ve tarihi (YYYY-MM-DD) bul. Daima saf bir JSON objesi formatında döndür. Örn: {"date":"2023-01-01","description":"Maaş","amount":10000}`
    : `Analyze: Payslip. Find net salary and date (YYYY-MM-DD). Always return in pure JSON object format. E.g.: {"date":"2023-01-01","description":"Salary","amount":10000}`;

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
      if (!response.ok) throw new Error('OpenRouter Error');
      const data = await response.json();
      text = data.choices[0].message.content;
    } else {
      const ai = new GoogleGenAI({ apiKey: settings.apiKeys.google });
      const response = await ai.models.generateContent({
        model: settings.model || 'gemini-1.5-flash',
        contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: prompt }] },
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
      description: data.description || (lang === 'tr' ? "Maaş Ödemesi" : "Salary Payment"),
      amount: Math.abs(Number(data.amount)) || 0,
      category: lang === 'tr' ? "Maaş" : "Salary",
      type: "income",
      source: "salary_slip"
    };
  } catch (error) {
    throw error;
  }
};

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<AiAdvice> => {
  const settings = loadAppSettings();
  const lang = getLang();

  if (!settings.apiKeys[settings.provider]) {
    return { 
      verdict: lang === 'tr' ? "API Anahtarı girilmemiş." : "API Key not entered.", 
      tips: [lang === 'tr' ? "Ayarlardan anahtarını gir." : "Enter your key in settings."], 
      status: "neutral" 
    };
  }

  const summary = transactions.reduce((acc, t) => {
    if (t.type === 'expense') acc.totalExpense += t.amount;
    else acc.totalIncome += t.amount;
    return acc;
  }, { totalExpense: 0, totalIncome: 0 });

  const prompt = lang === 'tr' ? `
    Bütçe Analizi: Gelir ₺${summary.totalIncome}, Gider ₺${summary.totalExpense}. 
    Mevcut ay için kısa bir finansal tavsiye ver ve durumu (saving, warning, critical, neutral) belirle. 
    İpucu listesinde en fazla 3 madde olsun.
    Şu formatta JSON döndür: {"verdict": "...", "tips": ["...", "..."], "status": "..."}
  ` : `
    Budget Analysis: Income ₺${summary.totalIncome}, Expense ₺${summary.totalExpense}.
    Give a short financial advice for the current month and determine status (saving, warning, critical, neutral).
    Maximum 3 tips in the list.
    Return JSON: {"verdict": "...", "tips": ["...", "..."], "status": "..."}
  `;

  try {
    const text = await callAi(prompt, settings);
    return JSON.parse(text || '{}') as AiAdvice;
  } catch (error) {
    return { 
      verdict: lang === 'tr' ? "Şu an bütçeni yorumlayamıyorum." : "I cannot analyze your budget right now.", 
      tips: [lang === 'tr' ? "Bağlantını kontrol et." : "Check your connection."], 
      status: "neutral" 
    };
  }
};

