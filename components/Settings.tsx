
import React, { useState } from 'react';
import { AppSettings, AiProvider } from '../types';
import { loadAppSettings, saveAppSettings } from '../services/storageService';

interface SettingsProps {
  onClose: () => void;
}


const GOOGLE_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (En Güncel)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Hızlı)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Zeki)' },
  { id: 'gemini-2.0-flash-lite-preview-02-05', name: 'Gemini 2.0 Lite (Deneysel)' },
];

const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Güçlü)' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Çok Hızlı)' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
];

const OPENAI_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-4o', name: 'GPT-4o' },
];

const OPENROUTER_MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (PDF Desteği)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Ücretsiz + PDF)' },
  { id: 'mistralai/mistral-nemo', name: 'Mistral Nemo (Ücretsiz)' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
];

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<AppSettings>(loadAppSettings());

  const handleProviderChange = (provider: AiProvider) => {
    let defaultModel = '';
    let defaultBaseUrl = '';

    if (provider === 'google') {
      defaultModel = GOOGLE_MODELS[0].id;
      defaultBaseUrl = '';
    } else if (provider === 'groq') {
      defaultModel = GROQ_MODELS[0].id;
      defaultBaseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    } else if (provider === 'openai') {
      defaultModel = OPENAI_MODELS[0].id;
      defaultBaseUrl = 'https://api.openai.com/v1/chat/completions';
    } else if (provider === 'openrouter') {
      defaultModel = OPENROUTER_MODELS[0].id;
      defaultBaseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    }

    setSettings({ ...settings, provider, model: defaultModel, baseUrl: defaultBaseUrl });
  };

  const handleSave = () => {
    saveAppSettings(settings);
    onClose();
    // Sayfayı yenilemeye gerek yok ama servisler yeni key'den çeksin diye
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-darkCard w-full max-w-xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight dark:text-white">Uygulama Ayarları</h2>
            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1">Konfigürasyon</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-8">

          {/* API Key Configuration */}
          <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">AI Servis Sağlayıcı</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(['google', 'openrouter', 'groq', 'openai'] as const).map((prov) => (
                  <button
                    key={prov}
                    onClick={() => handleProviderChange(prov)}
                    className={`py-3 rounded-xl border-2 transition-all font-bold text-[10px] uppercase ${settings.provider === prov ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-400'}`}
                  >
                    {prov === 'google' ? 'Gemini' : prov === 'openrouter' ? 'OpenRouter' : prov === 'groq' ? 'Groq' : 'OpenAI'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Model Seçimi</label>
              <select
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none focus:border-indigo-600"
              >
                {settings.provider === 'google' && GOOGLE_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
                {settings.provider === 'groq' && GROQ_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
                {settings.provider === 'openai' && OPENAI_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
                {settings.provider === 'openrouter' && OPENROUTER_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">API Anahtarı ({settings.provider})</label>
              <div className="relative">
                <input
                  type="password"
                  value={settings.apiKeys[settings.provider] || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    apiKeys: { ...settings.apiKeys, [settings.provider]: e.target.value }
                  })}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 pr-10 text-sm dark:text-white outline-none focus:border-indigo-600"
                  placeholder={`${settings.provider === 'google' ? 'Gemini' : settings.provider === 'openrouter' ? 'OpenRouter' : settings.provider === 'groq' ? 'Groq' : 'OpenAI'} API Key buraya...`}
                />
                <i className="fas fa-key absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"></i>
              </div>
            </div>

            {settings.provider !== 'google' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">API Base URL (Endpoint)</label>
                <input
                  type="text"
                  value={settings.baseUrl}
                  onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none focus:border-indigo-600"
                  placeholder="https://api.../v1/chat/completions"
                />
              </div>
            )}

            <p className="text-[9px] text-slate-400 mt-2 italic">Ayarlarınız yerel olarak tarayıcınızda saklanır.</p>
          </div>

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
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 text-sm dark:text-white min-h-[80px] focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none"
              placeholder="Örn: Sadece market harcamalarımı sıkı denetle..."
            />
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
