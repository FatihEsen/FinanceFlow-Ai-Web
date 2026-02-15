
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  source: 'ai' | 'manual';
}

export interface AiAdvice {
  verdict: string;
  tips: string[];
  status: 'saving' | 'warning' | 'critical' | 'neutral';
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  ERROR = 'ERROR',
  THINKING = 'THINKING'
}

export type Theme = 'light' | 'dark';
