
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

export interface AppSettings {
  personality: 'bro' | 'accountant' | 'minimalist';
  customInstructions: string;
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
