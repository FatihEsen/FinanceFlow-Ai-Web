
import React, { useCallback, useRef } from 'react';

interface FileUploadProps {
  onFilesSelect: (base64Array: string[]) => void;
  isLoading: boolean;
  label?: string;
  color?: 'indigo' | 'emerald';
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, isLoading, label = 'Kredi Kartı Ekstresi', color = 'indigo' }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList) as File[];

    const largeFiles = files.filter(f => f.size > MAX_FILE_SIZE);
    if (largeFiles.length > 0) {
      alert(`Bazı dosyalar çok büyük (Max 5MB). Lütfen daha küçük boyutlu PDF'ler yükle başkan.`);
      return;
    }

    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      alert("Lütfen sadece PDF dosyası yükle.");
      return;
    }

    const promises = pdfFiles.map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try { resolve((reader.result as string).split(',')[1]); }
        catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error("Dosya okunurken hata oluştu."));
      reader.readAsDataURL(file);
    }));

    try {
      const base64Results = await Promise.all(promises);
      onFilesSelect(base64Results);
    } catch (err) {
      console.error("Yükleme Hatası:", err);
      alert("Dosyalar işlenirken bir sorun oluştu. Lütfen tekrar dene.");
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [onFilesSelect]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(e.target.files);
  }, [processFiles]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    await processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const accent = color === 'emerald'
    ? { bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800/50', hover: 'hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20', icon: 'text-emerald-500', btn: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200', tag: 'text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' }
    : { bg: 'bg-indigo-50/40 dark:bg-indigo-900/10', border: 'border-indigo-200 dark:border-slate-700', hover: 'hover:bg-indigo-50/80 dark:hover:bg-indigo-900/20', icon: 'text-indigo-500', btn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200', tag: 'text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-slate-700' };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`relative rounded-3xl border-2 border-dashed ${accent.border} ${accent.bg} ${accent.hover} transition-all duration-200 overflow-hidden`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={isLoading}
        multiple
        className="hidden"
        id={`file-input-${color}`}
      />

      {/* Mobile: compact tap button */}
      <label
        htmlFor={`file-input-${color}`}
        className={`flex md:hidden items-center justify-between p-5 cursor-pointer ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center flex-shrink-0`}>
            <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-file-pdf'} text-xl ${accent.icon}`}></i>
          </div>
          <div>
            <p className="font-black text-sm text-slate-800 dark:text-white">{isLoading ? 'Analiz ediliyor…' : 'PDF Seç'}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Maksimum 5MB · PDF</p>
          </div>
        </div>
        <div className={`px-4 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider shadow-lg ${accent.btn} transition-all active:scale-95`}>
          <i className="fas fa-upload mr-1.5"></i>Seç
        </div>
      </label>

      {/* Desktop: drag-drop zone */}
      <label
        htmlFor={`file-input-${color}`}
        className={`hidden md:flex flex-col items-center justify-center py-10 px-6 cursor-pointer ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <div className="bg-white dark:bg-slate-800 p-5 rounded-full shadow-md mb-4 transition-transform group-hover:scale-110">
          <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-file-medical'} text-4xl ${accent.icon}`}></i>
        </div>
        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1">
          {isLoading ? 'Analiz Ediliyor…' : 'Dosyaları Buraya Bırak'}
        </h3>
        <p className="text-sm text-slate-400 font-medium text-center max-w-xs">
          veya tıkla, dosyaları seç
        </p>
        <div className="mt-4 flex space-x-2">
          <span className={`text-[10px] bg-white dark:bg-slate-800 px-2 py-1 rounded border font-bold uppercase tracking-wider ${accent.tag}`}>MAX 5MB</span>
          <span className={`text-[10px] bg-white dark:bg-slate-800 px-2 py-1 rounded border font-bold uppercase tracking-wider ${accent.tag}`}>PDF ANALİZ</span>
        </div>
      </label>
    </div>
  );
};

export default FileUpload;
