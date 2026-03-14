
import React, { createContext, useContext, useState, useCallback } from 'react';

export type Lang = 'tr' | 'en';

const LANG_KEY = 'financeflow_lang';

const detectLang = (): Lang => {
  const saved = localStorage.getItem(LANG_KEY) as Lang | null;
  if (saved === 'tr' || saved === 'en') return saved;
  const browser = (navigator.language || '').toLowerCase();
  return browser.startsWith('tr') ? 'tr' : 'en';
};

const translations: Record<Lang, Record<string, string>> = {
  tr: {
    /* Nav */
    nav_dashboard: 'Dashboard',
    nav_transactions: 'Hareketler',
    nav_upload: 'Veri Yükle',
    nav_settings: 'Ayarlar',
    nav_summary: 'Özet',
    nav_load: 'Yükle',
    /* App: home empty */
    home_empty_title: 'Dashboard Boş',
    home_empty_desc: 'Ekstreni yükle ya da nasıl göründüğünü görmek için demo veriye bak.',
    home_upload_btn: 'Veri Yükle',
    home_demo_btn: 'Demo Veriyi Dene',
    /* App: analyzing */
    analyzing_title: 'AI Analiz Yapıyor',
    analyzing_desc: 'Bu işlem biraz zaman alabilir başkan, beklemede kal.',
    /* App: manual */
    manual_add_btn: 'Manuel İşlem Ekle',
    /* App: upload tab */
    upload_title: 'Veri Yükle',
    upload_subtitle: 'Finansal dökümanlarını analiz edelim.',
    upload_cc: 'Kredi Kartı Ekstresi',
    upload_salary: 'Maaş Bordrosu',
    /* Dashboard */
    dash_waiting_title: 'Veri Bekleniyor',
    dash_waiting_desc: 'Ekstreni yükledikten sonra dashboard burada dolacak.',
    dash_summary_title: 'Finansal Özet',
    dash_this_month: 'Bu Ay',
    dash_all: 'Tümü',
    dash_expense: 'Gider',
    dash_income: 'Gelir',
    dash_net: 'Net Durum',
    dash_prev: 'Önceki:',
    dash_chart_title: 'Gelir / Gider Grafiği',
    dash_category_title: 'Kategori Dağılımı',
    dash_total: 'Toplam',
    /* TransactionList */
    list_expenses: 'Harcamalar',
    list_income: 'Gelirler',
    list_search: 'Açıklama veya kategori ara…',
    list_all: 'Tümü',
    list_selected_total: 'Seçili Toplam',
    list_tx_count: 'İşlem',
    list_manual_badge: 'Manuel',
    list_no_search: 'Arama sonucu bulunamadı',
    list_no_records: 'Kayıt Bulunamadı',
    list_delete_confirm: 'Silmek için tekrar tıkla',
    list_delete: 'Sil',
    csv_date: 'Tarih',
    csv_desc: 'Açıklama',
    csv_cat: 'Kategori',
    csv_type: 'Tür',
    csv_amount: 'Tutar (₺)',
    csv_expense: 'Gider',
    csv_income: 'Gelir',
    /* AiAdvisor */
    ai_subtitle: 'Bütçe Analizi',
    ai_refresh: 'Analizi yenile',
    ai_waiting_title: 'Analiz Bekleniyor',
    ai_waiting_desc: 'Ekstreni yükledikten sonra yenile butonuna bas.',
    /* ManualEntry */
    me_title: 'Yeni İşlem',
    me_subtitle: 'Manuel veri girişi',
    me_expense: 'Gider',
    me_income: 'Gelir',
    me_desc: 'Açıklama',
    me_amount: 'Tutar',
    me_category: 'Kategori',
    me_date: 'Tarih',
    me_save: 'İşlemi Kaydet',
    me_placeholder: 'Market, Kira, Freelance…',
    /* FileUpload */
    fu_analyzing_mobile: 'Analiz ediliyor…',
    fu_select: 'PDF Seç',
    fu_size_hint: 'Maksimum 5MB · PDF',
    fu_analyzing_desktop: 'Analiz Ediliyor…',
    fu_drop: 'Dosyaları Buraya Bırak',
    fu_or_click: 'veya tıkla, dosyaları seç',
    fu_too_large: 'Bazı dosyalar çok büyük (Max 5MB). Lütfen daha küçük boyutlu PDF\'ler yükle başkan.',
    fu_pdf_only: 'Lütfen sadece PDF dosyası yükle.',
    fu_read_error: 'Dosya okunurken hata oluştu.',
    fu_process_error: 'Dosyalar işlenirken bir sorun oluştu. Lütfen tekrar dene.',
    /* Settings */
    s_title: 'Ayarlar',
    s_subtitle: 'Konfigürasyon',
    s_save: 'Kaydet',
    s_saved: 'Kaydedildi',
    s_dark: 'Koyu Mod',
    s_light: 'Aydınlık Mod',
    s_theme_hint: 'Görünüm tercihi',
    s_lang: 'Dil / Language',
    s_lang_hint: 'Arayüz dili',
    s_provider: 'AI Servis Sağlayıcı',
    s_model: 'Model',
    s_api_key: 'API Anahtarı',
    s_base_url: 'API Base URL',
    s_personality: 'AI Karakteri',
    s_custom: 'Özel Talimatlar',
    s_custom_placeholder: 'Örn: Sadece market harcamalarımı sıkı denetle…',
    s_storage_note: 'Ayarlar yalnızca bu tarayıcıda yerel olarak saklanır.',
    s_danger: 'Tehlikeli Alan',
    s_clear: 'Tüm Verileri Temizle',
    s_clear_confirm: 'Emin misin? Tekrar bas!',
    /* Locale for dates */
    locale: 'tr-TR',
  },
  en: {
    /* Nav */
    nav_dashboard: 'Dashboard',
    nav_transactions: 'Transactions',
    nav_upload: 'Upload',
    nav_settings: 'Settings',
    nav_summary: 'Summary',
    nav_load: 'Upload',
    /* App: home empty */
    home_empty_title: 'Dashboard Empty',
    home_empty_desc: 'Upload your statement or try demo data to see how it looks.',
    home_upload_btn: 'Upload Data',
    home_demo_btn: 'Try Demo Data',
    /* App: analyzing */
    analyzing_title: 'AI Analyzing',
    analyzing_desc: 'This may take a moment, please wait.',
    /* App: manual */
    manual_add_btn: 'Add Transaction',
    /* App: upload tab */
    upload_title: 'Upload Data',
    upload_subtitle: "Let's analyze your financial documents.",
    upload_cc: 'Credit Card Statement',
    upload_salary: 'Payslip',
    /* Dashboard */
    dash_waiting_title: 'Waiting for Data',
    dash_waiting_desc: 'Upload your statement and the dashboard will fill up here.',
    dash_summary_title: 'Financial Summary',
    dash_this_month: 'This Month',
    dash_all: 'All',
    dash_expense: 'Expense',
    dash_income: 'Income',
    dash_net: 'Net Balance',
    dash_prev: 'Previous:',
    dash_chart_title: 'Income / Expense Chart',
    dash_category_title: 'Category Breakdown',
    dash_total: 'Total',
    /* TransactionList */
    list_expenses: 'Expenses',
    list_income: 'Income',
    list_search: 'Search by description or category…',
    list_all: 'All',
    list_selected_total: 'Selected Total',
    list_tx_count: 'Transactions',
    list_manual_badge: 'Manual',
    list_no_search: 'No search results',
    list_no_records: 'No Records Found',
    list_delete_confirm: 'Click again to confirm',
    list_delete: 'Delete',
    csv_date: 'Date',
    csv_desc: 'Description',
    csv_cat: 'Category',
    csv_type: 'Type',
    csv_amount: 'Amount (₺)',
    csv_expense: 'Expense',
    csv_income: 'Income',
    /* AiAdvisor */
    ai_subtitle: 'Budget Analysis',
    ai_refresh: 'Refresh analysis',
    ai_waiting_title: 'Analysis Pending',
    ai_waiting_desc: 'Upload your statement then press refresh.',
    /* ManualEntry */
    me_title: 'New Transaction',
    me_subtitle: 'Manual data entry',
    me_expense: 'Expense',
    me_income: 'Income',
    me_desc: 'Description',
    me_amount: 'Amount',
    me_category: 'Category',
    me_date: 'Date',
    me_save: 'Save Transaction',
    me_placeholder: 'Groceries, Rent, Freelance…',
    /* FileUpload */
    fu_analyzing_mobile: 'Analyzing…',
    fu_select: 'Select PDF',
    fu_size_hint: 'Max 5MB · PDF',
    fu_analyzing_desktop: 'Analyzing…',
    fu_drop: 'Drop Files Here',
    fu_or_click: 'or click to select files',
    fu_too_large: 'Some files are too large (Max 5MB). Please upload smaller PDFs.',
    fu_pdf_only: 'Please upload PDF files only.',
    fu_read_error: 'Error reading file.',
    fu_process_error: 'Error processing files. Please try again.',
    /* Settings */
    s_title: 'Settings',
    s_subtitle: 'Configuration',
    s_save: 'Save',
    s_saved: 'Saved',
    s_dark: 'Dark Mode',
    s_light: 'Light Mode',
    s_theme_hint: 'Display preference',
    s_lang: 'Language / Dil',
    s_lang_hint: 'Interface language',
    s_provider: 'AI Provider',
    s_model: 'Model',
    s_api_key: 'API Key',
    s_base_url: 'API Base URL',
    s_personality: 'AI Personality',
    s_custom: 'Custom Instructions',
    s_custom_placeholder: 'E.g. Only focus on my grocery spending…',
    s_storage_note: 'Settings are stored locally in this browser only.',
    s_danger: 'Danger Zone',
    s_clear: 'Clear All Data',
    s_clear_confirm: 'Are you sure? Press again!',
    /* Locale for dates */
    locale: 'en-GB',
  }
};

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'tr',
  setLang: () => {},
  t: (k) => k,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(LANG_KEY, l);
    setLangState(l);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[lang][key] ?? translations['en'][key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
