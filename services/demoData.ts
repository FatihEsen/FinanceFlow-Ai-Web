
import { Transaction } from '../types';

export const getDemoTransactions = (): Transaction[] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return [
    {
      id: 'demo-1',
      date: `${year}-${month}-01`,
      description: 'Aylık Maaş Ödemesi',
      amount: 45000,
      category: 'Maaş',
      type: 'income',
      source: 'manual'
    },
    {
      id: 'demo-2',
      date: `${year}-${month}-03`,
      description: 'Migros Sanal Market',
      amount: 1450.50,
      category: 'Market',
      type: 'expense',
      source: 'ai'
    },
    {
      id: 'demo-3',
      date: `${year}-${month}-05`,
      description: 'Shell Akaryakıt',
      amount: 2200,
      category: 'Ulaşım',
      type: 'expense',
      source: 'ai'
    },
    {
      id: 'demo-4',
      date: `${year}-${month}-10`,
      description: 'Netflix Abonelik',
      amount: 189.99,
      category: 'Eğlence',
      type: 'expense',
      source: 'ai'
    },
    {
      id: 'demo-5',
      date: `${year}-${month}-12`,
      description: 'Yemeksepeti - Burger King',
      amount: 450,
      category: 'Restoran',
      type: 'expense',
      source: 'ai'
    },
    {
      id: 'demo-6',
      date: `${year}-${month}-15`,
      description: 'Freelance Proje Ödemesi',
      amount: 8500,
      category: 'Gelir',
      type: 'income',
      source: 'manual'
    },
    {
      id: 'demo-7',
      date: `${year}-${month}-20`,
      description: 'Zara Giyim',
      amount: 3400,
      category: 'Giyim',
      type: 'expense',
      source: 'ai'
    }
  ];
};
