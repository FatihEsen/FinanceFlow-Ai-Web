
import { Transaction } from '../types';

const getLang = () => localStorage.getItem('financeflow_lang') || 'tr';

export const getDemoTransactions = (): Transaction[] => {
  const lang = getLang();
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const d = (monthOffset: number, day: number) => {
    const date = new Date(y, m + monthOffset, day);
    return date.toISOString().split('T')[0];
  };

  if (lang === 'en') {
    return [
      // This Month - Income
      { id: 'demo-1', date: d(0, 1), description: 'Monthly Salary Payment', amount: 45000, category: 'Salary', type: 'income', source: 'manual' },
      { id: 'demo-2', date: d(0, 15), description: 'Freelance Project Payment', amount: 8500, category: 'Freelance', type: 'income', source: 'manual' },
      // This Month - Expense
      { id: 'demo-3', date: d(0, 2), description: 'Supermarket Grocery', amount: 1450, category: 'Grocery', type: 'expense', source: 'ai' },
      { id: 'demo-4', date: d(0, 5), description: 'Shell Fuel Station', amount: 2200, category: 'Transport', type: 'expense', source: 'ai' },
      { id: 'demo-5', date: d(0, 8), description: 'Local Deli Shop', amount: 680, category: 'Grocery', type: 'expense', source: 'ai' },
      { id: 'demo-6', date: d(0, 10), description: 'Netflix Subscription', amount: 190, category: 'Entertainment', type: 'expense', source: 'ai' },
      { id: 'demo-7', date: d(0, 11), description: 'Spotify Premium', amount: 75, category: 'Entertainment', type: 'expense', source: 'ai' },
      { id: 'demo-8', date: d(0, 12), description: 'Uber Eats - Burger King', amount: 450, category: 'Restaurant', type: 'expense', source: 'ai' },
      { id: 'demo-9', date: d(0, 14), description: 'Amazon - Shoes', amount: 1890, category: 'Clothing', type: 'expense', source: 'ai' },
      { id: 'demo-10', date: d(0, 16), description: 'Grocery Market', amount: 920, category: 'Grocery', type: 'expense', source: 'ai' },
      { id: 'demo-11', date: d(0, 18), description: 'DoorDash Food', amount: 320, category: 'Restaurant', type: 'expense', source: 'ai' },
      { id: 'demo-12', date: d(0, 20), description: 'Zara Clothing', amount: 3400, category: 'Clothing', type: 'expense', source: 'ai' },
      { id: 'demo-13', date: d(0, 22), description: 'Utility - Electricity', amount: 850, category: 'Utilities', type: 'expense', source: 'ai' },
      { id: 'demo-14', date: d(0, 24), description: 'Utility - Internet', amount: 320, category: 'Utilities', type: 'expense', source: 'ai' },
      { id: 'demo-15', date: d(0, 26), description: 'Pharmacy - Medicine', amount: 210, category: 'Health', type: 'expense', source: 'ai' },
      // Last Month - Income
      { id: 'demo-16', date: d(-1, 1), description: 'Monthly Salary Payment', amount: 43000, category: 'Salary', type: 'income', source: 'manual' },
      { id: 'demo-17', date: d(-1, 20), description: 'Freelance Payment', amount: 5500, category: 'Freelance', type: 'income', source: 'manual' },
      // Last Month - Expense
      { id: 'demo-18', date: d(-1, 3), description: 'Walmart Market', amount: 1650, category: 'Grocery', type: 'expense', source: 'ai' },
      { id: 'demo-19', date: d(-1, 6), description: 'Gas Station', amount: 1900, category: 'Transport', type: 'expense', source: 'ai' },
      { id: 'demo-20', date: d(-1, 10), description: 'Netflix & Disney+', amount: 290, category: 'Entertainment', type: 'expense', source: 'ai' },
      { id: 'demo-21', date: d(-1, 13), description: 'Food Order', amount: 380, category: 'Restaurant', type: 'expense', source: 'ai' },
      { id: 'demo-22', date: d(-1, 17), description: 'H&M Clothing', amount: 2100, category: 'Clothing', type: 'expense', source: 'ai' },
      { id: 'demo-23', date: d(-1, 21), description: 'Electricity Bill', amount: 720, category: 'Utilities', type: 'expense', source: 'ai' },
      { id: 'demo-24', date: d(-1, 25), description: 'Pharmacy', amount: 150, category: 'Health', type: 'expense', source: 'ai' },
    ];
  }

  return [
    // Bu ay - Gelir
    { id: 'demo-1', date: d(0, 1), description: 'Aylık Maaş Ödemesi', amount: 45000, category: 'Maaş', type: 'income', source: 'manual' },
    { id: 'demo-2', date: d(0, 15), description: 'Freelance Proje Ödemesi', amount: 8500, category: 'Freelance', type: 'income', source: 'manual' },
    // Bu ay - Gider
    { id: 'demo-3', date: d(0, 2), description: 'Migros Sanal Market', amount: 1450, category: 'Market', type: 'expense', source: 'ai' },
    { id: 'demo-4', date: d(0, 5), description: 'Shell Akaryakıt', amount: 2200, category: 'Ulaşım', type: 'expense', source: 'ai' },
    { id: 'demo-5', date: d(0, 8), description: 'Sanal Kasa Şarküteri', amount: 680, category: 'Market', type: 'expense', source: 'ai' },
    { id: 'demo-6', date: d(0, 10), description: 'Netflix Abonelik', amount: 190, category: 'Eğlence', type: 'expense', source: 'ai' },
    { id: 'demo-7', date: d(0, 11), description: 'Spotify Premium', amount: 75, category: 'Eğlence', type: 'expense', source: 'ai' },
    { id: 'demo-8', date: d(0, 12), description: 'Yemeksepeti - Burger King', amount: 450, category: 'Restoran', type: 'expense', source: 'ai' },
    { id: 'demo-9', date: d(0, 14), description: 'Trendyol - Ayakkabı', amount: 1890, category: 'Giyim', type: 'expense', source: 'ai' },
    { id: 'demo-10', date: d(0, 16), description: 'A101 Market', amount: 920, category: 'Market', type: 'expense', source: 'ai' },
    { id: 'demo-11', date: d(0, 18), description: 'Getir Yemek', amount: 320, category: 'Restoran', type: 'expense', source: 'ai' },
    { id: 'demo-12', date: d(0, 20), description: 'Zara Giyim', amount: 3400, category: 'Giyim', type: 'expense', source: 'ai' },
    { id: 'demo-13', date: d(0, 22), description: 'Fatura - Elektrik', amount: 850, category: 'Faturalar', type: 'expense', source: 'ai' },
    { id: 'demo-14', date: d(0, 24), description: 'Fatura - İnternet', amount: 320, category: 'Faturalar', type: 'expense', source: 'ai' },
    { id: 'demo-15', date: d(0, 26), description: 'Eczane - İlaç', amount: 210, category: 'Sağlık', type: 'expense', source: 'ai' },
    // Geçen ay - Gelir
    { id: 'demo-16', date: d(-1, 1), description: 'Aylık Maaş Ödemesi', amount: 43000, category: 'Maaş', type: 'income', source: 'manual' },
    { id: 'demo-17', date: d(-1, 20), description: 'Freelance Ödeme', amount: 5500, category: 'Freelance', type: 'income', source: 'manual' },
    // Geçen ay - Gider
    { id: 'demo-18', date: d(-1, 3), description: 'Migros Market', amount: 1650, category: 'Market', type: 'expense', source: 'ai' },
    { id: 'demo-19', date: d(-1, 6), description: 'Benzin İstasyonu', amount: 1900, category: 'Ulaşım', type: 'expense', source: 'ai' },
    { id: 'demo-20', date: d(-1, 10), description: 'Netflix & Disney+', amount: 290, category: 'Eğlence', type: 'expense', source: 'ai' },
    { id: 'demo-21', date: d(-1, 13), description: 'Yemek Siparişi', amount: 380, category: 'Restoran', type: 'expense', source: 'ai' },
    { id: 'demo-22', date: d(-1, 17), description: 'H&M Giyim', amount: 2100, category: 'Giyim', type: 'expense', source: 'ai' },
    { id: 'demo-23', date: d(-1, 21), description: 'Elektrik Faturası', amount: 720, category: 'Faturalar', type: 'expense', source: 'ai' },
    { id: 'demo-24', date: d(-1, 25), description: 'Eczane', amount: 150, category: 'Sağlık', type: 'expense', source: 'ai' },
  ];
};

