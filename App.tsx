
import React, { useState, useEffect, useCallback } from 'react';
import { AppStatus, Transaction, Theme, AiAdvice } from './types';
import { analyzeStatement, getFinancialAdvice, analyzeSalarySlip } from './services/geminiService';
import { loadTransactions, saveTransactions, loadTheme, saveTheme } from './services/storageService';
import { getDemoTransactions } from './services/demoData';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import ManualEntry from './components/ManualEntry';
import AiAdvisor from './components/AiAdvisor';
import Settings from './components/Settings';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [theme, setTheme] = useState<Theme>(loadTheme());
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'add' | 'settings'>('home');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [aiAdvice, setAiAdvice] = useState<AiAdvice | null>(null);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const savedTxs = loadTransactions();
    if (savedTxs.length > 0) {
      setTransactions(savedTxs);
      setStatus(AppStatus.READY);
    }
    
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [theme]);

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  const generateAdvice = useCallback(async (txs: Transaction[]) => {
    if (txs.length === 0 || !navigator.onLine) return;
    setIsAdviceLoading(true);
    try {
      const advice = await getFinancialAdvice(txs);
      setAiAdvice(advice);
    } catch (err) {
      console.error("Advice Error:", err);
    } finally {
      setIsAdviceLoading(false);
    }
  }, []);

  useEffect(() => {
    saveTransactions(transactions);
    if (transactions.length > 0 && !aiAdvice && !isAdviceLoading && isOnline) {
      generateAdvice(transactions);
    }
  }, [transactions, aiAdvice, isAdviceLoading, generateAdvice, isOnline]);

  const toggleTheme = () => {
    triggerHaptic(5);
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    saveTheme(newTheme);
  };

  const handleFilesSelect = async (base64Array: string[]) => {
    if (!isOnline) {
      alert("Başkan, analiz için internet lazım!");
      return;
    }
    setLastError(null);
    triggerHaptic([30, 50, 30]);
    setStatus(AppStatus.ANALYZING);
    setProcessedCount(0);
    setTotalToProcess(base64Array.length);

    try {
      const results = await Promise.all(
        base64Array.map(async (base64) => {
          try {
            const result = await analyzeStatement(base64);
            setProcessedCount(prev => prev + 1);
            return result.map(tx => ({ ...tx, source: 'ai' as const }));
          } catch (e: any) {
            console.error("Dosya Analiz Hatası:", e);
            setLastError(e.message || "Analiz sırasında bir hata oluştu.");
            return [];
          }
        })
      );
      
      const newTransactions = results.flat();
      if (newTransactions.length > 0) {
        setTransactions(prev => {
          const combined = [...newTransactions, ...prev];
          // Duplicate check by description, date and amount to avoid repeats from multiple uploads
          const unique = Array.from(new Map(combined.map(item => [`${item.date}-${item.description}-${item.amount}`, item])).values());
          return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
        setStatus(AppStatus.READY);
        setActiveTab('home');
        setAiAdvice(null);
      } else {
        setStatus(AppStatus.ERROR);
      }
    } catch (err: any) {
      console.error("Batch Analysis Error:", err);
      setLastError(err.message || "Toplu işlem hatası.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleSalarySelect = async (base64Array: string[]) => {
    if (!isOnline || base64Array.length === 0) return;
    setLastError(null);
    setStatus(AppStatus.ANALYZING_SALARY);
    try {
      const tx = await analyzeSalarySlip(base64Array[0]);
      setTransactions(prev => [tx, ...prev]);
      setStatus(AppStatus.READY);
      setActiveTab('home');
      setAiAdvice(null);
    } catch (e: any) {
      console.error("Bordro Hatası:", e);
      setLastError(e.message || "Bordro analiz edilemedi.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleAddManualTransaction = (tx: Transaction) => {
    triggerHaptic(20);
    setTransactions(prev => [tx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setStatus(AppStatus.READY);
    setActiveTab('home');
    setAiAdvice(null);
  };

  const clearAllData = () => {
    if (confirm("Tüm veriler silinecek, emin misin başkan?")) {
      setTransactions([]);
      saveTransactions([]);
      setAiAdvice(null);
      setStatus(AppStatus.IDLE);
    }
  };

  return (
    <div className={`flex flex-col md:flex-row h-screen w-full transition-colors duration-300 ${theme === 'dark' ? 'dark bg-darkBg text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-slate-800/90 backdrop-blur-md text-white text-[10px] font-black text-center py-2 z-[100] border-b border-white/10 uppercase tracking-widest">
          Offline Mod - Veriler Cihazında Güvende
        </div>
      )}

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-darkCard border-r border-slate-100 dark:border-slate-800 p-6 z-50">
        <div className="flex items-center space-x-3 mb-10 px-2">
          <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center">
            <i className="fas fa-bolt text-white"></i>
          </div>
          <span className="font-black text-xl tracking-tighter">FinanceFlow</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('home')} className={`flex items-center space-x-3 px-4 py-3 rounded-2xl w-full transition-all ${activeTab === 'home' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <i className="fas fa-home"></i><span className="font-bold">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex items-center space-x-3 px-4 py-3 rounded-2xl w-full transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <i className="fas fa-list-ul"></i><span className="font-bold">Geçmiş</span>
          </button>
          <button onClick={() => setActiveTab('add')} className={`flex items-center space-x-3 px-4 py-3 rounded-2xl w-full transition-all ${activeTab === 'add' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <i className="fas fa-plus-circle"></i><span className="font-bold">Veri Ekle</span>
          </button>
        </nav>

        <div className="space-y-2 pt-10 border-t border-slate-100 dark:border-slate-800 mt-auto">
          <button onClick={toggleTheme} className="flex items-center space-x-3 px-4 py-3 rounded-2xl w-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun text-yellow-400'}`}></i>
            <span className="font-bold">{theme === 'light' ? 'Koyu Mod' : 'Aydınlık Mod'}</span>
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center space-x-3 px-4 py-3 rounded-2xl w-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <i className="fas fa-cog"></i><span className="font-bold">Ayarlar</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="md:hidden flex-none bg-white dark:bg-darkCard px-6 pt-12 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 z-50">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center"><i className="fas fa-bolt text-white text-xs"></i></div>
            <span className="font-bold text-lg tracking-tight">FinanceFlow</span>
          </div>
          <div className="flex space-x-2">
             <button onClick={() => setIsSettingsOpen(true)} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-white">
              <i className="fas fa-cog"></i>
            </button>
            <button onClick={toggleTheme} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-yellow-400">
              <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar pb-32 md:pb-10">
          <div className="max-w-6xl mx-auto px-5 py-6 md:py-10">
            {lastError && (
              <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl flex items-center space-x-3 text-rose-600 animate-in slide-in-from-top-4 duration-300">
                <i className="fas fa-exclamation-circle"></i>
                <p className="text-xs font-bold uppercase tracking-widest">{lastError}</p>
                <button onClick={() => setLastError(null)} className="ml-auto text-rose-400 hover:text-rose-600"><i className="fas fa-times"></i></button>
              </div>
            )}

            {status === AppStatus.IDLE && activeTab === 'home' && (
              <div className="max-w-2xl mx-auto text-center space-y-10 py-10">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter">AI Destekli<br/><span className="text-indigo-600">Bütçe Yönetimi</span></h2>
                <div className="space-y-4">
                  <FileUpload onFilesSelect={handleFilesSelect} isLoading={false} />
                  <button onClick={() => { setTransactions(getDemoTransactions()); setStatus(AppStatus.READY); }} className="w-full py-4 text-sm font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-3xl transition-all">Demo Verileri Yükle</button>
                </div>
              </div>
            )}

            {(status === AppStatus.ANALYZING || status === AppStatus.ANALYZING_SALARY) && (
              <div className="flex flex-col items-center justify-center h-[60vh] space-y-8">
                <div className="h-40 w-40 rounded-full border-[6px] border-indigo-100 dark:border-slate-800 border-t-indigo-600 animate-spin"></div>
                <div className="text-center">
                  <p className="font-black text-3xl mb-2 tracking-tighter">AI Analiz Yapıyor...</p>
                  <p className="text-slate-400 font-medium">{totalToProcess > 1 ? `${processedCount}/${totalToProcess} dosya işleniyor...` : 'Ekstre verileri ayrıştırılıyor...'}</p>
                </div>
              </div>
            )}

            {status === AppStatus.READY && activeTab === 'home' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8"><Dashboard transactions={transactions} /></div>
                <div className="space-y-8">
                  <AiAdvisor advice={aiAdvice} isLoading={isAdviceLoading} onRefresh={() => generateAdvice(transactions)} />
                  <div className="bg-white dark:bg-darkCard rounded-4xl p-6 border border-slate-100 dark:border-slate-800">
                    <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-4">Hızlı İşlemler</h4>
                    <div className="space-y-3">
                      <button onClick={() => setIsManualModalOpen(true)} className="w-full py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-black uppercase text-left px-5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">Manuel İşlem <i className="fas fa-plus"></i></button>
                      <button onClick={() => setActiveTab('add')} className="w-full py-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black uppercase text-left px-5 flex items-center justify-between hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all">Dosya Tara <i className="fas fa-expand"></i></button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
               <div className="space-y-8">
                 <div className="flex items-center justify-between">
                   <h3 className="text-3xl font-black tracking-tighter">İşlem Geçmişi</h3>
                   <button onClick={clearAllData} className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 flex items-center space-x-2">
                     <i className="fas fa-trash-alt"></i>
                     <span>Verileri Temizle</span>
                   </button>
                 </div>
                 <TransactionList transactions={transactions} />
               </div>
            )}

            {activeTab === 'add' && (
              <div className="max-w-2xl mx-auto py-10 space-y-12">
                <div className="text-center">
                  <h3 className="text-4xl font-black tracking-tighter mb-2">Veri Ekle</h3>
                  <p className="text-slate-400 font-medium">Ekstrelerini yükle veya bordronu analiz et.</p>
                </div>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Kredi Kartı Ekstreleri (PDF)</p>
                    <FileUpload onFilesSelect={handleFilesSelect} isLoading={status === AppStatus.ANALYZING} />
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Maaş Bordrosu (PDF)</p>
                    <div className="relative overflow-hidden group">
                      <div className="absolute inset-0 bg-emerald-600 opacity-5 group-hover:opacity-10 transition-opacity rounded-3xl"></div>
                      <FileUpload onFilesSelect={handleSalarySelect} isLoading={status === AppStatus.ANALYZING_SALARY} />
                      <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-600 text-[8px] font-black px-2 py-1 rounded uppercase pointer-events-none">Bordro Modu</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <nav className="md:hidden flex bg-white/90 dark:bg-darkCard/90 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 fixed bottom-0 left-0 right-0 h-16 justify-around items-center px-6 z-50">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'home' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <i className="fas fa-th-large"></i><span className="text-[9px] font-black uppercase">Home</span>
          </button>
          <div className="relative -top-6">
            <button onClick={() => setIsManualModalOpen(true)} className="w-14 h-14 rounded-full bg-indigo-600 shadow-xl shadow-indigo-400 flex items-center justify-center text-white ring-4 ring-white dark:ring-darkBg active:scale-90 transition-transform"><i className="fas fa-plus"></i></button>
          </div>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'history' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <i className="fas fa-list-ul"></i><span className="text-[9px] font-black uppercase">Geçmiş</span>
          </button>
        </nav>
      </div>

      <ManualEntry isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} onAdd={handleAddManualTransaction} />
      {isSettingsOpen && <Settings onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
};

export default App;
