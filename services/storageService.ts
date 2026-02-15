
import { Transaction, Theme } from '../types';

const STORAGE_KEY = 'financeflow_transactions';
const THEME_KEY = 'financeflow_theme';

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
  return theme || 'dark'; // Default changed to dark
};
