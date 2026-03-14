
import React, { useState } from 'react';
import { Transaction } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ManualEntryProps {
  onAdd: (transaction: Transaction) => void;
  isOpen: boolean;
  onClose: () => void;
}

const EXPENSE_CATEGORIES = ['Market', 'Restoran', 'Ulaşım', 'Teknoloji', 'Eğlence', 'Sağlık', 'Giyim', 'Kira', 'Faturalar', 'Diğer'];
const INCOME_CATEGORIES = ['Maaş', 'Ek Gelir', 'İade', 'Transfer', 'Diğer'];

const EXPENSE_CATEGORIES_EN = ['Grocery', 'Restaurant', 'Transport', 'Tech', 'Entertainment', 'Health', 'Clothing', 'Rent', 'Utilities', 'Other'];
const INCOME_CATEGORIES_EN = ['Salary', 'Side Income', 'Refund', 'Transfer', 'Other'];

const ManualEntry: React.FC<ManualEntryProps> = ({ onAdd, isOpen, onClose }) => {
  const { t, lang } = useLanguage();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'expense' | 'income',
    category: lang === 'tr' ? 'Diğer' : 'Other',
    date: new Date().toISOString().split('T')[0]
  });

  const expenseCats = lang === 'tr' ? EXPENSE_CATEGORIES : EXPENSE_CATEGORIES_EN;
  const incomeCats = lang === 'tr' ? INCOME_CATEGORIES : INCOME_CATEGORIES_EN;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    const newTx: Transaction = {
      id: `manual-${Date.now()}`,
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date,
      source: 'manual'
    };

    onAdd(newTx);
    setFormData({ description: '', amount: '', type: 'expense', category: lang === 'tr' ? 'Diğer' : 'Other', date: new Date().toISOString().split('T')[0] });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-darkCard w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black dark:text-white">{t('me_title')}</h3>
            <p className="text-xs text-slate-400 mt-1">{t('me_subtitle')}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense', category: lang === 'tr' ? 'Diğer' : 'Other' })}
              className={`flex-1 py-2.5 text-sm font-black rounded-lg transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-400'}`}
            >
              {t('me_expense')}
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income', category: lang === 'tr' ? 'Maaş' : 'Salary' })}
              className={`flex-1 py-2.5 text-sm font-black rounded-lg transition-all ${formData.type === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
            >
              {t('me_income')}
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">{t('me_desc')}</label>
            <input
              autoFocus
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 dark:text-white focus:border-indigo-500 outline-none transition-colors"
              placeholder={t('me_placeholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">{t('me_amount')}</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 dark:text-white focus:border-indigo-500 outline-none font-mono transition-colors"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">{t('me_category')}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 dark:text-white focus:border-indigo-500 outline-none transition-colors"
              >
                {(formData.type === 'expense' ? expenseCats : incomeCats).map(c =>
                  <option key={c} value={c}>{c}</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">{t('me_date')}</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 dark:text-white focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all mt-4 active:scale-95"
          >
            {t('me_save')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManualEntry;
