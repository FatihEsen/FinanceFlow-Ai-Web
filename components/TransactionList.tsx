
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
}

type FilterType = 'expense' | 'income';

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const [activeType, setActiveType] = useState<FilterType>('expense');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => tx.type === activeType);
  }, [transactions, activeType]);

  const summary = useMemo(() => {
    const total = filteredTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
    return { total, count: filteredTransactions.length };
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      {/* Type Switcher */}
      <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full max-w-sm mx-auto shadow-inner">
        <button
          onClick={() => setActiveType('expense')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center space-x-2 ${activeType === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
        >
          <i className="fas fa-shopping-bag"></i>
          <span>Harcamalar</span>
        </button>
        <button
          onClick={() => setActiveType('income')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center space-x-2 ${activeType === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
        >
          <i className="fas fa-piggy-bank"></i>
          <span>Gelirler</span>
        </button>
      </div>

      {/* Summary Info */}
      <div className="bg-white dark:bg-darkCard rounded-3xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seçili Toplam</p>
          <p className={`text-xl font-black ${activeType === 'expense' ? 'text-slate-900 dark:text-white' : 'text-emerald-500'}`}>
            ₺{summary.total.toLocaleString('tr-TR')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İşlem Sayısı</p>
          <p className="text-xl font-black text-slate-400">{summary.count}</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-darkCard rounded-4xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {filteredTransactions.map((tx) => (
            <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${activeType === 'expense' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500'}`}>
                  <i className={`fas ${activeType === 'expense' ? 'fa-shopping-cart' : 'fa-plus'} text-xs`}></i>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">{tx.description}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400 font-bold">{new Date(tx.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                    <span className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter">{tx.category}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black ${activeType === 'expense' ? 'text-slate-900 dark:text-white' : 'text-emerald-500'}`}>
                  ₺{Number(tx.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
                {tx.source === 'manual' && (
                  <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1 rounded font-bold uppercase">Manuel</span>
                )}
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="py-20 text-center">
              <i className="fas fa-folder-open text-3xl text-slate-200 mb-3"></i>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Kayıt Bulunamadı</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionList;
