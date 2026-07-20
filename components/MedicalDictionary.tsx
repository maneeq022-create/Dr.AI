import React, { useState } from 'react';
import { Search, BookOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DICTIONARY_DATA = [
  { term: 'Hypertension', definition: 'High blood pressure. A condition in which the force of the blood against the artery walls is too high.' },
  { term: 'Myocardial Infarction', definition: 'Commonly known as a heart attack. Occurs when blood flow decreases or stops to a part of the heart, causing damage to the heart muscle.' },
  { term: 'Dyspnea', definition: 'Difficult or labored breathing; shortness of breath.' },
  { term: 'Tachycardia', definition: 'A rapid heart rate, usually defined as greater than 100 beats per minute in adults.' },
  { term: 'Bradycardia', definition: 'A slower than normal heart rate, typically under 60 beats per minute in adults.' },
  { term: 'Hyperglycemia', definition: 'High blood sugar levels, often associated with diabetes.' },
  { term: 'Hypoglycemia', definition: 'Low blood sugar levels.' },
  { term: 'Edema', definition: 'Swelling caused by excess fluid trapped in your body\'s tissues.' },
  { term: 'Ibuprofen', acronym: 'NSAID', definition: 'Nonsteroidal anti-inflammatory drug used for treating pain, fever, and inflammation.' },
  { term: 'Electrocardiogram', acronym: 'ECG/EKG', definition: 'A test that measures the electrical activity of the heartbeat.' }
];

interface MedicalDictionaryProps {
  onClose: () => void;
}

export const MedicalDictionary: React.FC<MedicalDictionaryProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = DICTIONARY_DATA.filter(item => 
    item.term.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.acronym?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in transition-all">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Medical Dictionary</h2>
              <p className="text-indigo-100 text-xs">Look up common terms and acronyms</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search terms, definitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-12 pr-4 py-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {filteredData.length > 0 ? filteredData.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-slate-800 dark:text-white">{item.term}</h3>
                  {item.acronym && (
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-md">
                      {item.acronym}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.definition}
                </p>
              </motion.div>
            )) : (
              <div className="text-center py-10 text-slate-500">
                No matching terms found.
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
