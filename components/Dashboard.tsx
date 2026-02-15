
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Transaction } from '../types';

interface DashboardProps {
  transactions: Transaction[];
}

type TimeRange = '7d' | '30d' | 'month' | 'all';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [range, setRange] = useState<TimeRange>('30d');

  const stats = useMemo(() => {
    const now = new Date();
    const filterByRange = (tx: Transaction, period: TimeRange) => {
      const txDate = new Date(tx.date);
      const diffTime = Math.abs(now.getTime() - txDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (period === '7d') return diffDays <= 7;
      if (period === '30d') return diffDays <= 30;
      if (period === 'month') return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      return true;
    };

    const currentTxs = transactions.filter(tx => filterByRange(tx, range));
    
    const totalSpent = currentTxs.reduce((sum, t) => t.type === 'expense' ? sum + (Number(t.amount) || 0) : sum, 0);
    const totalIncome = currentTxs.reduce((sum, t) => t.type === 'income' ? sum + (Number(t.amount) || 0) : sum, 0);

    const categoryMap: Record<string, number> = {};
    currentTxs.forEach(t => {
      if (t.type === 'expense') {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + (Number(t.amount) || 0);
      }
    });

    const pieData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const barMap: Record<string, { label: string, amount: number }> = {};
    currentTxs.forEach(t => {
      const dateObj = new Date(t.date);
      const label = range === 'all' 
        ? dateObj.toLocaleDateString('en-US', { month: 'short' }) 
        : dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      
      if (!barMap[label]) barMap[label] = { label, amount: 0 };
      if (t.type === 'expense') barMap[label].amount += (Number(t.amount) || 0);
    });

    const barData = Object.values(barMap).slice(-10); // Show last 10 entries

    return { 
      totalSpent, 
      totalIncome, 
      pieData, 
      barData
    };
  }, [transactions, range]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black tracking-tighter">Overview</h3>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['7d', '30d', 'month', 'all'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${range === r ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Total Expenses</p>
            <h4 className="text-3xl font-black tracking-tighter">
              ${stats.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h4>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 text-8xl transform -rotate-12">
            <i className="fas fa-wallet"></i>
          </div>
        </div>

        <div className="bg-white dark:bg-darkCard rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Income</p>
            <h4 className="text-3xl font-black tracking-tighter text-emerald-500">
              ${stats.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h4>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 text-8xl transform rotate-12">
            <i className="fas fa-hand-holding-usd"></i>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-darkCard rounded-4xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Spending Trend</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.barData}>
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
              />
              <Bar dataKey="amount" radius={[6, 6, 6, 6]} barSize={20}>
                {stats.barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-darkCard rounded-4xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Categories</h4>
        <div className="space-y-4">
          {stats.pieData.slice(0, 5).map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
              </div>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                ${item.value.toLocaleString('en-US')}
              </span>
            </div>
          ))}
          {stats.pieData.length === 0 && (
            <p className="text-center py-4 text-xs text-slate-400">No data available for this range.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
