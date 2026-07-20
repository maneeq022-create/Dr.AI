import React, { useState } from 'react';
import { X, FileText, File, Download } from 'lucide-react';
import { Message, AuthUser } from '../types';
import { exportToTXT, exportToPDF, exportToDOCX } from '../utils/exportUtils';

interface ExportModalProps {
  onClose: () => void;
  messages: Message[];
  user: AuthUser | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose, messages, user }) => {
  const [format, setFormat] = useState<'txt' | 'pdf' | 'docx'>('pdf');

  const handleExport = async () => {
    if (format === 'txt') {
      exportToTXT(messages, user);
    } else if (format === 'pdf') {
      exportToPDF(messages, user);
    } else if (format === 'docx') {
      await exportToDOCX(messages, user);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Save / Export Chat</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Select the format you want to save your chat report as:</p>
          
          <div className="space-y-3">
            <button 
              onClick={() => setFormat('pdf')}
              className={`w-full flex items-center gap-3 p-4 border rounded-xl transition-colors ${format === 'pdf' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            >
              <File className="w-6 h-6" />
              <div className="text-left">
                <div className="font-bold">PDF Document (.pdf)</div>
                <div className="text-xs opacity-80">Best for printing and sharing</div>
              </div>
            </button>
            
            <button 
              onClick={() => setFormat('docx')}
              className={`w-full flex items-center gap-3 p-4 border rounded-xl transition-colors ${format === 'docx' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            >
              <FileText className="w-6 h-6" />
              <div className="text-left">
                <div className="font-bold">Word Document (.docx)</div>
                <div className="text-xs opacity-80">Best for editing</div>
              </div>
            </button>

            <button 
              onClick={() => setFormat('txt')}
              className={`w-full flex items-center gap-3 p-4 border rounded-xl transition-colors ${format === 'txt' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            >
              <FileText className="w-6 h-6" />
              <div className="text-left">
                <div className="font-bold">Text File (.txt)</div>
                <div className="text-xs opacity-80">Simple plain text</div>
              </div>
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleExport} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20">
            <Download className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
};
