
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
}

type FilterType = 'all' | 'expense' | 'income';

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(tx => tx.type === filter);
  }, [transactions, filter]);

  return (
    <div className="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-darkBg/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-white">Transaction List</h4>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Detailed history of all movements</p>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-darkBg p-1 rounded-xl">
          <button onClick={() => setFilter('all')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'all' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>All</button>
          <button onClick={() => setFilter('expense')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Expenses</button>
          <button onClick={() => setFilter('income')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'income' ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Income</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider bg-white dark:bg-darkCard">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} className="group hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 whitespace-nowrap">
                  {new Date(tx.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-semibold text-gray-800 dark:text-white max-w-xs truncate" title={tx.description}>
                      {tx.description}
                    </div>
                    {tx.source === 'manual' && (
                      <span className="text-[8px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-1 rounded uppercase font-bold">Manual</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${tx.type === 'expense' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border border-rose-100 dark:border-rose-900/30' : 'bg-green-50 dark:bg-green-900/20 text-green-600 border border-green-100 dark:border-green-900/30'}`}>
                    {tx.category}
                  </span>
                </td>
                <td className={`px-6 py-4 text-sm font-bold text-right whitespace-nowrap ${tx.type === 'expense' ? 'text-gray-900 dark:text-white' : 'text-green-600'}`}>
                  {tx.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
