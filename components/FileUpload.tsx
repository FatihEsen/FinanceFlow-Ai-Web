
import React, { useCallback } from 'react';

interface FileUploadProps {
  onFilesSelect: (base64Array: string[]) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, isLoading }) => {
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];
    const pdfFiles = fileList.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      alert("Please upload PDF files only.");
      return;
    }

    const promises = pdfFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });
    });

    const base64Results = await Promise.all(promises);
    onFilesSelect(base64Results);
  }, [onFilesSelect]);

  return (
    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-indigo-200 rounded-3xl bg-indigo-50/30 hover:bg-indigo-50 transition-all cursor-pointer group relative">
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={isLoading}
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="bg-white p-5 rounded-full shadow-md mb-4 group-hover:scale-110 transition-transform">
        <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-file-medical'} text-4xl text-indigo-600`}></i>
      </div>
      <h3 className="text-xl font-bold text-gray-800">
        {isLoading ? 'Analyzing...' : 'Drop Statements Here or Browse'}
      </h3>
      <p className="text-sm text-gray-500 mt-2 text-center max-w-xs">
        Select multiple PDFs to manage all your cards in one place, boss!
      </p>
      <div className="mt-4 flex space-x-2">
        <span className="text-[10px] bg-white text-indigo-600 px-2 py-1 rounded border border-indigo-100 font-bold uppercase tracking-wider">PDF SUPPORT</span>
        <span className="text-[10px] bg-white text-indigo-600 px-2 py-1 rounded border border-indigo-100 font-bold uppercase tracking-wider">BULK UPLOAD</span>
      </div>
    </div>
  );
};

export default FileUpload;
