import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { ChatInput } from './components/ChatInput';
import { MessageBubble } from './components/MessageBubble';
import { ModeSelector } from './components/ModeSelector';
import { DisclaimerModal } from './components/DisclaimerModal';
import { LoginPage } from './components/LoginPage';
import { generateResponse, generateTTS, generateMedicalImaging, generateMedicalVideo } from './services/geminiService';
import { auth, db, logout, syncUserProfile } from './services/firebase';
import { ChatMode, Message, UserLocation, Attachment } from './types';
import { Activity, Trash2, Download, CheckCircle, Cloud, LogOut, User as UserIcon, ShieldAlert, Heart, Mic, MicOff, Volume2 } from 'lucide-react';
import { HealthTrackerSuite } from './components/HealthTrackerSuite';
import { PatientForm } from './components/PatientForm';
import { EMERGENCY_KEYWORDS } from './constants';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface AuthUser {
  uid: string;
  name: string;
  email: string;
  photo?: string;
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
  const [showDashboard, setShowDashboard] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [isEli5, setIsEli5] = useState(false);
  const [isEmergencyDetected, setIsEmergencyDetected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [age, setAge] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Emergency Keyword Monitor
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'user') {
      const detected = EMERGENCY_KEYWORDS.some(k => lastMsg.text.toLowerCase().includes(k));
      if (detected) setIsEmergencyDetected(true);
    }
  }, [messages]);

  // STT Initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        handleSendMessage(text);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const speak = async (text: string) => {
    // Attempt high-quality Gemini TTS first
    const ttsUrl = await generateTTS(text);
    if (ttsUrl) {
      const audio = new Audio(ttsUrl);
      audio.play();
    } else {
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Auth & Firestore Initialization
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          photo: firebaseUser.photoURL || undefined
        };
        setUser(userData);
        await syncUserProfile(firebaseUser);
      } else {
        setUser(null);
        setMessages([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Message History Real-time Sync
  useEffect(() => {
    if (!user) return;

    const messagesRef = collection(db, 'users', user.uid, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribeSnap = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          // Convert Firestore Timestamp to JS Date
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp)
        } as Message;
      });
      setMessages(msgs);
      setIsAutoSaved(true);
      setTimeout(() => setIsAutoSaved(false), 2000);
    });

    return () => unsubscribeSnap();
  }, [user]);

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
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out? Your current session history is saved in the cloud.")) {
      await logout();
    }
  };

  const handleClearHistory = async () => {
    if (!user || messages.length === 0) return;
    if (window.confirm("Clear all your medical consultation history? This cannot be undone.")) {
      const messagesRef = collection(db, 'users', user.uid, 'messages');
      const snapshot = await getDocs(messagesRef);
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'users', user.uid, 'messages', d.id)));
      await Promise.all(deletePromises);
    }
  };

  const handleSaveLocal = () => {
    if (messages.length === 0) return;
    const chatData = JSON.stringify(messages, null, 2);
    const blob = new Blob([chatData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Dr_AI_Chat_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    localStorage.setItem(`dr_ai_chat_backup_${Date.now()}`, chatData);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  const handleFormSubmit = async (formData: any) => {
    const prompt = `PATIENT INTAKE FORM SUBMISSION:
Name: ${formData.name}
Age: ${formData.age}
Symptoms: ${formData.symptoms}
Duration: ${formData.duration}
Pain Intensity: ${formData.intensity}/10
Medications: ${formData.medications}

Please provide a detailed medical analysis based on this information.`;
    
    setShowPatientForm(false);
    await handleSendMessage(prompt);
  };

  const handleDownloadReport = () => {
    if (messages.length === 0) return;
    
    const patientName = prompt("Enter Patient Name:") || "Anonymous";
    const patientAge = prompt("Enter Patient Age:") || "N/A";
    
    // @ts-ignore
    const doc = new jsPDF();
    const reportId = `DR-AI-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const date = new Date().toLocaleString();

    // Header bar
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("Dr. AI - Medical Report", 20, 25);
    
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.text(`Report ID: ${reportId}`, 150, 50);
    doc.text(`Generated On: ${date}`, 150, 55);

    doc.setFontSize(14);
    doc.text("Patient Information", 20, 70);
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 72, 190, 72);

    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Name: ${patientName}`, 25, 82);
    doc.text(`Age: ${patientAge}`, 25, 89);
    doc.text(`Mode: ${messages[messages.length-1]?.mode || 'N/A'}`, 25, 96);

    doc.setFontSize(14);
    doc.setTextColor(51, 65, 85);
    doc.text("Consultation Transcript", 20, 110);
    doc.line(20, 112, 190, 112);

    let yPos = 125;
    messages.forEach((msg) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 25;
      }
      
      const role = msg.role === 'user' ? 'Patient' : 'Dr. AI';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`${role} (${new Date(msg.timestamp).toLocaleTimeString()}):`, 25, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const splitText = doc.splitTextToSize(msg.text, 160);
      doc.text(splitText, 25, yPos + 6);
      yPos += (splitText.length * 6) + 12;
    });

    // Disclaimer footer
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    const disclaimerHeight = doc.internal.pageSize.height - 15;
    doc.text("DISCLAIMER: This report is generated by AI for informational purposes only. Consultation with a doctor is necessary.", 20, disclaimerHeight);
    
    doc.save(`Medical_Report_${patientName.replace(/\s+/g, '_')}.pdf`);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    if (!user) return;

    let finalPrompt = text;
    if (isEli5) {
      finalPrompt = `[MODE: EXPLAIN LIKE I'M 5] ${text}`;
    }

    const userMsgData = {
      role: 'user',
      text,
      timestamp: serverTimestamp(),
      mode: currentMode,
      attachments
    };

    setIsLoading(true);

    try {
      const messagesRef = collection(db, 'users', user.uid, 'messages');
      await addDoc(messagesRef, userMsgData);
      
      const historyPayload = messages.map(m => ({
        role: m.role,
        parts: [
          ...(m.attachments || []).map(a => ({ inlineData: { mimeType: a.mimeType, data: a.data } })),
          { text: m.text }
        ]
      }));


      const response = await generateResponse({
        prompt: finalPrompt,
        history: historyPayload,
        mode: currentMode,
        location: userLocation,
        attachments
      });

      // Special handling for image/video generation requests (Imagen/Veo)
      if (text.toLowerCase().startsWith('/image ') || text.toLowerCase().startsWith('/video ')) {
         const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
         if (!hasKey) {
            if (window.confirm("High-quality media generation requires a personal Google Cloud API key (Imagen/Veo). Would you like to select your key now?")) {
               await (window as any).aistudio?.openSelectKey();
               return; // User should retry after key selection
            }
         }
         
         if (text.toLowerCase().startsWith('/image ')) {
            const imagePrompt = text.replace('/image ', '');
            const imageUrl = await generateMedicalImaging(imagePrompt);
            if (imageUrl) {
               await addDoc(messagesRef, {
                 role: 'model',
                 text: `Generated visualization for: "${imagePrompt}"`,
                 timestamp: serverTimestamp(),
                 mode: currentMode,
                 attachments: [{ type: 'image', url: imageUrl, data: imageUrl.split(',')[1], mimeType: 'image/png' }]
               });
               return;
            }
         } else if (text.toLowerCase().startsWith('/video ')) {
            const videoPrompt = text.replace('/video ', '');
            const videoOp = await generateMedicalVideo(videoPrompt);
            if (videoOp) {
               await addDoc(messagesRef, {
                 role: 'model',
                 text: `Medical visualization request for "${videoPrompt}" is being processed. (Note: Video generation is asynchronous).`,
                 timestamp: serverTimestamp(),
                 mode: currentMode
               });
               return;
            }
         }
      }
      
      await addDoc(messagesRef, {
        role: 'model',
        text: response.text,
        timestamp: serverTimestamp(),
        mode: currentMode,
        groundingMetadata: response.groundingMetadata || null
      });

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
      
      {showDashboard && <HealthTrackerSuite onClose={() => setShowDashboard(false)} />}
      {showPatientForm && <PatientForm onClose={() => setShowPatientForm(false)} onSubmit={handleFormSubmit} />}

      {isEmergencyDetected && (
        <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-50 animate-bounce">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6" />
            <p className="text-sm font-bold">EMERGENCY DETECTED: Symptoms detected suggest critical risk.</p>
          </div>
          <div className="flex gap-2">
            <a href="tel:911" className="bg-white text-red-600 px-4 py-1.5 rounded-lg font-bold text-xs uppercase shadow-lg">Call 911</a>
            <button onClick={() => setIsEmergencyDetected(false)} className="text-white/80 text-xs font-bold uppercase underline">Dismiss</button>
          </div>
        </div>
      )}
      {showSaveToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4" /> Action Successful
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

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEli5(!isEli5)}
              className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase transition-all ${isEli5 ? 'bg-orange-600 border-orange-700 text-white shadow-inner' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
              title="Explain Like I'm 5"
            >
              ELI5 {isEli5 ? 'ON' : 'OFF'}
            </button>
            
            <button 
              onClick={() => setShowDashboard(true)}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              title="Health Suite"
            >
              <Heart className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-r border-slate-200 pr-2 mr-2">
              <button 
                onClick={toggleListening}
                className={`p-2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-blue-600'}`}
                title="Voice Dictation"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={handleSaveLocal}
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-2"
                title="Save Chat to Local Storage"
              >
                <Cloud className="w-5 h-5" />
                <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider">Save Chat</span>
              </button>

              <button 
                onClick={handleDownloadReport} 
                className="p-2 text-slate-400 hover:text-blue-600 flex items-center gap-2 transition-colors"
                title="Download PDF Medical Report"
              >
                <Download className="w-5 h-5" />
                <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider">PDF Report</span>
              </button>

              <button 
                onClick={handleClearHistory} 
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Clear History"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

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
               <p className="max-w-md mx-auto mb-4 text-sm font-medium text-slate-500" style={{ fontFamily: 'system-ui' }}>How can Dr. AI assist you today?</p>
               <div className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mt-8">System by Muhammad Aneeq Ur Rehman</div>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                onSpeak={() => speak(msg.text)}
                onFillForm={() => setShowPatientForm(true)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} activeMode={currentMode} />
    </div>
  );
};

export default App;