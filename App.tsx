import React, { useState, useEffect, useRef } from 'react';
import { ChatInput } from './components/ChatInput';
import { MessageBubble } from './components/MessageBubble';
import { ModeSelector } from './components/ModeSelector';
import { DisclaimerModal } from './components/DisclaimerModal';
import { LoginPage } from './components/LoginPage';
import { generateResponse } from './services/geminiService';
import { ChatMode, Message, UserLocation, Attachment } from './types';
import { Activity, Trash2, Download, CheckCircle, Cloud, LogOut, User as UserIcon } from 'lucide-react';

const STORAGE_KEY = 'dr_gemini_chat_history_v2';
const AUTH_KEY = 'dr_gemini_user_v1';

interface AuthUser {
  name: string;
  email: string;

}

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>(ChatMode.CONSULTATION);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | undefined>(undefined);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isAutoSaved, setIsAutoSaved] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth Initialization
  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_KEY);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Message History Loading
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.email}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        } catch (e) { console.error(e); }
      }
    }
  }, [user]);

  // Message Persistence
  useEffect(() => {
    if (user && messages.length > 0) {
      localStorage.setItem(`${STORAGE_KEY}_${user.email}`, JSON.stringify(messages));
      setIsAutoSaved(true);
      const timer = setTimeout(() => setIsAutoSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [messages, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setUserLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        (e) => console.warn("Location error:", e)
      );
    }
  }, []);

  const handleLogin = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out? Your current session history is saved.")) {
      setUser(null);
      setMessages([]);
      localStorage.removeItem(AUTH_KEY);
    }
  };

  const handleDownloadReport = () => {
    if (messages.length === 0) return;
    let content = `DR. AI CONSULTATION REPORT\nPatient: ${user?.name || 'User'}\nCreated by: Muhammad Aneeq Ur Rehman\n\n`;
    messages.forEach(m => {
      content += `[${m.timestamp.toLocaleString()}] ${m.role === 'user' ? 'PATIENT' : 'DR. AI'}: ${m.text}\n\n`;
    });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Medical_Report_${new Date().toLocaleDateString()}.txt`;
    a.click();
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
      mode: currentMode,
      attachments
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const tempId = (Date.now() + 1).toString();
      if (currentMode === ChatMode.CONSULTATION) {
        setMessages(prev => [...prev, { id: tempId, role: 'model', text: '', timestamp: new Date(), mode: currentMode, isThinking: true }]);
      }

      const historyPayload = messages.map(m => ({
        role: m.role,
        parts: [
          ...(m.attachments || []).map(a => ({ inlineData: { mimeType: a.mimeType, data: a.data } })),
          { text: m.text }
        ]
      }));

      const response = await generateResponse({
        prompt: text,
        history: historyPayload,
        mode: currentMode,
        location: userLocation,
        attachments
      });
      
      if (currentMode === ChatMode.CONSULTATION) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, text: response.text, isThinking: false, groundingMetadata: response.groundingMetadata } : m));
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response.text, timestamp: new Date(), mode: currentMode, groundingMetadata: response.groundingMetadata }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {!hasAcceptedDisclaimer && <DisclaimerModal onAccept={() => setHasAcceptedDisclaimer(true)} />}
      
      {showSaveToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4" /> Report Downloaded
        </div>
      )}

      <header className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><Activity className="w-6 h-6" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Dr. AI</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs text-slate-500 font-medium">System Ready</p>
              {isAutoSaved && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Cloud className="w-3 h-3" /> Auto-saved</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-4 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
             {user.photo ? (
               <img src={user.photo} className="w-6 h-6 rounded-full" alt="avatar" />
             ) : (
               <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                 <UserIcon className="w-4 h-4" />
               </div>
             )}
             <span className="text-xs font-semibold text-slate-700">{user.name}</span>
          </div>

          {messages.length > 0 && (
            <div className="flex items-center gap-2 border-r border-slate-200 pr-2 mr-2">
              <button onClick={handleDownloadReport} className="p-2 text-slate-400 hover:text-blue-600 flex items-center gap-2 transition-colors">
                <Download className="w-5 h-5" />
                <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Report</span>
              </button>
              <button onClick={() => setMessages([])} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}

          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <ModeSelector currentMode={currentMode} onModeChange={setCurrentMode} disabled={isLoading} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
        <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-slate-400 my-auto py-20">
               <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 border border-blue-100"><Activity className="w-10 h-10 text-blue-400" /></div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">Hello, {user.name.split(' ')[0]}</h3>
               <p className="max-w-md mx-auto mb-4 text-sm font-medium text-slate-500">How can Dr. AI assist you today?</p>
               <div className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mt-8">System by Muhammad Aneeq Ur Rehman</div>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} activeMode={currentMode} />
    </div>
  );
};

export default App;