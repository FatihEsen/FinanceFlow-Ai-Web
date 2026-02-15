
import React, { useState } from 'react';
import { AppSettings } from '../types';
import { loadAppSettings, saveAppSettings } from '../services/storageService';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<AppSettings>(loadAppSettings());

  const handleSave = () => {
    saveAppSettings(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-darkCard w-full max-w-lg rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 animate-in zoom-in-95 duration-300">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight dark:text-white">Uygulama Ayarları</h2>
            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1">AI Konfigürasyonu</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-8">
          
          {/* AI Personality */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">AI Karakteri</label>
            <div className="grid grid-cols-3 gap-2">
              {(['bro', 'accountant', 'minimalist'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSettings({ ...settings, personality: p })}
                  className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center space-y-2 ${settings.personality === p ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-400'}`}
                >
                  <i className={`fas ${p === 'bro' ? 'fa-user-astronaut' : p === 'accountant' ? 'fa-user-tie' : 'fa-leaf'} text-xl`}></i>
                  <span className="text-[10px] font-black uppercase">{p}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Özel Talimatlar</label>
            <textarea
              value={settings.customInstructions}
              onChange={(e) => setSettings({ ...settings, customInstructions: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 text-sm dark:text-white min-h-[100px] focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none"
              placeholder="Örn: Sadece market harcamalarımı sıkı denetle..."
            />
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
            <div className="flex items-center space-x-3 text-emerald-600">
              <i className="fas fa-check-circle"></i>
              <span className="text-[10px] font-black uppercase tracking-widest">Sistem Hazır & Güvenli</span>
            </div>
            <span className="text-[9px] font-bold text-emerald-600/60 uppercase">Gemini Flash Active</span>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl active:scale-95"
          >
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
