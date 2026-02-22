
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  source: 'ai' | 'manual' | 'salary_slip';
}

export interface AiAdvice {
  verdict: string;
  tips: string[];
  status: 'saving' | 'warning' | 'critical' | 'neutral';
}

export type AiProvider = 'google' | 'openai' | 'groq' | 'openrouter';

export interface AppSettings {
  personality: 'bro' | 'accountant' | 'minimalist';
  customInstructions: string;
  apiKeys: {
    google: string;
    openai: string;
    groq: string;
    openrouter: string;
  };
  provider: AiProvider;
  model: string;
  baseUrl: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  ANALYZING_SALARY = 'ANALYZING_SALARY',
  READY = 'READY',
  ERROR = 'ERROR',
  THINKING = 'THINKING'
}

export type Theme = 'light' | 'dark';
