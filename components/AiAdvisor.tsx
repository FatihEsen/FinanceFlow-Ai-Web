
import React from 'react';
import { AiAdvice } from '../types';

interface AiAdvisorProps {
  advice: AiAdvice | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const AiAdvisor: React.FC<AiAdvisorProps> = ({ advice, isLoading, onRefresh }) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'critical': return 'from-rose-500 to-orange-600';
      case 'warning': return 'from-amber-500 to-orange-500';
      case 'saving': return 'from-emerald-500 to-teal-600';
      default: return 'from-indigo-600 to-violet-700';
    }
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'critical': return 'fa-fire-alt';
      case 'warning': return 'fa-exclamation-triangle';
      case 'saving': return 'fa-piggy-bank';
      default: return 'fa-robot';
    }
  };

  return (
    <div className="relative group">
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${advice ? getStatusStyles(advice.status) : 'from-indigo-500 to-violet-500'} rounded-4xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse`}></div>

      <div className="relative bg-white dark:bg-darkCard rounded-4xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${advice ? getStatusStyles(advice.status) : 'from-indigo-600 to-violet-700'} flex items-center justify-center text-white shadow-lg`}>
              <i className={`fas ${isLoading ? 'fa-sync-alt fa-spin' : getIcon(advice?.status || 'neutral')} text-sm`}></i>
            </div>
            <div>
              <h3 className="font-bold text-sm dark:text-white">AI Finance Coach</h3>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Bütçe Analizi</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Analizi yenile"
          >
            <i className={`fas fa-redo-alt text-xs ${isLoading ? 'animate-spin' : ''}`}></i>
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-2">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-3/4 animate-pulse"></div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-full animate-pulse"></div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-5/6 animate-pulse"></div>
          </div>
        ) : advice ? (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed mb-4 italic">
              "{advice.verdict}"
            </p>
            <div className="space-y-3">
              {advice.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-gradient-to-r ${getStatusStyles(advice.status)}`}></div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto">
              <i className="fas fa-chart-line text-slate-300 dark:text-slate-600 text-xl"></i>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Analiz Bekleniyor</p>
              <p className="text-[11px] text-slate-400 mt-1">Ekstreni yükledikten sonra yenile butonuna bas.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAdvisor;
