import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface PinModalProps {
  adminEmail: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ adminEmail, onSuccess, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockedUntil) {
      interval = setInterval(() => {
        const now = Date.now();
        if (now >= lockedUntil) {
          setLockedUntil(null);
          setAttempts(0);
          setTimeLeft(0);
          setError('');
        } else {
          setTimeLeft(Math.ceil((lockedUntil - now) / 1000));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const recordLog = async (action: string) => {
    try {
      await addDoc(collection(db, 'adminLogs'), {
        adminEmail,
        action,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to log admin action", e);
    }
  };

  const handleFailedAttempt = async (context: string) => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    if (step === 1) setPin('');
    if (step === 2) setPassword('');

    await recordLog(`Failed Admin Login Attempt (${newAttempts}/3) - ${context}`);
    
    if (newAttempts >= 3) {
      setLockedUntil(Date.now() + 60000); // 1 minute lockout
      setError('Too many failed attempts. Try again in 1 minute.');
      await recordLog('Admin Account Locked out for 1 min due to failed attempts');
      setStep(1);
      setPin('');
      setPassword('');
    } else {
      setError(`Incorrect ${context}. ${3 - newAttempts} attempts remaining.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockedUntil) return;

    if (step === 1) {
      if (pin === '8888') {
        setStep(2);
        setError('');
        setAttempts(0);
      } else {
        await handleFailedAttempt('PIN');
      }
    } else if (step === 2) {
      if (password === 'Aneeq@12') {
        await recordLog('Successful Admin Login');
        onSuccess();
      } else {
        await handleFailedAttempt('Password');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 relative overflow-hidden">
            <Lock className={`w-8 h-8 transition-all duration-500 ${step === 2 ? 'opacity-0 scale-50 absolute' : 'opacity-100 scale-100'}`} />
            <ShieldCheck className={`w-8 h-8 transition-all duration-500 ${step === 1 ? 'opacity-0 scale-50 absolute' : 'opacity-100 scale-100'}`} />
          </div>
          
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            {step === 1 ? 'Admin Access' : 'Security Check'}
          </h2>
          <p className="text-slate-400 text-center text-sm mb-6">
            {step === 1 
              ? 'Please enter your 4-digit security PIN to access the admin dashboard.' 
              : 'Please enter the master password for full access.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <div>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-center text-3xl tracking-[1em] py-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  disabled={!!lockedUntil}
                  autoFocus
                />
              </div>
            ) : (
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-center text-lg py-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  disabled={!!lockedUntil}
                  autoFocus
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{lockedUntil ? `Locked. Try again in ${timeLeft}s` : error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={(step === 1 ? pin.length !== 4 : password.length === 0) || !!lockedUntil}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {step === 1 ? 'Verify PIN' : 'Verify Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
