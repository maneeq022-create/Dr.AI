import React, { useState } from 'react';
import { CHAT_MODES } from '../constants';
import { ChatMode } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange, disabled }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  const activeMode = CHAT_MODES.find(m => m.id === currentMode);

  return (
    <div className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      {/* Mini Bar / Toggle */}
      <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${activeMode?.bg} ${activeMode?.color}`}>
            {activeMode && <activeMode.icon className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Intelligence</p>
            <h3 className="text-sm font-bold text-slate-800">{activeMode?.label}</h3>
          </div>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200 text-[10px] font-bold uppercase transition-all"
        >
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {isExpanded ? 'Minimize Panal' : 'Switch Mode'}
        </button>
      </div>

      {/* Sliding Panal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-50 border-t border-slate-100"
          >
            <div className="max-w-6xl mx-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {CHAT_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = currentMode === mode.id;
                  const isHovered = hoveredMode === mode.id;
                  
                  return (
                    <button
                      key={mode.id}
                      onClick={() => {
                        onModeChange(mode.id);
                        setIsExpanded(false);
                      }}
                      onMouseEnter={() => setHoveredMode(mode.id)}
                      onMouseLeave={() => setHoveredMode(null)}
                      disabled={disabled}
                      className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                        isActive
                          ? `${mode.bg} ${mode.border} ring-2 ring-blue-500/20 shadow-lg scale-105`
                          : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={`p-3 rounded-xl mb-2 transition-transform duration-500 ${isActive ? 'bg-white shadow-sm' : 'bg-slate-50 group-hover:scale-110'} ${mode.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-tighter text-center ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                        {mode.label.split(' ')[0]}
                      </span>

                      {/* Tooltip Detail on Hover */}
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 bg-slate-900 text-white p-3 rounded-xl text-[10px] font-medium leading-relaxed shadow-2xl z-50 pointer-events-none"
                          >
                            <div className="flex items-center gap-2 mb-1 text-blue-400">
                              <Info className="w-3 h-3" />
                              <span className="font-bold uppercase tracking-widest">Detail</span>
                            </div>
                            {mode.description}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full border-8 border-transparent border-b-slate-900" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
