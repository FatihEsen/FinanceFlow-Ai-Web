
import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { Transaction } from '../types';

interface DashboardProps {
  transactions: Transaction[];
}

type TimeRange = '7d' | '30d' | 'month' | 'all';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

const parseFlexibleDate = (dateStr: string) => {
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  const parts = dateStr.split(/[./-]/);
  if (parts.length === 3) {
    d = parts[0].length === 4
      ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      : new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return d;
};

const fmt = (val: number) => `₺${val.toLocaleString('tr-TR')}`;

const TrendBadge: React.FC<{ current: number; prev: number; lowerIsBetter?: boolean }> = ({ current, prev, lowerIsBetter }) => {
  if (!prev || prev === 0 || Math.abs(current - prev) < 1) return null;
  const change = ((current - prev) / Math.abs(prev)) * 100;
  const isUp = change > 0;
  const isGood = lowerIsBetter ? !isUp : isUp;
  return (
    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg bg-white/20 text-white`}>
      {isUp ? '↑' : '↓'} {Math.abs(change).toFixed(0)}%
    </span>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [range, setRange] = useState<TimeRange>('30d');

  useEffect(() => {
    if (transactions.length > 0) {
      const now = new Date();
      const hasRecent = transactions.some(tx => {
        const d = parseFlexibleDate(tx.date);
        return !isNaN(d.getTime()) && (now.getTime() - d.getTime()) / 86400000 <= 30;
      });
      if (!hasRecent && range === '30d') setRange('all');
    }
  }, [transactions]);

  const stats = useMemo(() => {
    const now = new Date();

    const inRange = (d: Date, r: TimeRange, prev: boolean) => {
      if (isNaN(d.getTime())) return false;
      const days = (now.getTime() - d.getTime()) / 86400000;
      if (r === '7d') return prev ? days > 7 && days <= 14 : days >= 0 && days <= 7;
      if (r === '30d') return prev ? days > 30 && days <= 60 : days >= 0 && days <= 30;
      if (r === 'month') {
        const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return prev
          ? d.getMonth() === prevMonth && d.getFullYear() === prevYear
          : d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return !prev;
    };

    const calc = (txs: Transaction[]) => ({
      totalSpent: txs.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0),
      totalIncome: txs.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0),
    });

    const currTxs = transactions.filter(t => inRange(parseFlexibleDate(t.date), range, false));
    const prevTxs = range !== 'all' ? transactions.filter(t => inRange(parseFlexibleDate(t.date), range, true)) : [];

    const curr = calc(currTxs);
    const prev = calc(prevTxs);

    const categoryMap: Record<string, number> = {};
    currTxs.forEach(t => {
      if (t.type === 'expense') categoryMap[t.category] = (categoryMap[t.category] || 0) + (Number(t.amount) || 0);
    });
    const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const barMap: Record<string, { label: string; expense: number; income: number; ts: number }> = {};
    currTxs.forEach(t => {
      const d = parseFlexibleDate(t.date);
      if (isNaN(d.getTime())) return;
      const label = range === 'all'
        ? d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
        : d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      const key = range === 'all' ? `${d.getFullYear()}-${d.getMonth()}` : d.toISOString().split('T')[0];
      if (!barMap[key]) barMap[key] = { label, expense: 0, income: 0, ts: d.getTime() };
      if (t.type === 'expense') barMap[key].expense += Number(t.amount) || 0;
      else barMap[key].income += Number(t.amount) || 0;
    });

    const barData = Object.values(barMap).sort((a, b) => a.ts - b.ts).slice(-15);

    return { ...curr, prev, netBalance: curr.totalIncome - curr.totalSpent, prevNet: prev.totalIncome - prev.totalSpent, pieData, barData };
  }, [transactions, range]);

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-darkCard rounded-4xl p-10 border border-dashed border-slate-200 dark:border-slate-800 text-center">
        <i className="fas fa-chart-pie text-4xl text-slate-200 mb-4"></i>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Veri Bekleniyor</p>
        <p className="text-xs text-slate-500 mt-2">Ekstreni yükledikten sonra dashboard burada dolacak.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + Range */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black tracking-tighter">Finansal Özet</h3>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['7d', '30d', 'month', 'all'] as TimeRange[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${range === r ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {r === 'month' ? 'Bu Ay' : r === 'all' ? 'Tümü' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-rose-500 rounded-3xl p-6 text-white shadow-xl shadow-rose-200 dark:shadow-none relative overflow-hidden hover:scale-[1.02] transition-transform">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Gider</p>
              <TrendBadge current={stats.totalSpent} prev={stats.prev.totalSpent} lowerIsBetter />
            </div>
            <h4 className="text-2xl font-black tracking-tighter">{fmt(stats.totalSpent)}</h4>
            {stats.prev.totalSpent > 0 && <p className="text-[10px] opacity-50 mt-1">Önceki: {fmt(stats.prev.totalSpent)}</p>}
          </div>
          <i className="fas fa-arrow-down absolute -right-2 -bottom-2 opacity-10 text-6xl"></i>
        </div>

        <div className="bg-emerald-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200 dark:shadow-none relative overflow-hidden hover:scale-[1.02] transition-transform">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Gelir</p>
              <TrendBadge current={stats.totalIncome} prev={stats.prev.totalIncome} />
            </div>
            <h4 className="text-2xl font-black tracking-tighter">{fmt(stats.totalIncome)}</h4>
            {stats.prev.totalIncome > 0 && <p className="text-[10px] opacity-50 mt-1">Önceki: {fmt(stats.prev.totalIncome)}</p>}
          </div>
          <i className="fas fa-arrow-up absolute -right-2 -bottom-2 opacity-10 text-6xl"></i>
        </div>

        <div className={`${stats.netBalance >= 0 ? 'bg-indigo-600' : 'bg-slate-900'} rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden hover:scale-[1.02] transition-transform`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Net Durum</p>
              <TrendBadge current={stats.netBalance} prev={stats.prevNet} />
            </div>
            <h4 className="text-2xl font-black tracking-tighter">{fmt(stats.netBalance)}</h4>
            {stats.prevNet !== 0 && <p className="text-[10px] opacity-50 mt-1">Önceki: {fmt(stats.prevNet)}</p>}
          </div>
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/20 ${stats.netBalance >= 0 ? 'bg-white/10' : 'bg-rose-500/20'}`}>
            <i className={`fas ${stats.netBalance >= 0 ? 'fa-check' : 'fa-exclamation'} text-white`}></i>
          </div>
        </div>
      </div>

      {/* Dual Bar Chart */}
      {stats.barData.length > 0 && (
        <div className="bg-white dark:bg-darkCard rounded-4xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Gelir / Gider Grafiği</h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Gider</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Gelir</span>
              </div>
            </div>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.barData} barGap={3} barCategoryGap="35%">
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.15)', fontWeight: 'bold', fontSize: '12px' }}
                  formatter={(val: number, name: string) => [fmt(val), name === 'expense' ? 'Gider' : 'Gelir']}
                />
                <Bar dataKey="expense" fill="#fb7185" radius={[5, 5, 5, 5]} barSize={12} />
                <Bar dataKey="income" fill="#34d399" radius={[5, 5, 5, 5]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Donut + Category Breakdown */}
      {stats.pieData.length > 0 && (
        <div className="bg-white dark:bg-darkCard rounded-4xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Kategori Dağılımı</h4>
          <div className="flex flex-col md:flex-row gap-6 items-center">

            {/* Donut */}
            <div className="relative w-44 h-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.pieData} innerRadius={50} outerRadius={72} dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {stats.pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(val: number) => [fmt(val), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Toplam</p>
                <p className="text-sm font-black text-slate-800 dark:text-white">{fmt(stats.totalSpent)}</p>
              </div>
            </div>

            {/* Category list with progress bars */}
            <div className="flex-1 space-y-3 w-full">
              {stats.pieData.slice(0, 6).map((item, i) => {
                const pct = (item.value / (stats.totalSpent || 1)) * 100;
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">%{pct.toFixed(1)}</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white min-w-[80px] text-right">{fmt(item.value)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
