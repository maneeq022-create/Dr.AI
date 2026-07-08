import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ClipboardList, Send, User, Calendar, Activity, Pill } from 'lucide-react';

interface PatientFormProps {
  onClose: () => void;
  onSubmit: (formData: any) => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    symptoms: '',
    duration: '',
    intensity: '5',
    medications: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300"
      >
        <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6" />
            <h2 className="text-xl font-bold italic tracking-tight">Patient Intake Form</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <User className="w-3 h-3" /> Full Name
              </label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Age
              </label>
              <input 
                required
                type="number" 
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                placeholder="Years"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Activity className="w-3 h-3" /> Primary Symptoms
            </label>
            <textarea 
              required
              rows={2}
              value={formData.symptoms}
              onChange={e => setFormData({...formData, symptoms: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="Describe what you are feeling..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</label>
              <input 
                required
                type="text" 
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                placeholder="e.g. 2 days"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pain Intensity (1-10)</label>
              <div className="flex gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button 
                    key={n}
                    type="button"
                    onClick={() => setFormData({...formData, intensity: n.toString()})}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${formData.intensity === n.toString() ? 'bg-blue-600 border-blue-700 text-white shadow-lg shadow-blue-500/30 scale-110' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Pill className="w-3 h-3" /> Current Medications
            </label>
            <textarea 
              rows={2}
              value={formData.medications}
              onChange={e => setFormData({...formData, medications: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="List any medicine you are taking..."
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-xl shadow-blue-200"
          >
            <Send className="w-5 h-5" /> Submit to Dr. AI
          </button>
        </form>
      </motion.div>
    </div>
  );
};
