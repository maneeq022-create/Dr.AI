import React, { useState, KeyboardEvent, useEffect, useRef, ChangeEvent } from 'react';
import { Send, Sparkles, Mic, MicOff, Clock, Search, Paperclip, X, Image as ImageIcon, Film, Layout, Maximize } from 'lucide-react';
import { ChatMode, Attachment } from '../types';
import { CARE_CHIPS } from '../constants';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  activeMode: ChatMode;
}

const SEARCH_SUFFIXES = [
    "near me",
    "accepting new patients",
    "open 24/7",
    "emergency services",
    "bulk billing"
];

const ASPECT_RATIOS = ["1:1", "3:2", "4:3", "16:9", "9:16", "21:9"];
const IMAGE_SIZES = ["1K", "2K", "4K"];

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, activeMode }) => {
  const [input, setInput] = useState('');
  const [duration, setDuration] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [showMediaTools, setShowMediaTools] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedSize, setSelectedSize] = useState("1K");

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  useEffect(() => {
    if (activeMode === ChatMode.FIND_CARE && input.trim()) {
        const lowerInput = input.toLowerCase();
        const chipMatches = CARE_CHIPS.filter(chip => 
            chip.toLowerCase().includes(lowerInput) && 
            chip.toLowerCase() !== lowerInput
        );
        const suffixSuggestions = SEARCH_SUFFIXES.map(suffix => `${input.trim()} ${suffix}`);
        
        let finalSuggestions: string[] = [];
        const exactMatch = CARE_CHIPS.find(c => c.toLowerCase() === lowerInput);
        if (exactMatch) {
             finalSuggestions = SEARCH_SUFFIXES.map(s => `${exactMatch} ${s}`);
        } else {
             finalSuggestions = [...chipMatches, ...suffixSuggestions.slice(0, 3)];
        }
        setSuggestions(finalSuggestions.slice(0, 5));
        setShowSuggestions(finalSuggestions.length > 0);
    } else {
        setShowSuggestions(false);
    }
  }, [input, activeMode]);

  const toggleListening = () => {
    if (!recognition) {
        alert("Voice input is not supported in this browser.");
        return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAttachments: Attachment[] = [];
      const files: File[] = Array.from(e.target.files);

      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) {
           alert(`File ${file.name} is too large (max 20MB)`);
           continue;
        }
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        if (!isVideo && !isImage) continue;

        try {
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1]); 
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            newAttachments.push({
                type: isVideo ? 'video' : 'image',
                url: URL.createObjectURL(file),
                data: base64Data,
                mimeType: file.type
            });
        } catch (err) {
            console.error("Error reading file", err);
        }
      }
      setAttachments(prev => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      let finalMessage = input;
      if (activeMode === ChatMode.CONSULTATION && duration.trim()) {
          finalMessage += `\n\n[Patient Context - Symptom Duration: ${duration}]`;
      }
      
      // Pass metadata if image gen is intended
      const metadata = showMediaTools ? {
        aspectRatio: selectedRatio,
        imageSize: selectedSize
      } : {};
      
      onSendMessage(finalMessage, attachments);
      setInput('');
      setDuration('');
      setAttachments([]);
      setShowSuggestions(false);
      setShowMediaTools(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
      const isSimpleChip = CARE_CHIPS.includes(suggestion);
      const text = isSimpleChip ? `Find a ${suggestion} near me` : `Find a ${suggestion}`;
      setInput(text);
      setShowSuggestions(false);
      inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPlaceholder = () => {
      switch (activeMode) {
          case ChatMode.CONSULTATION: return "Describe your symptoms...";
          case ChatMode.FIND_CARE: return "Type specialist name...";
          case ChatMode.RESEARCH: return "Search medical topics...";
          default: return "Type your message...";
      }
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4 pb-6 relative z-30">
      <div className="max-w-4xl mx-auto">
        {activeMode === ChatMode.FIND_CARE && !input.trim() && !attachments.length && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                {CARE_CHIPS.slice(0, 5).map(chip => (
                    <button
                        key={chip}
                        onClick={() => handleSuggestionClick(chip)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-medium whitespace-nowrap hover:bg-emerald-100 transition-colors shadow-sm"
                    >
                        {chip}
                    </button>
                ))}
            </div>
        )}

        {showSuggestions && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 w-full px-4 mb-2 z-50">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-2 flex flex-col gap-1 max-h-56 overflow-y-auto animate-in slide-in-from-bottom-2">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Medical Care Suggestions</div>
                        {suggestions.map((s, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSuggestionClick(s)}
                                className="text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl text-slate-600 text-sm flex items-center justify-between group transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <Search className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                                    <span className="font-medium">{s}</span>
                                </div>
                                <Sparkles className="w-3 h-3 text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {attachments.length > 0 && (
            <div className="flex gap-3 mb-3 overflow-x-auto pb-2">
                {attachments.map((att, idx) => (
                    <div key={idx} className="relative group shrink-0">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                            {att.type === 'video' ? (
                                <Film className="w-8 h-8 text-slate-400" />
                            ) : (
                                <img src={att.url} alt="preview" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <button 
                            onClick={() => removeAttachment(idx)}
                            className="absolute -top-1.5 -right-1.5 bg-white text-slate-500 rounded-full p-0.5 shadow-md border border-slate-100 hover:text-red-500"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        )}

        <div className="flex flex-col gap-3">
            {showMediaTools && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-1 animate-in zoom-in-95 duration-200">
                    <div className="flex flex-wrap gap-6">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Layout className="w-3 h-3" /> Aspect Ratio
                            </p>
                            <div className="flex gap-2">
                                {ASPECT_RATIOS.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setSelectedRatio(r)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedRatio === r ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Maximize className="w-3 h-3" /> Resolution (Imagen)
                            </p>
                            <div className="flex gap-2 mb-4">
                                {IMAGE_SIZES.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSelectedSize(s)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedSize === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setInput(prev => `/image ${prev}`)}
                                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100 hover:bg-blue-100 flex items-center gap-2"
                                >
                                    <ImageIcon className="w-4 h-4" /> AI Visualization
                                </button>
                                <button
                                    onClick={() => setInput(prev => `/video ${prev}`)}
                                    className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100 hover:bg-indigo-100 flex items-center gap-2"
                                >
                                    <Film className="w-4 h-4" /> Veo Simulation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*,video/*" 
                    multiple 
                    onChange={handleFileSelect}
                    disabled={isLoading}
                />
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0"
                        title="Attach image or video"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setShowMediaTools(!showMediaTools)}
                        disabled={isLoading}
                        className={`p-3 rounded-xl transition-colors shrink-0 ${showMediaTools ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                        title="AI Image/Video Tools"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="relative flex-1 group">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={getPlaceholder()}
                        className={`w-full pl-5 pr-14 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 placeholder-slate-400 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isLoading}
                    />
                    
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <div className="relative">
                            {isListening && (
                                <>
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20 animate-ping"></span>
                                    <span className="absolute -inset-1 rounded-full bg-red-100 opacity-50 animate-pulse"></span>
                                </>
                            )}
                            <button
                                onClick={toggleListening}
                                disabled={isLoading}
                                className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${
                                    isListening 
                                    ? 'bg-red-50 text-red-600 scale-110' 
                                    : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600'
                                }`}
                            >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                        </div>
                        {isLoading && (
                            <div className="flex gap-1 p-2">
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleSend}
                    disabled={(!input.trim() && !attachments.length) || isLoading}
                    className={`h-[58px] w-[58px] flex items-center justify-center rounded-2xl transition-all duration-300 shadow-lg ${
                        (!input.trim() && !attachments.length) || isLoading
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:shadow-blue-200 hover:scale-105 active:scale-95'
                    }`}
                >
                    {isLoading ? <Sparkles className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
            </div>

            {activeMode === ChatMode.CONSULTATION && (
                 <div className="relative animate-in slide-in-from-top-2 duration-300">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Clock className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Symptom Duration (e.g., '2 days', 'since this morning')"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all text-slate-700 placeholder-slate-400"
                    />
                 </div>
            )}
        </div>
      </div>
      <div className="max-w-4xl mx-auto mt-2 text-center flex flex-col gap-1">
        <p className="text-xs text-slate-400">
           Dr. AI is an AI. In emergencies, call 911 immediately.
        </p>
        <p className="text-[10px] text-slate-300 uppercase tracking-widest font-semibold">
            Developed by Muhammad Aneeq Ur Rehman
        </p>
      </div>
    </div>
  );
};