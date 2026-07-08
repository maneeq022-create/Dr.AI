import React, { useState } from 'react';
import { 
  Activity, Droplets, Moon, Pill, AlertTriangle, 
  ChevronRight, Calculator, Calendar, History,
  TrendingUp, MapPin, Plus, Trash2, Heart
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface HealthTrackerSuiteProps {
  onClose: () => void;
}

export const HealthTrackerSuite: React.FC<HealthTrackerSuiteProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'vitals' | 'meds' | 'logs' | 'profile'>('vitals');
  
  // Mock data for visualizations
  const bpData = [
    { day: 'Mon', sys: 120, dia: 80 },
    { day: 'Tue', sys: 122, dia: 82 },
    { day: 'Wed', sys: 118, dia: 79 },
    { day: 'Thu', sys: 125, dia: 85 },
    { day: 'Fri', sys: 121, dia: 81 },
  ];

  const feverData = [
    { time: '08:00', temp: 98.6 },
    { time: '12:00', temp: 99.2 },
    { time: '16:00', temp: 101.5 },
    { time: '20:00', temp: 100.8 },
    { time: '00:00', temp: 99.5 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-end p-0 sm:p-4 animate-in fade-in transition-all">
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="w-full max-w-2xl h-full sm:h-[95vh] bg-white dark:bg-slate-900 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Health Tracker Suite</h2>
              <p className="text-blue-100 text-xs">Manage vitals, meds & detailed logs</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6">
          {(['vitals', 'meds', 'logs', 'profile'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-4 text-sm font-bold uppercase tracking-widest relative transition-colors ${
                activeTab === tab ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <AnimatePresence mode="wait">
            {activeTab === 'vitals' && (
              <motion.div 
                key="vitals"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">BMI Score</span>
                      <Calculator className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">22.4</div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Optimal Range</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Daily Water</span>
                      <Droplets className="w-4 h-4 text-sky-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">1.2L / 2L</div>
                    <div className="w-full h-1.5 bg-sky-100 dark:bg-sky-900/50 rounded-full mt-2 overflow-hidden">
                      <div className="w-[60%] h-full bg-sky-500 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Blood Pressure Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-rose-500" /> Blood Pressure (mmHg)
                    </h3>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bpData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                        />
                        <Line type="monotone" dataKey="sys" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="dia" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Fever Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-orange-500" /> Fever Tracking (°F)
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={feverData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                        <YAxis domain={[95, 105]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'meds' && (
              <motion.div 
                key="meds"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-white">Active Prescriptions</h3>
                  <button className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                {[
                  { name: 'Amoxicillin', dosage: '500mg', freq: '3x Daily', time: 'Remaining: 4 days' },
                  { name: 'Lisinopril', dosage: '10mg', freq: 'Every Morning', time: 'Refill needed in 12 days' }
                ].map((med, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <Pill className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{med.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{med.dosage} • {med.freq}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">{med.time}</p>
                      <button className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}

                <button className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center gap-2 text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-all">
                  <MapPin className="w-4 h-4" /> Locate Nearby Pharmacy
                </button>
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div key="logs" className="space-y-6">
                 {/* Hydration Tracker */}
                 <div className="bg-sky-50 p-6 rounded-3xl border border-sky-100">
                   <h3 className="font-bold text-sky-800 mb-4">Hydration Goal</h3>
                   <div className="flex gap-2">
                     {[1,2,3,4,5,6,7,8].map((g) => (
                       <button key={g} className={`w-10 h-14 rounded-xl border ${g <= 4 ? 'bg-sky-500 border-sky-600 text-white shadow-lg' : 'bg-white border-sky-100 text-sky-300'} flex items-end justify-center pb-2 transition-all`}>
                         <Droplets className="w-5 h-5" />
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Mental Health */}
                 <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                   <h3 className="font-bold text-indigo-800 mb-4">Daily Mood</h3>
                   <div className="flex justify-between">
                     {['😔', '😐', '😊', '🤩'].map((mood, i) => (
                       <button key={i} className="w-14 h-14 bg-white rounded-2xl shadow-sm text-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
                         {mood}
                       </button>
                     ))}
                   </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
               <motion.div key="profile" className="space-y-10">
                 <div className="space-y-4">
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Medical Profile</h4>
                   <div className="space-y-3">
                      <div className="flex justify-between py-3 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-400">Allergies</span>
                        <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">Penicillin, Peanuts</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-400">Vaccinations</span>
                        <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">COVID-19, Hep B</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-400">Blood Type</span>
                        <span className="text-sm font-bold text-slate-800 uppercase tracking-tight text-rose-600">O Positive</span>
                      </div>
                   </div>
                 </div>

                 <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-4">
                   <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0" />
                   <div>
                     <h4 className="font-bold text-orange-800 text-sm">Chronic Conditions</h4>
                     <p className="text-xs text-orange-700/70 font-medium">Hypertension (Diagnosed 2022)</p>
                   </div>
                 </div>

                 <button className="w-full p-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                   <History className="w-4 h-4" /> Export Health History
                 </button>
               </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
           <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Secure Health Sync Active via Firebase</p>
        </div>
      </motion.div>
    </div>
  );
};
