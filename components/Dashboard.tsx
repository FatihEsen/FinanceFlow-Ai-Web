
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis
} from 'recharts';
import { Transaction } from '../types';

interface DashboardProps {
  transactions: Transaction[];
}

type TimeRange = '7d' | '30d' | 'month' | 'all';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [range, setRange] = useState<TimeRange>('30d');

  // Eğer 30 günde veri yoksa ama toplamda veri varsa, otomatik "all"a çek
  useEffect(() => {
    if (transactions.length > 0) {
      const now = new Date();
      const hasRecent = transactions.some(tx => {
        const diff = Math.abs(now.getTime() - new Date(tx.date).getTime());
        return diff / (1000 * 60 * 60 * 24) <= 30;
      });
      if (!hasRecent && range === '30d') {
        setRange('all');
      }
    }
  }, [transactions]);

  const stats = useMemo(() => {
    const now = new Date();
    const filterByRange = (tx: Transaction, period: TimeRange) => {
      const txDate = new Date(tx.date);
      if (isNaN(txDate.getTime())) return false; // Hatalı tarihleri ele

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

    // Bar Chart Data: Tarihe göre sıralı olmalı
    const barMap: Record<string, { label: string, amount: number, timestamp: number }> = {};
    currentTxs.forEach(t => {
      const dateObj = new Date(t.date);
      const label = range === 'all' 
        ? dateObj.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' }) 
        : dateObj.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      
      const dayKey = dateObj.toISOString().split('T')[0];
      
      if (!barMap[dayKey]) {
        barMap[dayKey] = { label, amount: 0, timestamp: dateObj.getTime() };
      }
      if (t.type === 'expense') {
        barMap[dayKey].amount += (Number(t.amount) || 0);
      }
    });

    const barData = Object.values(barMap)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-12); // Son 12 veri noktası

    return { 
      totalSpent, 
      totalIncome, 
      pieData, 
      barData
    };
  }, [transactions, range]);

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-darkCard rounded-4xl p-10 border border-dashed border-slate-200 dark:border-slate-800 text-center">
        <i className="fas fa-chart-pie text-4xl text-slate-200 mb-4"></i>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Henüz Veri Yok</p>
        <p className="text-xs text-slate-500 mt-2">Dashboard'u canlandırmak için bir ekstre yükle başkan!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black tracking-tighter">Genel Bakış</h3>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['7d', '30d', 'month', 'all'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${range === r ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {r === 'month' ? 'Bu Ay' : r === 'all' ? 'Tümü' : r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Toplam Gider</p>
            <h4 className="text-3xl font-black tracking-tighter">
              ₺{stats.totalSpent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </h4>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 text-8xl transform -rotate-12">
            <i className="fas fa-wallet"></i>
          </div>
        </div>

        <div className="bg-white dark:bg-darkCard rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Toplam Gelir</p>
            <h4 className="text-3xl font-black tracking-tighter text-emerald-500">
              ₺{stats.totalIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </h4>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 text-8xl transform rotate-12">
            <i className="fas fa-hand-holding-usd"></i>
          </div>
        </div>
      </div>

      {stats.barData.length > 0 && (
        <div className="bg-white dark:bg-darkCard rounded-4xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Harcama Trendi</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.barData}>
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '12px' }}
                  formatter={(val: number) => [`₺${val.toLocaleString('tr-TR')}`, 'Miktar']}
                />
                <Bar dataKey="amount" radius={[6, 6, 6, 6]} barSize={24}>
                  {stats.barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-darkCard rounded-4xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Kategorilere Göre Dağılım</h4>
        <div className="space-y-4">
          {stats.pieData.slice(0, 6).map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  ₺{item.value.toLocaleString('tr-TR')}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  %{((item.value / (stats.totalSpent || 1)) * 100).toFixed(1)}
                </span>
              </div>
            </div>
          ))}
          {stats.pieData.length === 0 && (
            <p className="text-center py-4 text-xs text-slate-400">Bu aralıkta harcama bulunamadı.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
