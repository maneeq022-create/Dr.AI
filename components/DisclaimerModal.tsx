import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { DISCLAIMER_TEXT } from '../constants';

interface DisclaimerModalProps {
  onAccept: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300 border border-slate-200">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800">Important Medical Disclaimer</h2>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-600 text-sm leading-relaxed text-left">
             {DISCLAIMER_TEXT}
          </div>
          
          <button
            onClick={onAccept}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Check className="w-5 h-5" />
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};