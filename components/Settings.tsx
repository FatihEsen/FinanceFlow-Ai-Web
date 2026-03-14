
import React, { useState } from 'react';
import { AppSettings, AiProvider, Theme } from '../types';
import { loadAppSettings, saveAppSettings } from '../services/storageService';

interface SettingsProps {
  onClose: () => void;
  theme: Theme;
  onThemeToggle: () => void;
  onClearData: () => void;
}

const GOOGLE_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
  { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro Preview' },
  { id: 'gemini-2.5-flash-preview-04-17', name: 'Gemini 2.5 Flash Preview' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
];

const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Hızlı)' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
];

const OPENAI_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-4o', name: 'GPT-4o' },
];

const OPENROUTER_MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (PDF)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Ücretsiz)' },
  { id: 'mistralai/mistral-nemo', name: 'Mistral Nemo (Ücretsiz)' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
];

const PROVIDER_MODELS: Record<AiProvider, { id: string; name: string }[]> = {
  google: GOOGLE_MODELS,
  groq: GROQ_MODELS,
  openai: OPENAI_MODELS,
  openrouter: OPENROUTER_MODELS,
};

const PROVIDER_DEFAULTS: Record<AiProvider, { model: string; baseUrl: string }> = {
  google: { model: GOOGLE_MODELS[0].id, baseUrl: '' },
  groq: { model: GROQ_MODELS[0].id, baseUrl: 'https://api.groq.com/openai/v1/chat/completions' },
  openai: { model: OPENAI_MODELS[0].id, baseUrl: 'https://api.openai.com/v1/chat/completions' },
  openrouter: { model: OPENROUTER_MODELS[0].id, baseUrl: 'https://openrouter.ai/api/v1/chat/completions' },
};

const Settings: React.FC<SettingsProps> = ({ onClose, theme, onThemeToggle, onClearData }) => {
  const [settings, setSettings] = useState<AppSettings>(loadAppSettings());
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleProviderChange = (provider: AiProvider) => {
    const { model, baseUrl } = PROVIDER_DEFAULTS[provider];
    setSettings({ ...settings, provider, model, baseUrl });
  };

  const handleSave = () => {
    saveAppSettings(settings);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  const handleClear = () => {
    if (confirmClear) {
      onClearData();
      onClose();
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-darkCard w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 max-h-[92vh] overflow-y-auto no-scrollbar">

        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black tracking-tight dark:text-white">Ayarlar</h2>
            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-0.5">Konfigürasyon</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={handleSave}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${saved ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:opacity-90'}`}>
              {saved ? <><i className="fas fa-check mr-1.5"></i>Kaydedildi</> : <><i className="fas fa-save mr-1.5"></i>Kaydet</>}
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center">
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <i className={`fas ${theme === 'dark' ? 'fa-moon text-indigo-400' : 'fa-sun text-yellow-400'} text-sm`}></i>
              </div>
              <div>
                <p className="text-sm font-black dark:text-white">{theme === 'dark' ? 'Koyu Mod' : 'Aydınlık Mod'}</p>
                <p className="text-[10px] text-slate-400 font-medium">Görünüm tercihi</p>
              </div>
            </div>
            <button
              onClick={onThemeToggle}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`}></div>
            </button>
          </div>

          {/* AI Provider */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Servis Sağlayıcı</label>
            <div className="grid grid-cols-4 gap-2">
              {(['google', 'openrouter', 'groq', 'openai'] as const).map(prov => (
                <button key={prov} onClick={() => handleProviderChange(prov)}
                  className={`py-2.5 rounded-xl border-2 transition-all font-bold text-[9px] uppercase ${settings.provider === prov ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-400'}`}>
                  {prov === 'google' ? 'Gemini' : prov === 'openrouter' ? 'OpenRouter' : prov === 'groq' ? 'Groq' : 'OpenAI'}
                </button>
              ))}
            </div>
          </div>

          {/* Model + API Key (2-col on desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Model</label>
              <select value={settings.model} onChange={e => setSettings({ ...settings, model: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm dark:text-white outline-none focus:border-indigo-500 transition-colors">
                {PROVIDER_MODELS[settings.provider].map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">API Anahtarı</label>
              <div className="relative">
                <input type="password" value={settings.apiKeys[settings.provider] || ''}
                  onChange={e => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, [settings.provider]: e.target.value } })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pr-9 text-sm dark:text-white outline-none focus:border-indigo-500 transition-colors"
                  placeholder="API Key…" />
                <i className="fas fa-key absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
              </div>
            </div>
          </div>

          {settings.provider !== 'google' && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">API Base URL</label>
              <input type="text" value={settings.baseUrl}
                onChange={e => setSettings({ ...settings, baseUrl: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm dark:text-white outline-none focus:border-indigo-500 transition-colors"
                placeholder="https://api.…/v1/chat/completions" />
            </div>
          )}

          {/* AI Personality */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">AI Karakteri</label>
            <div className="grid grid-cols-3 gap-2">
              {(['bro', 'accountant', 'minimalist'] as const).map(p => (
                <button key={p} onClick={() => setSettings({ ...settings, personality: p })}
                  className={`py-3 rounded-xl border-2 transition-all flex items-center justify-center space-x-2 ${settings.personality === p ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-400'}`}>
                  <i className={`fas ${p === 'bro' ? 'fa-user-astronaut' : p === 'accountant' ? 'fa-user-tie' : 'fa-leaf'}`}></i>
                  <span className="text-[10px] font-black uppercase">{p}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Özel Talimatlar</label>
            <textarea value={settings.customInstructions}
              onChange={e => setSettings({ ...settings, customInstructions: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white min-h-[70px] focus:border-indigo-500 outline-none transition-colors resize-none"
              placeholder="Örn: Sadece market harcamalarımı sıkı denetle…" />
          </div>

          <p className="text-[9px] text-slate-400 italic">Ayarlar yalnızca bu tarayıcıda yerel olarak saklanır.</p>

          {/* Danger Zone */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tehlikeli Alan</p>
            <button onClick={handleClear}
              className={`w-full py-3 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 border-2 ${confirmClear ? 'bg-rose-500 border-rose-500 text-white' : 'border-rose-200 dark:border-rose-900/50 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'}`}>
              <i className={`fas ${confirmClear ? 'fa-exclamation-triangle' : 'fa-trash'} mr-2`}></i>
              {confirmClear ? 'Emin misin? Tekrar bas!' : 'Tüm Verileri Temizle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
