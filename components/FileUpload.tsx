
import React, { useCallback } from 'react';

interface FileUploadProps {
  onFilesSelect: (base64Array: string[]) => void;
  isLoading: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, isLoading }) => {
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];
    
    // Boyut kontrolü
    const largeFiles = fileList.filter(f => f.size > MAX_FILE_SIZE);
    if (largeFiles.length > 0) {
      alert(`Bazı dosyalar çok büyük (Max 5MB). Lütfen daha küçük boyutlu PDF'ler yükle başkan.`);
      return;
    }

    const pdfFiles = fileList.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      alert("Lütfen sadece PDF dosyası yükle.");
      return;
    }

    const promises = pdfFiles.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Dosya okunurken hata oluştu."));
        reader.readAsDataURL(file);
      });
    });

    try {
      const base64Results = await Promise.all(promises);
      onFilesSelect(base64Results);
    } catch (err) {
      console.error("Yükleme Hatası:", err);
      alert("Dosyalar işlenirken bir sorun oluştu. Lütfen tekrar dene.");
    } finally {
      // Inputu temizle ki aynı dosya tekrar seçilebilsin
      e.target.value = '';
    }
  }, [onFilesSelect]);

  return (
    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-indigo-200 dark:border-slate-800 rounded-3xl bg-indigo-50/30 dark:bg-slate-800/20 hover:bg-indigo-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer group relative">
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={isLoading}
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
      />
      <div className="bg-white dark:bg-darkCard p-5 rounded-full shadow-md mb-4 group-hover:scale-110 transition-transform">
        <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-file-medical'} text-4xl text-indigo-600`}></i>
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white">
        {isLoading ? 'Analiz Ediliyor...' : 'Dosyaları Buraya Bırak'}
      </h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 text-center max-w-xs font-medium">
        Kredi kartı ekstrelerini seç, yapay zeka harcamalarını saniyeler içinde ayıklasın!
      </p>
      <div className="mt-4 flex space-x-2">
        <span className="text-[10px] bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-100 dark:border-slate-600 font-bold uppercase tracking-wider">MAX 5MB</span>
        <span className="text-[10px] bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-100 dark:border-slate-600 font-bold uppercase tracking-wider">PDF ANALİZ</span>
      </div>
    </div>
  );
};

export default FileUpload;
