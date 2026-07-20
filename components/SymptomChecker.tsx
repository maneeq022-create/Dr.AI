import React, { useState } from 'react';
import { Activity, ShieldAlert, X, ChevronRight, Stethoscope } from 'lucide-react';
import { motion } from 'motion/react';

const COMMON_SYMPTOMS = [
  'Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea',
  'Shortness of breath', 'Chest pain', 'Dizziness', 'Sore throat',
  'Muscle aches', 'Abdominal pain', 'Rash'
];

interface SymptomCheckerProps {
  onClose: () => void;
  onSubmit: (symptoms: string[], severity: number) => void;
}

export const SymptomChecker: React.FC<SymptomCheckerProps> = ({ onClose, onSubmit }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState(5);

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const handleSubmit = () => {
    if (selectedSymptoms.length > 0) {
      onSubmit(selectedSymptoms, severity);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in transition-all">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Symptom Checker</h2>
              <p className="text-rose-100 text-xs">Preliminary triage assessment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 max-h-[60vh]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Select Your Symptoms</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map(sym => (
                <button
                  key={sym}
                  onClick={() => toggleSymptom(sym)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedSymptoms.includes(sym)
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-slate-800 dark:text-white">Overall Severity</h3>
              </div>
              <span className="font-bold text-orange-500">{severity}/10</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
              <span>Mild</span>
              <span>Moderate</span>
              <span>Severe</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={handleSubmit}
            disabled={selectedSymptoms.length === 0}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-500/30"
          >
            Get AI Assessment <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
