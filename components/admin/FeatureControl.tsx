import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Save } from 'lucide-react';

interface FeatureControlProps {
  adminEmail: string;
}

export const FeatureControl: React.FC<FeatureControlProps> = ({ adminEmail }) => {
  const [config, setConfig] = useState<any>({
     features: {
        aiImaging: true,
        voiceCalling: true,
        tts: true,
        pdfExport: true,
        healthDashboard: true,
        chronicTracking: true,
        medicineReminders: true
     },
     pricing: {
        monthly: 9.99,
        yearly: 99.99,
        trialDays: 7
     }
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
     const docRef = doc(db, 'config', 'appConfig');
     const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
           setConfig(docSnap.data());
        }
     });
     return () => unsubscribe();
  }, []);

  const handleToggle = (featureKey: string) => {
     setConfig((prev: any) => ({
        ...prev,
        features: {
           ...prev.features,
           [featureKey]: !prev.features[featureKey]
        }
     }));
  };

  const handlePricingChange = (key: string, value: string) => {
     setConfig((prev: any) => ({
        ...prev,
        pricing: {
           ...prev.pricing,
           [key]: Number(value) || 0
        }
     }));
  };

  const recordLog = async (action: string) => {
    try {
      await addDoc(collection(db, 'adminLogs'), {
        adminEmail,
        action,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to log action", e);
    }
  };

  const saveConfig = async () => {
     setIsSaving(true);
     try {
        await setDoc(doc(db, 'config', 'appConfig'), config);
        await recordLog('Updated App Configuration & Pricing');
        alert('Configuration saved successfully.');
     } catch (e) {
        console.error(e);
        alert('Failed to save configuration.');
     } finally {
        setIsSaving(false);
     }
  };

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Platform Settings & Features</h1>
          <button 
             onClick={saveConfig}
             disabled={isSaving}
             className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors"
          >
             <Save className="w-5 h-5" />
             {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
             <h2 className="text-xl font-bold text-white mb-6">Pro Features</h2>
             <div className="space-y-4">
                {[
                   { key: 'aiImaging', label: 'AI Medical Imaging (Veo/Imagen)' },
                   { key: 'voiceCalling', label: 'Voice Calling / Dictation' },
                   { key: 'tts', label: 'Text-to-Speech (TTS)' },
                   { key: 'pdfExport', label: 'PDF Report Export' },
                   { key: 'healthDashboard', label: 'Health Tracker Dashboard' },
                   { key: 'chronicTracking', label: 'Chronic Tracking' },
                   { key: 'medicineReminders', label: 'Medicine Reminders' }
                ].map(feature => (
                   <div key={feature.key} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                      <span className="text-slate-200 font-medium">{feature.label}</span>
                      <button 
                         onClick={() => handleToggle(feature.key)}
                         className={`w-14 h-8 rounded-full transition-colors relative ${config.features[feature.key] ? 'bg-blue-500' : 'bg-slate-700'}`}
                      >
                         <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${config.features[feature.key] ? 'translate-x-7' : 'translate-x-1'}`}></div>
                      </button>
                   </div>
                ))}
             </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
             <h2 className="text-xl font-bold text-white mb-6">Pricing Configuration</h2>
             <div className="space-y-6">
                <div>
                   <label className="block text-slate-400 text-sm font-medium mb-2">Monthly Price ($)</label>
                   <input 
                      type="number"
                      value={config.pricing.monthly}
                      onChange={(e) => handlePricingChange('monthly', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500"
                   />
                </div>
                <div>
                   <label className="block text-slate-400 text-sm font-medium mb-2">Yearly Price ($)</label>
                   <input 
                      type="number"
                      value={config.pricing.yearly}
                      onChange={(e) => handlePricingChange('yearly', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500"
                   />
                </div>
                <div>
                   <label className="block text-slate-400 text-sm font-medium mb-2">Free Trial Duration (Days)</label>
                   <input 
                      type="number"
                      value={config.pricing.trialDays}
                      onChange={(e) => handlePricingChange('trialDays', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500"
                   />
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};
