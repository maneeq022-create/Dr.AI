import React from 'react';
import { CHAT_MODES } from '../constants';
import { ChatMode } from '../types';

interface ModeSelectorProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange, disabled }) => {
  return (
    <div className="w-full bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CHAT_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                disabled={disabled}
                className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left overflow-hidden ${
                  isActive
                    ? `${mode.bg} ${mode.border} ring-2 ring-blue-400 ring-offset-2 scale-[1.02] shadow-md`
                    : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isActive && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/40 to-transparent rounded-bl-full pointer-events-none" />
                )}
                
                <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-white shadow-sm' : 'bg-slate-100'} ${mode.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 z-10">
                  <div className={`font-semibold text-sm ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                    {mode.label}
                  </div>
                  <div className={`text-xs truncate ${isActive ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                    {mode.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};