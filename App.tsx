import React, { useState, useEffect, useRef } from 'react';
import { ChatInput } from './components/ChatInput';
import { MessageBubble } from './components/MessageBubble';
import { ModeSelector } from './components/ModeSelector';
import { DisclaimerModal } from './components/DisclaimerModal';
import { generateResponse } from './services/geminiService';
import { ChatMode, Message, UserLocation, Attachment } from './types';
import { Activity, Trash2, Download, CheckCircle, Cloud } from 'lucide-react';

const STORAGE_KEY = 'dr_gemini_chat_history_v2';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>(ChatMode.CONSULTATION);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | undefined>(undefined);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isAutoSaved, setIsAutoSaved] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      setIsAutoSaved(true);
      const timer = setTimeout(() => setIsAutoSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

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

  const handleDownloadReport = () => {
    if (messages.length === 0) return;
    let content = `DR. AI CONSULTATION REPORT\nCreated by: Muhammad Aneeq Ur Rehman\n\n`;
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
              <p className="text-xs text-slate-500 font-medium">Online</p>
              {isAutoSaved && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Cloud className="w-3 h-3" /> Auto-saved</span>}
            </div>
          </div>
        </div>
        
        {messages.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadReport} className="p-2 text-slate-400 hover:text-blue-600 flex items-center gap-2 transition-colors">
              <Download className="w-5 h-5" />
              <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Report</span>
            </button>
            <button onClick={() => setMessages([])} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      <ModeSelector currentMode={currentMode} onModeChange={setCurrentMode} disabled={isLoading} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
        <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-slate-400 my-auto py-20">
               <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 border border-blue-100"><Activity className="w-10 h-10 text-blue-400" /></div>
               <h3 className="text-lg font-semibold text-slate-600 mb-2">Welcome to Dr. AI</h3>
               <p className="max-w-md mx-auto mb-4 text-sm">Consultation system by Muhammad Aneeq Ur Rehman</p>
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