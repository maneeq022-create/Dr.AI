import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Lock, Zap, Star } from 'lucide-react';
import { upgradeSubscription } from '../services/firebase';

interface PricingModalProps {
  onClose: () => void;
  userId: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({ onClose, userId }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (plan: 'monthly' | 'yearly' | 'trial') => {
    setIsLoading(true);
    try {
      if (plan === 'trial') {
         // Trials can be activated immediately without payment processing
         await upgradeSubscription(userId, plan);
         onClose();
         return;
      }
      
      // Call our backend API to initialize Safepay checkout
      const response = await fetch('/api/safepay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId })
      });
      
      const data = await response.json();
      
      if (data.success && data.checkoutUrl) {
         // In a real application, you would redirect the user to data.checkoutUrl here
         // window.location.href = data.checkoutUrl;
         
         console.log("Redirecting to Safepay:", data.checkoutUrl);
         
         // For demonstration in preview environment, we'll simulate a successful payment locally
         alert("Simulating Safepay checkout flow... Payment Successful!");
         await upgradeSubscription(userId, plan);
         onClose();
      } else {
         throw new Error("Failed to initialize checkout");
      }
    } catch (error) {
      console.error(error);
      alert("Payment initialization failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const PRO_FEATURES = [
    "Specialty AI Modes (Pediatrician, Veterinarian, etc.)",
    "AI Medical Imaging & Video Generation",
    "Advanced Voice Conversations",
    "High-Fidelity AI Voice (TTS)",
    "Voice Dictation",
    "PDF Report Export",
    "Unlimited Chat History",
    "Health Suite Dashboard & Charts",
    "Chronic Illness Tracking",
    "Medicine Reminders",
    "Local Backup & Export"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center bg-gradient-to-b from-blue-600 to-blue-800 text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-amber-300" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Upgrade to Dr. AI Pro</h2>
          <p className="text-blue-100 max-w-xl mx-auto text-sm">Unlock the full power of artificial intelligence for your personal healthcare journey.</p>
        </div>

        <div className="p-8 grid md:grid-cols-2 gap-8">
          {/* Features List */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Pro Features Include:
            </h3>
            <ul className="space-y-3">
              {PRO_FEATURES.map((feat, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing Cards */}
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6 relative">
              <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Monthly Plan</h4>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">Rs. 999</span>
                <span className="text-slate-500 dark:text-slate-400 pb-1">/ month</span>
              </div>
              <button 
                onClick={() => handleUpgrade('monthly')}
                disabled={isLoading}
                className="w-full py-3 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold rounded-xl border border-blue-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : 'Subscribe Monthly'}
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Save 17%</div>
              <h4 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-1">Yearly Plan</h4>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">Rs. 9,999</span>
                <span className="text-blue-700/60 dark:text-blue-300/60 pb-1">/ year</span>
              </div>
              <button 
                onClick={() => handleUpgrade('yearly')}
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Subscribe Yearly'}
              </button>
            </div>
            
            <button
                onClick={() => handleUpgrade('trial')}
                disabled={isLoading}
                className="w-full py-2 mt-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-sm font-medium underline underline-offset-4 transition-colors text-center"
            >
                Start 3-Day Free Trial
            </button>
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Payments securely processed by Safepay</p>
        </div>
      </motion.div>
    </div>
  );
};
