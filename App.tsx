
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
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'add'>('add');
  const [status, setStatus] = useState<AppStatus>(AppStatus.READY);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [theme, setTheme] = useState<Theme>(loadTheme());
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<AiAdvice | null>(null);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const isAnalyzing = (status as AppStatus) === AppStatus.ANALYZING || (status as AppStatus) === AppStatus.ANALYZING_SALARY;

  useEffect(() => {
    const savedTxs = loadTransactions();
    if (savedTxs.length > 0) {
      setTransactions(savedTxs);
    }
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const handleFilesSelect = async (base64Array: string[]) => {
    setLastError(null);
    setStatus(AppStatus.ANALYZING);

    try {
      const results = await Promise.all(
        base64Array.map(async (base64) => {
          try {
            return await analyzeStatement(base64);
          } catch (e: any) {
            console.error("PDF Analiz Hatası:", e);
            const message = e.message || "Analiz sırasında bir hata oluştu.";
            setLastError(message);
            if (message.includes('girin') || message.includes('bulunamadı')) {
              setIsSettingsOpen(true);
            }
            return null;
          }
        })
      );

      const validResults = results.filter(r => r !== null) as Transaction[][];
      const newTransactions = validResults.flat();

      if (newTransactions.length > 0) {
        setTransactions(prev => {
          const combined = [...newTransactions, ...prev];
          const unique = Array.from(new Map(combined.map(item => [`${item.date}-${item.description}-${item.amount}`, item])).values());
          return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
        setStatus(AppStatus.READY);
        setActiveTab('home');
      } else {
        setStatus(AppStatus.READY);
      }
    } catch (err: any) {
      setLastError(err.message || "İşlem sırasında beklenmedik bir hata oluştu.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleSalarySelect = async (base64Array: string[]) => {
    setLastError(null);
    setStatus(AppStatus.ANALYZING_SALARY);
    try {
      const tx = await analyzeSalarySlip(base64Array[0]);
      setTransactions(prev => [tx, ...prev]);
      setStatus(AppStatus.READY);
      setActiveTab('home');
    } catch (e: any) {
      setLastError("Bordro analiz edilemedi. PDF formatını kontrol et.");
      setStatus(AppStatus.READY);
    }
  };

  const handleDeleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }, []);

  const handleRefreshAdvice = useCallback(async () => {
    if (transactions.length === 0) return;
    setIsAdviceLoading(true);
    try {
      const advice = await getFinancialAdvice(transactions);
      setAiAdvice(advice);
    } catch (e) {
      console.error("AI tavsiye hatası:", e);
    } finally {
      setIsAdviceLoading(false);
    }
  }, [transactions]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    saveTheme(newTheme);
  };

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  return (
    <div className={`flex flex-col md:flex-row h-screen w-full transition-colors duration-300 ${theme === 'dark' ? 'dark bg-darkBg text-white' : 'bg-slate-50 text-slate-900'}`}>

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-darkCard border-r border-slate-100 dark:border-slate-800 p-6">
        <div className="flex items-center space-x-3 mb-10">
          <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <i className="fas fa-bolt text-white"></i>
          </div>
          <span className="font-black text-xl tracking-tighter">FinanceFlow</span>
        </div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('home')} className={`flex items-center space-x-3 px-4 py-3 rounded-2xl w-full transition-all ${activeTab === 'home' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-500'}`}>
            <i className="fas fa-home"></i><span className="font-bold">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex items-center space-x-3 px-4 py-3 rounded-2xl w-full transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-500'}`}>
            <i className="fas fa-list-ul"></i><span className="font-bold">Hareketler</span>
          </button>
          <button onClick={() => setActiveTab('add')} className={`flex items-center space-x-3 px-4 py-3 rounded-2xl w-full transition-all ${activeTab === 'add' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-500'}`}>
            <i className="fas fa-plus-circle"></i><span className="font-bold">Veri Yükle</span>
          </button>
        </nav>
        <div className="mt-auto space-y-2">
          <button onClick={toggleTheme} className="flex items-center space-x-3 px-4 py-3 rounded-2xl w-full text-slate-400 hover:text-indigo-500">
            <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun text-yellow-400'}`}></i>
            <span className="font-bold">{theme === 'light' ? 'Koyu Mod' : 'Aydınlık Mod'}</span>
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center space-x-3 px-4 py-3 rounded-2xl w-full text-slate-400 hover:text-indigo-500">
            <i className="fas fa-cog"></i><span className="font-bold">Ayarlar</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-darkCard px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <span className="font-black text-lg tracking-tight">FinanceFlow</span>
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="text-slate-400 dark:text-slate-500"><i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun text-yellow-400'}`}></i></button>
            <button onClick={() => setIsSettingsOpen(true)} className="text-indigo-600"><i className="fas fa-cog"></i></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
          <div className="max-w-6xl mx-auto px-5 py-6">
            {lastError && (
              <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-600 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-exclamation-triangle"></i>
                  <p className="text-xs font-bold uppercase leading-tight">{lastError}</p>
                </div>
                <button onClick={() => setLastError(null)} className="p-2"><i className="fas fa-times"></i></button>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <i className="fas fa-robot absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 text-xl"></i>
                </div>
                <div className="text-center">
                  <p className="font-black text-2xl tracking-tighter">AI Analiz Yapıyor</p>
                  <p className="text-slate-400 text-sm mt-1">Bu işlem biraz zaman alabilir başkan, beklemede kal.</p>
                </div>
              </div>
            )}

            {!isAnalyzing && activeTab === 'home' && transactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
                <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <i className="fas fa-chart-bar text-3xl text-indigo-400"></i>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-black tracking-tighter text-slate-800 dark:text-white">Dashboard Boş</p>
                  <p className="text-sm text-slate-400 max-w-xs">Ekstreni yükle ya da nasıl göründüğünü görmek için demo veriye bak.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => setActiveTab('add')} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-transform">
                    <i className="fas fa-upload mr-2"></i>Veri Yükle
                  </button>
                  <button onClick={() => setTransactions(getDemoTransactions())} className="px-6 py-3 bg-white dark:bg-darkCard text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl font-black uppercase tracking-widest text-sm active:scale-95 transition-transform">
                    <i className="fas fa-flask mr-2 text-indigo-400"></i>Demo Veriyi Dene
                  </button>
                </div>
              </div>
            )}

            {!isAnalyzing && activeTab === 'home' && transactions.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2"><Dashboard transactions={transactions} /></div>
                <div className="space-y-6">
                  <AiAdvisor advice={aiAdvice} isLoading={isAdviceLoading} onRefresh={handleRefreshAdvice} />
                  <div className="bg-white dark:bg-darkCard p-6 rounded-4xl border border-slate-100 dark:border-slate-800">
                    <button onClick={() => setIsManualModalOpen(true)} className="w-full py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest transition-transform active:scale-95">Manuel İşlem Ekle</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <TransactionList
                transactions={transactions}
                onDelete={handleDeleteTransaction}
              />
            )}

            {activeTab === 'add' && !isAnalyzing && (
              <div className="max-w-xl mx-auto space-y-6 md:space-y-10 py-4 md:py-10 animate-in fade-in duration-500">
                <div className="text-center space-y-1.5">
                  <h3 className="text-3xl md:text-4xl font-black tracking-tighter">Veri Yükle</h3>
                  <p className="text-slate-400 text-sm font-medium">Finansal dökümanlarını analiz edelim.</p>
                </div>
                <div className="space-y-5">
                  <section>
                    <div className="flex items-center space-x-2 mb-3 ml-1">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <i className="fas fa-credit-card text-indigo-600 text-xs"></i>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kredi Kartı Ekstresi</p>
                    </div>
                    <FileUpload onFilesSelect={handleFilesSelect} isLoading={(status as AppStatus) === AppStatus.ANALYZING} color="indigo" />
                  </section>
                  <section>
                    <div className="flex items-center space-x-2 mb-3 ml-1">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <i className="fas fa-file-invoice-dollar text-emerald-500 text-xs"></i>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maaş Bordrosu</p>
                    </div>
                    <FileUpload onFilesSelect={handleSalarySelect} isLoading={(status as AppStatus) === AppStatus.ANALYZING_SALARY} color="emerald" />
                  </section>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-darkCard/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex items-center justify-around px-2 z-50 pb-safe" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center py-3 px-4 transition-colors ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <i className="fas fa-chart-pie text-xl"></i>
            <span className="text-[8px] font-black mt-1 uppercase tracking-wider">Özet</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center py-3 px-4 transition-colors ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <i className="fas fa-history text-xl"></i>
            <span className="text-[8px] font-black mt-1 uppercase tracking-wider">Hareketler</span>
          </button>
          <button onClick={() => setActiveTab('add')} className={`flex flex-col items-center py-3 px-4 transition-colors ${activeTab === 'add' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'add' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-300 dark:shadow-indigo-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <i className="fas fa-plus text-sm"></i>
            </div>
            <span className="text-[8px] font-black mt-1 uppercase tracking-wider">Yükle</span>
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="flex flex-col items-center py-3 px-4 text-slate-400 transition-colors hover:text-indigo-500">
            <i className="fas fa-cog text-xl"></i>
            <span className="text-[8px] font-black mt-1 uppercase tracking-wider">Ayarlar</span>
          </button>
        </nav>
      </div>

      <ManualEntry isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} onAdd={(tx) => { setTransactions([tx, ...transactions]); setActiveTab('home'); }} />
      {isSettingsOpen && <Settings onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
};

export default App;
