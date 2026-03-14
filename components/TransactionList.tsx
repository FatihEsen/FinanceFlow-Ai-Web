
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

type FilterType = 'expense' | 'income';

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete }) => {
  const [activeType, setActiveType] = useState<FilterType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filteredByType = useMemo(() => transactions.filter(tx => tx.type === activeType), [transactions, activeType]);

  const categories = useMemo(() => Array.from(new Set(filteredByType.map(tx => tx.category))).sort(), [filteredByType]);

  const filteredTransactions = useMemo(() => {
    let txs = filteredByType;
    if (selectedCategory !== 'all') txs = txs.filter(tx => tx.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      txs = txs.filter(tx => tx.description.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q));
    }
    return txs;
  }, [filteredByType, selectedCategory, searchQuery]);

  const summary = useMemo(() => ({
    total: filteredTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0),
    count: filteredTransactions.length
  }), [filteredTransactions]);

  const handleExportCSV = () => {
    const headers = ['Tarih', 'Açıklama', 'Kategori', 'Tür', 'Tutar (₺)'];
    const rows = filteredTransactions.map(tx => [
      tx.date, `"${tx.description.replace(/"/g, '""')}"`,
      tx.category, tx.type === 'expense' ? 'Gider' : 'Gelir', tx.amount.toFixed(2)
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeflow_${activeType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteClick = (id: string) => {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const switchTab = (type: FilterType) => {
    setActiveType(type);
    setSelectedCategory('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-5">
      {/* Type Switcher */}
      <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full max-w-sm mx-auto shadow-inner">
        <button onClick={() => switchTab('expense')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${activeType === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>
          <i className="fas fa-shopping-bag"></i><span>Harcamalar</span>
        </button>
        <button onClick={() => switchTab('income')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${activeType === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>
          <i className="fas fa-piggy-bank"></i><span>Gelirler</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 text-sm pointer-events-none"></i>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Açıklama veya kategori ara…"
          className="w-full bg-white dark:bg-darkCard border border-slate-100 dark:border-slate-800 rounded-2xl pl-10 pr-10 py-3.5 text-sm dark:text-white placeholder-slate-300 dark:placeholder-slate-600 outline-none focus:border-indigo-400 dark:focus:border-indigo-600 transition-colors shadow-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
            <i className="fas fa-times text-sm"></i>
          </button>
        )}
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-darkCard text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-indigo-300'}`}>
            Tümü
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-darkCard text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-indigo-300'}`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Summary + Export */}
      <div className="bg-white dark:bg-darkCard rounded-3xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seçili Toplam</p>
          <p className={`text-xl font-black ${activeType === 'expense' ? 'text-slate-900 dark:text-white' : 'text-emerald-500'}`}>
            ₺{summary.total.toLocaleString('tr-TR')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İşlem</p>
            <p className="text-xl font-black text-slate-400">{summary.count}</p>
          </div>
          {filteredTransactions.length > 0 && (
            <button onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-500 hover:text-indigo-600 rounded-xl transition-all text-xs font-black uppercase tracking-wider"
              title="CSV olarak indir">
              <i className="fas fa-download"></i>
              <span className="hidden sm:inline">CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-darkCard rounded-4xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-50 dark:divide-slate-800/80">
          {filteredTransactions.map(tx => (
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
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-sm font-black ${activeType === 'expense' ? 'text-slate-900 dark:text-white' : 'text-emerald-500'}`}>
                    ₺{Number(tx.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </p>
                  {tx.source === 'manual' && <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1 rounded font-bold uppercase">Manuel</span>}
                </div>
                <button onClick={() => handleDeleteClick(tx.id)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${confirmDelete === tx.id ? 'bg-rose-500 text-white opacity-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-500'}`}
                  title={confirmDelete === tx.id ? 'Silmek için tekrar tıkla' : 'Sil'}>
                  <i className={`fas ${confirmDelete === tx.id ? 'fa-check' : 'fa-trash'} text-xs`}></i>
                </button>
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="py-20 text-center">
              <i className="fas fa-search text-3xl text-slate-200 mb-3"></i>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Kayıt Bulunamadı'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionList;
