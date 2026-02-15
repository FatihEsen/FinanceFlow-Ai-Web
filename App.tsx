
import React, { useState, useEffect, useCallback } from 'react';
import { AppStatus, Transaction, Theme, AiAdvice } from './types';
import { analyzeStatement, getFinancialAdvice } from './services/geminiService';
import { loadTransactions, saveTransactions, loadTheme, saveTheme } from './services/storageService';
import { getDemoTransactions } from './services/demoData';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import ManualEntry from './components/ManualEntry';
import AiAdvisor from './components/AiAdvisor';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [theme, setTheme] = useState<Theme>(loadTheme());
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'add'>('home');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [aiAdvice, setAiAdvice] = useState<AiAdvice | null>(null);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [theme]);

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const generateAdvice = useCallback(async (txs: Transaction[]) => {
    if (txs.length === 0 || !navigator.onLine) return;
    setIsAdviceLoading(true);
    try {
      const advice = await getFinancialAdvice(txs);
      setAiAdvice(advice);
    } catch (err) {
      console.error("Advice generation failed", err);
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

  const handleLoadDemo = () => {
    triggerHaptic(20);
    const demoData = getDemoTransactions();
    setTransactions(demoData);
    setStatus(AppStatus.READY);
    setAiAdvice(null);
  };

  const handleFilesSelect = async (base64Array: string[]) => {
    if (!isOnline) {
      alert("Boss, we need internet for analysis! AI runs in the cloud.");
      return;
    }
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
          } catch (e) {
            console.error("Analysis failed:", e);
            return [];
          }
        })
      );

      const newTransactions = results.flat();
      setTransactions(prev => {
        const combined = [...newTransactions, ...prev];
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });

      triggerHaptic(50);
      setStatus(AppStatus.READY);
      setActiveTab('home');
      setAiAdvice(null);
    } catch (err) {
      setStatus(AppStatus.ERROR);
    }
  };

  const handleAddManualTransaction = (tx: Transaction) => {
    triggerHaptic(20);
    setTransactions(prev => [tx, ...prev].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
    setStatus(AppStatus.READY);
    setActiveTab('home');
    setAiAdvice(null);
  };

  return (
    <div className={`flex flex-col md:flex-row h-screen w-full transition-colors duration-300 ${theme === 'dark' ? 'dark bg-darkBg text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Offline Status Bar - Native App Style */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-slate-800/90 backdrop-blur-md text-white text-[10px] font-black text-center py-2 z-[100] flex items-center justify-center space-x-2 border-b border-white/10">
          <i className="fas fa-plane text-orange-400"></i>
          <span className="tracking-widest uppercase">Offline Mode - Data Secured Locally</span>
        </div>
      )}

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-darkCard border-r border-slate-100 dark:border-slate-800 p-6 z-50">
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
              <i className="fas fa-bolt text-white"></i>
            </div>
            <span className="font-black text-xl tracking-tight">FinanceFlow</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button onClick={() => { triggerHaptic(5); setActiveTab('home'); }} className={`flex flex-row items-center space-x-3 px-4 py-3 rounded-2xl transition-all w-full ${activeTab === 'home' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <i className="fas fa-home text-sm"></i><span className="text-sm font-bold">Dashboard</span>
          </button>
          <button onClick={() => { triggerHaptic(5); setActiveTab('history'); }} className={`flex flex-row items-center space-x-3 px-4 py-3 rounded-2xl transition-all w-full ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <i className="fas fa-list-ul text-sm"></i><span className="text-sm font-bold">History</span>
          </button>
          <button onClick={() => { triggerHaptic(5); setActiveTab('add'); }} className={`flex flex-row items-center space-x-3 px-4 py-3 rounded-2xl transition-all w-full ${activeTab === 'add' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <i className="fas fa-plus-circle text-sm"></i><span className="text-sm font-bold">New Entry</span>
          </button>
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={toggleTheme} className="flex items-center space-x-3 px-4 py-3 rounded-2xl w-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun text-yellow-400'}`}></i>
            <span className="text-sm font-bold">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="md:hidden flex-none bg-white dark:bg-darkCard px-6 pt-12 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 z-50">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center">
              <i className="fas fa-bolt text-white text-xs"></i>
            </div>
            <span className="font-bold text-lg tracking-tight">FinanceFlow</span>
          </div>
          <button onClick={toggleTheme} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-yellow-400">
            <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar pb-32 md:pb-10">
          <div className="max-w-6xl mx-auto px-5 py-6 md:py-10">
            {status === AppStatus.IDLE && activeTab === 'home' && (
              <div className="max-w-2xl mx-auto space-y-10 py-10">
                <div className="text-center">
                  <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter">Manage Wealth<br/><span className="text-indigo-600">With AI</span></h2>
                  <p className="mt-4 text-slate-500 dark:text-slate-400 text-lg">Analyze statements offline, track everything anywhere.</p>
                </div>
                <div className="space-y-4">
                  <FileUpload onFilesSelect={handleFilesSelect} isLoading={false} />
                  <button onClick={handleLoadDemo} className="w-full py-4 text-sm font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-2xl transition-all uppercase tracking-widest">
                    Explore Demo Data
                  </button>
                </div>
              </div>
            )}

            {status === AppStatus.ANALYZING && (
              <div className="flex flex-col items-center justify-center h-[60vh] space-y-8">
                <div className="relative">
                  <div className="h-40 w-40 rounded-full border-[6px] border-indigo-100 dark:border-slate-800 border-t-indigo-600 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-3xl text-indigo-600">
                    %{totalToProcess > 0 ? Math.round((processedCount / totalToProcess) * 100) : 0}
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-black text-3xl mb-2 tracking-tighter">Analyzing Stats</p>
                  <p className="text-slate-400 font-medium">Internet connection used for processing.</p>
                </div>
              </div>
            )}

            {status === AppStatus.READY && activeTab === 'home' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <Dashboard transactions={transactions} />
                </div>
                <div className="space-y-8">
                  <AiAdvisor 
                    advice={aiAdvice} 
                    isLoading={isAdviceLoading} 
                    onRefresh={() => { triggerHaptic(10); generateAdvice(transactions); }} 
                  />
                  <div className="bg-white dark:bg-darkCard rounded-4xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-4">Quick Menu</h4>
                    <div className="space-y-3">
                      <button onClick={() => { triggerHaptic(5); setIsManualModalOpen(true); }} className="w-full py-4 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-2xl text-xs font-black transition-all text-left px-5 flex items-center justify-between group uppercase tracking-wider">
                        Manual Entry <i className="fas fa-plus group-hover:translate-x-1 transition-transform"></i>
                      </button>
                      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30">
                         <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase mb-1">Local Storage</p>
                         <p className="text-xs text-slate-500 dark:text-slate-400">{transactions.length} Records Saved on Device.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {status === AppStatus.READY && activeTab === 'history' && (
              <div className="space-y-8">
                 <h3 className="text-3xl font-black tracking-tighter">All Transactions</h3>
                 <TransactionList transactions={transactions} />
              </div>
            )}

            {activeTab === 'add' && (
              <div className="max-w-2xl mx-auto py-10 space-y-8">
                 <div className="text-center mb-10">
                   <h3 className="text-4xl font-black mb-2 tracking-tighter">Add Data</h3>
                   <p className="text-slate-400 font-medium">Upload PDF statements or enter manually.</p>
                 </div>
                 <div className={!isOnline ? "opacity-50 pointer-events-none" : ""}>
                    <FileUpload onFilesSelect={handleFilesSelect} isLoading={status === AppStatus.ANALYZING} />
                 </div>
                 {!isOnline && (
                   <div className="p-6 bg-orange-50 dark:bg-orange-950/20 rounded-3xl border border-orange-100 dark:border-orange-900/30 text-center">
                     <i className="fas fa-wifi-slash text-orange-500 text-2xl mb-3"></i>
                     <p className="text-sm font-bold text-orange-800 dark:text-orange-300">No Connection</p>
                     <p className="text-xs text-orange-600 dark:text-orange-400/70 mt-1">PDF analysis requires internet, boss. Try manual entry for now.</p>
                   </div>
                 )}
              </div>
            )}
          </div>
        </main>

        <nav className="md:hidden flex-none bg-white/90 dark:bg-darkCard/90 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 z-50 fixed bottom-0 left-0 right-0">
          <div className="flex justify-around items-center h-16 px-6">
            <button onClick={() => { triggerHaptic(5); setActiveTab('home'); }} className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'home' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
              <i className="fas fa-th-large text-xl"></i>
              <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
            </button>
            <div className="relative -top-6">
              <button onClick={() => { triggerHaptic(20); setIsManualModalOpen(true); }} className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center bg-indigo-600 shadow-indigo-400 ring-4 ring-white dark:ring-darkBg active:scale-90 transition-transform">
                <i className="fas fa-plus text-xl text-white"></i>
              </button>
            </div>
            <button onClick={() => { triggerHaptic(5); setActiveTab('history'); }} className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'history' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
              <i className="fas fa-list-ul text-xl"></i>
              <span className="text-[9px] font-black uppercase tracking-widest">History</span>
            </button>
          </div>
        </nav>
      </div>

      <ManualEntry 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)} 
        onAdd={handleAddManualTransaction} 
      />
    </div>
  );
};

export default App;
