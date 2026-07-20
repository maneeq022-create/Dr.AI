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
import { ChatMode, Message, UserLocation, Attachment, AuthUser } from './types';
import { Activity, Trash2, Download, CheckCircle, Cloud, LogOut, User as UserIcon, ShieldAlert, Heart, Mic, MicOff, Volume2, Moon, Sun, Type, Lock, FilePlus2, FolderClock } from 'lucide-react';
import { HealthTrackerSuite } from './components/HealthTrackerSuite';
import { PatientForm } from './components/PatientForm';
import { EMERGENCY_KEYWORDS } from './constants';
import { PricingModal } from './components/PricingModal';
import { AdminPanel } from './components/admin/AdminPanel';
import { PinModal } from './components/admin/PinModal';
import { MedicalDictionary } from './components/MedicalDictionary';
import { SymptomChecker } from './components/SymptomChecker';
import { ExportModal } from './components/ExportModal';
import { OldChatsModal } from './components/OldChatsModal';
import { NewChatPromptModal } from './components/NewChatPromptModal';

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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg'>(() => {
    return (localStorage.getItem('textSize') as 'sm' | 'base' | 'lg') || 'base';
  });
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [showSymptomChecker, setShowSymptomChecker] = useState(false);
  const [appConfig, setAppConfig] = useState<any>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [showOldChatsModal, setShowOldChatsModal] = useState(false);
  const [showNewChatPrompt, setShowNewChatPrompt] = useState(false);

  const isAdminEmail = user?.email === 'maneeq022@gmail.com' || user?.email === 'mpervaiz220@gmail.com';
  const isPro = user?.subscriptionStatus === 'premium' || user?.subscriptionStatus === 'trial' || isAdminEmail;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'appConfig'), (docSnap) => {
      if (docSnap.exists()) {
        setAppConfig(docSnap.data());
      }
    }, (error) => {
      console.error("appConfig snapshot error:", error);
    });
    return () => unsub();
  }, []);

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
    if (appConfig?.features && appConfig.features.voiceCalling === false) {
      alert("Voice calling is currently disabled for maintenance.");
      return;
    }
    if (!isPro) {
      setShowPricingModal(true);
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const speak = async (text: string) => {
    if (appConfig?.features && appConfig.features.tts === false) {
      alert("Text-to-Speech is currently disabled for maintenance.");
      return;
    }
    if (isPro) {
      // Attempt high-quality Gemini TTS first for PRO users
      const ttsUrl = await generateTTS(text);
      if (ttsUrl) {
        const audio = new Audio(ttsUrl);
        audio.play();
        return;
      }
    }
    
    // Fallback to browser TTS for free users or if TTS fails
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  // Auth & Firestore Initialization
  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserProfile(firebaseUser);
        
        // Listen to user document for subscription updates
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUser({
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email || '',
                    photo: firebaseUser.photoURL || undefined,
                    subscriptionStatus: data.subscriptionStatus || 'free',
                    trialEndsAt: data.trialEndsAt ? data.trialEndsAt.toDate() : null
                });
                
            }
        }, (error) => {
            console.error("userDocRef snapshot error:", error);
            
        });
      } else {
        if (unsubscribeUserDoc) {
            unsubscribeUserDoc();
            unsubscribeUserDoc = undefined;
        }
        setUser(null);
        setMessages([]);
        
      }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  // Message History Real-time Sync
  useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    }


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
    }, (error) => {
      console.error("messages snapshot error:", error);
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

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('textSize', textSize);
  }, [textSize]);

  const handleLogin = (userData: AuthUser) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Logout failed", e);
      // Fallback
      window.location.reload();
    }
  };

  const handleClearHistory = async () => {
    if (!user || messages.length === 0) return;
    const messagesRef = collection(db, 'users', user.uid, 'messages');
    const snapshot = await getDocs(messagesRef);
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'users', user.uid, 'messages', d.id)));
    await Promise.all(deletePromises);
  };

  const handleSaveToOldChatsAndClear = async () => {
    if (!user || messages.length === 0) return;
    try {
      const title = messages[0]?.text.substring(0, 40) + "..." || "Consultation";
      const savedChatRef = collection(db, 'users', user.uid, 'saved_chats');
      await addDoc(savedChatRef, {
        title,
        timestamp: serverTimestamp(),
        messages: messages
      });
      await handleClearHistory();
      setShowNewChatPrompt(false);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearOnly = async () => {
    await handleClearHistory();
    setShowNewChatPrompt(false);
  };

  const handleViewOldChat = async (oldMessages: Message[]) => {
    if (!user) return;
    setIsLoading(true);
    await handleClearHistory(); // Clear current live chat
    const messagesRef = collection(db, 'users', user.uid, 'messages');
    
    // Upload old messages back to live chat preserving timestamps
    const promises = oldMessages.map(msg => {
      const { id, ...msgData } = msg;
      return addDoc(messagesRef, {
        ...msgData,
        timestamp: msgData.timestamp
      });
    });
    await Promise.all(promises);
    setIsLoading(false);
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



  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    if (!user) return;
    
    // Check Free tier limit
    if (!isPro && messages.length >= 6) {
      setShowPricingModal(true);
      return;
    }


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
         if (appConfig?.features && appConfig.features.aiImaging === false) {
           alert("AI Medical Imaging is currently disabled for maintenance.");
           setIsLoading(false);
           return;
         }
         if (!isPro) {
            setShowPricingModal(true);
            setIsLoading(false);
            return;
         }
         
         const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
         if (!hasKey) {
            await (window as any).aistudio?.openSelectKey();
            // Automatically add a system message instructing them to retry
            await addDoc(messagesRef, {
                role: 'model',
                text: "Please provide a Google Cloud API key to enable high-quality media generation (Imagen/Veo), then try your request again.",
                timestamp: serverTimestamp(),
                mode: currentMode
            });
            return;
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

  if (window.location.pathname === '/admin' || showAdminPanel) {
    return <AdminPanel user={user} onExit={() => {
      setShowAdminPanel(false);
      if (window.location.pathname === '/admin') {
        window.history.pushState({}, '', '/');
      }
    }} />;
  }

  return (
    <div className={`flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative transition-colors duration-300 ${textSize === 'sm' ? 'text-sm' : textSize === 'lg' ? 'text-lg' : 'text-base'}`}>
      {!hasAcceptedDisclaimer && <DisclaimerModal onAccept={() => setHasAcceptedDisclaimer(true)} />}
        
        {showPricingModal && user && <PricingModal onClose={() => setShowPricingModal(false)} userId={user.uid} />}
        
        {showPinModal && user && <PinModal adminEmail={user.email!} onSuccess={() => {
          setShowPinModal(false);
          setShowAdminPanel(true);
        }} onClose={() => setShowPinModal(false)} />}
        
        {showDictionary && <MedicalDictionary onClose={() => setShowDictionary(false)} />}
        {showSymptomChecker && <SymptomChecker onClose={() => setShowSymptomChecker(false)} onSubmit={(symptoms, severity) => {
          setShowSymptomChecker(false);
          handleSendMessage(`I used the Symptom Checker. I have the following symptoms: ${symptoms.join(', ')}. I rate my overall severity as ${severity}/10. Can you give me a preliminary triage assessment?`);
        }} />}

        {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} messages={messages} user={user} />}
        {showOldChatsModal && <OldChatsModal onClose={() => setShowOldChatsModal(false)} user={user} onSelectChat={handleViewOldChat} />}
        {showNewChatPrompt && <NewChatPromptModal onClose={() => setShowNewChatPrompt(false)} onSaveAndClear={handleSaveToOldChatsAndClear} onClearOnly={handleClearOnly} />}

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

        <header className="bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm z-20 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Activity className="w-6 h-6" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Dr. AI</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">System Ready</p>
              {isAutoSaved && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Cloud className="w-3 h-3" /> Auto-saved</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-4 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-full border border-slate-100 dark:border-slate-600 transition-colors duration-300">
             {user.photo ? (
               <img src={user.photo} className="w-6 h-6 rounded-full" alt="avatar" />
             ) : (
               <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                 <UserIcon className="w-4 h-4" />
               </div>
             )}
             <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{user.name}</span>
             {isAdminEmail && (
               <button 
                 onClick={() => setShowPinModal(true)}
                 className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors"
               >
                 ADMIN
               </button>
             )}
             {isPro ? (
               <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">PRO</span>
             ) : (
               <button onClick={() => setShowPricingModal(true)} className="bg-slate-200 text-slate-600 hover:bg-amber-100 hover:text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors flex items-center gap-1">
                 <Lock className="w-3 h-3" /> FREE
               </button>
             )}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => setTextSize(s => s === 'sm' ? 'base' : s === 'base' ? 'lg' : 'sm')}
              className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
              title="Toggle Text Size"
            >
              <Type className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase">{textSize}</span>
            </button>

            <button 
              onClick={() => setIsEli5(!isEli5)}
              className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase transition-all ${isEli5 ? 'bg-orange-600 border-orange-700 text-white shadow-inner' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300'}`}
              title="Explain Like I'm 5"
            >
              ELI5 {isEli5 ? 'ON' : 'OFF'}
            </button>
            
            <button 
              onClick={() => {
                if (appConfig?.features && appConfig.features.healthDashboard === false) {
                  alert("Health Tracker Dashboard is currently disabled for maintenance.");
                  return;
                }
                if (isPro) setShowDashboard(true);
                else setShowPricingModal(true);
              }}
              className="relative p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              title="Health Suite"
            >
              <Heart className="w-5 h-5" />
              {!isPro && <Lock className="w-3 h-3 absolute -top-1 -right-1 text-slate-400" />}
            </button>

            <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-2 mr-2">
              <button 
                onClick={() => {
                  if (!isPro) {
                    setShowPricingModal(true);
                    return;
                  }
                  setShowOldChatsModal(true);
                }}
                className="relative p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2"
                title="View Old Chats"
              >
                <FolderClock className="w-5 h-5" />
                <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider">Old Chats</span>
                {!isPro && <Lock className="w-3 h-3 absolute -top-1 -right-1 text-slate-400" />}
              </button>

              <button 
                onClick={() => {
                  if (messages.length > 0) {
                    setShowNewChatPrompt(true);
                  }
                }}
                className={`relative p-2 transition-colors flex items-center gap-2 ${messages.length === 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
                title="Start New Chat"
                disabled={messages.length === 0}
              >
                <FilePlus2 className="w-5 h-5" />
                <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider">New Chat</span>
              </button>

              <button 
                onClick={() => {
                  if (!isPro) {
                    setShowPricingModal(true);
                    return;
                  }
                  if (messages.length > 0) setShowExportModal(true);
                }} 
                className={`relative p-2 flex items-center gap-2 transition-colors ${messages.length === 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
                title="Save & Export Chat Report"
                disabled={messages.length === 0}
              >
                <Download className="w-5 h-5" />
                <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider">Save/Export</span>
                {!isPro && <Lock className="w-3 h-3 absolute -top-1 -right-1 text-slate-400" />}
              </button>

              <button 
                onClick={handleClearHistory} 
                className={`p-2 transition-colors ${messages.length === 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-red-500 dark:hover:text-red-400'}`}
                title="Clear Current Screen"
                disabled={messages.length === 0}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <ModeSelector 
        currentMode={currentMode} 
        onModeChange={setCurrentMode} 
        disabled={isLoading} 
        isPro={isPro}
        onRequirePro={() => setShowPricingModal(true)}
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
        <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-slate-400 my-auto py-10">
               <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-blue-100 dark:border-slate-700"><Activity className="w-10 h-10 text-blue-400 dark:text-blue-500" /></div>
               <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Hello, {user.name.split(' ')[0]}</h3>
               <p className="max-w-md mx-auto mb-8 text-sm font-medium text-slate-500 dark:text-slate-400" style={{ fontFamily: 'system-ui' }}>How can Dr. AI assist you today?</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mb-8">
                 <button onClick={() => handleSendMessage("I have a headache and a mild fever.")} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                   <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-1">Feeling Unwell?</h4>
                   <p className="text-xs text-slate-500">I have a headache and a mild fever.</p>
                 </button>
                 <button onClick={() => handleSendMessage("What are the side effects of Ibuprofen?")} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                   <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-1">Medication Info</h4>
                   <p className="text-xs text-slate-500">What are the side effects of Ibuprofen?</p>
                 </button>
                 <button onClick={() => handleSendMessage("How can I improve my sleep quality?")} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                   <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-1">Wellness Advice</h4>
                   <p className="text-xs text-slate-500">How can I improve my sleep quality?</p>
                 </button>
                 <button onClick={() => handleSendMessage("Can you explain what Hypertension means in simple terms?")} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                   <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-1">Medical Terms</h4>
                   <p className="text-xs text-slate-500">Explain Hypertension simply.</p>
                 </button>
               </div>

               <div className="flex gap-4">
                 <button onClick={() => setShowDictionary(true)} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">Medical Dictionary</button>
                 <button onClick={() => setShowSymptomChecker(true)} className="px-4 py-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-sm rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors">Symptom Checker</button>
               </div>

               <div className="text-[10px] text-slate-300 dark:text-slate-600 uppercase tracking-widest font-bold mt-8">System by Muhammad Aneeq Ur Rehman</div>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                onFillForm={() => setShowPatientForm(true)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading} 
        activeMode={currentMode}
        isPro={isPro}
        onRequirePro={() => setShowPricingModal(true)}
      />
    </div>
  );
};

export default App;