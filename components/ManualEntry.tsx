
import React, { useState } from 'react';
import { Transaction } from '../types';

interface ManualEntryProps {
  onAdd: (transaction: Transaction) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ManualEntry: React.FC<ManualEntryProps> = ({ onAdd, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'expense' | 'income',
    category: 'Other',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = {
    expense: ['Grocery', 'Restaurant', 'Transport', 'Tech', 'Entertainment', 'Health', 'Clothing', 'Rent', 'Utilities', 'Other'],
    income: ['Salary', 'Side Income', 'Refund', 'Transfer', 'Other']
  };

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
    setFormData({ description: '', amount: '', type: 'expense', category: 'Other', date: new Date().toISOString().split('T')[0] });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-darkCard w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold dark:text-white">New Transaction</h3>
            <p className="text-xs text-gray-400 mt-1">Manual data entry</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-darkBg text-gray-400 hover:text-rose-500 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex bg-gray-100 dark:bg-darkBg p-1 rounded-xl">
            <button 
              type="button"
              onClick={() => setFormData({...formData, type: 'expense', category: 'Other'})}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-gray-500'}`}
            >
              Expense
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, type: 'income', category: 'Salary'})}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.type === 'income' ? 'bg-white dark:bg-slate-700 text-green-600 shadow-sm' : 'text-gray-500'}`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Description</label>
            <input
              autoFocus
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-gray-50 dark:bg-darkBg border-none rounded-xl p-3.5 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Grocery, Rent, Freelance..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Amount</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full bg-gray-50 dark:bg-darkBg border-none rounded-xl p-3.5 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-gray-50 dark:bg-darkBg border-none rounded-xl p-3.5 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                {(formData.type === 'expense' ? categories.expense : categories.income).map(c => 
                  <option key={c} value={c}>{c}</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full bg-gray-50 dark:bg-darkBg border-none rounded-xl p-3.5 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all mt-4 active:scale-95"
          >
            Save Transaction
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManualEntry;
