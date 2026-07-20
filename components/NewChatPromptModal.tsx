import React from 'react';
import { X, Save, Trash2, FilePlus2 } from 'lucide-react';

interface NewChatPromptModalProps {
  onClose: () => void;
  onSaveAndClear: () => void;
  onClearOnly: () => void;
}

export const NewChatPromptModal: React.FC<NewChatPromptModalProps> = ({ onClose, onSaveAndClear, onClearOnly }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
              <FilePlus2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Start New Chat</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Do you want to save your current consultation to "Old Chats" before starting a new one?
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={onSaveAndClear}
              className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
            >
              <Save className="w-5 h-5" /> Save to Old Chats & Start New
            </button>
            
            <button 
              onClick={onClearOnly}
              className="w-full flex items-center justify-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-bold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
            >
              <Trash2 className="w-5 h-5" /> Discard Current & Start New
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
