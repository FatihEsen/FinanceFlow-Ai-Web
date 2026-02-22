
import { Transaction, Theme, AppSettings } from '../types';

const STORAGE_KEY = 'financeflow_transactions';
const THEME_KEY = 'financeflow_theme';
const SETTINGS_KEY = 'financeflow_settings';

export const saveTransactions = (transactions: Transaction[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
};

export const loadTransactions = (): Transaction[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTheme = (theme: Theme) => {
  localStorage.setItem(THEME_KEY, theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const loadTheme = (): Theme => {
  const theme = localStorage.getItem(THEME_KEY) as Theme;
  return theme || 'dark';
};

export const saveAppSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadAppSettings = (): AppSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (data) {
    const parsed = JSON.parse(data);

    // Migration from old single apiKey format
    if (parsed.apiKey !== undefined && !parsed.apiKeys) {
      parsed.apiKeys = {
        google: parsed.provider === 'google' ? parsed.apiKey : '',
        openai: parsed.provider === 'openai' ? parsed.apiKey : '',
        groq: parsed.provider === 'groq' ? parsed.apiKey : '',
        openrouter: parsed.provider === 'openrouter' ? parsed.apiKey : ''
      };
      delete parsed.apiKey;
      saveAppSettings(parsed); // Save the migrated format
    } else if (!parsed.apiKeys) {
      parsed.apiKeys = { google: '', openai: '', groq: '', openrouter: '' };
    } else if (parsed.apiKeys.openrouter === undefined) {
      parsed.apiKeys.openrouter = '';
    }

    return parsed;
  }

  return {
    personality: 'bro',
    customInstructions: '',
    apiKeys: { google: '', openai: '', groq: '', openrouter: '' },
    provider: 'google',
    model: 'gemini-1.5-flash',
    baseUrl: ''
  };
};
