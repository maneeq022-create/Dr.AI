import React, { useState } from 'react';
import { Activity, Chrome } from 'lucide-react';
import { loginWithGoogle } from '../services/firebase';

interface LoginPageProps {
  onLogin: (userData: { name: string; email: string; photo?: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      if (user) {
        onLogin({
          name: user.displayName || 'User',
          email: user.email || '',
          photo: user.photoURL || undefined
        });
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error(err);
      }
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cross-origin-opener-policy-failed') {
        setError("Login was cancelled or blocked. If you are in a preview iframe, please open the app in a new tab.");
      } else {
        setError("Failed to sign in with Google. Please try again or open in a new tab.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-500">
        
        {/* Header Section */}
        <div className="bg-blue-600 p-8 text-white text-center relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mb-4 shadow-inner">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Dr. AI</h1>
          <p className="text-blue-100 text-sm mt-1 opacity-90">Medical Consultation Assistant</p>
        </div>

        {/* Content Section */}
        <div className="p-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Welcome to Dr. AI</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Please sign in to start your consultation</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl text-center">
              {error}
            </div>
          )}

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
            ) : (
              <>
                <Chrome className="w-5 h-5" />
                Sign in with Google
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
            Secured by Firebase Auth
          </p>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed italic">
            Developed by Muhammad Aneeq Ur Rehman
          </p>
        </div>
      </div>
    </div>
  );
};
