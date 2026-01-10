import React, { useState, KeyboardEvent, useEffect, useRef, ChangeEvent } from 'react';
import { Send, Sparkles, Mic, MicOff, Clock, Search, Paperclip, X, Image as ImageIcon, Film } from 'lucide-react';
import { ChatMode, Attachment } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  activeMode: ChatMode;
}

const CARE_CHIPS = [
    "General Practitioner",
    "Cardiologist",
    "Dermatologist",
    "Pediatrician",
    "Dentist",
    "Urgent Care",
    "Pharmacy",
    "Eye Doctor",
    "Neurologist",
    "Orthopedist"
];

const SEARCH_SUFFIXES = [
    "near me",
    "accepting new patients",
    "for children",
    "specializing in surgery",
    "open now"
];

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, activeMode }) => {
  const [input, setInput] = useState('');
  const [duration, setDuration] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
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

  // Handle Autocomplete Logic
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
        // Basic validation
        if (file.size > 20 * 1024 * 1024) { // 20MB limit
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
                    // Extract base64 part
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
      // Reset input so same file can be selected again if needed
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
      
      onSendMessage(finalMessage, attachments);
      setInput('');
      setDuration('');
      setAttachments([]);
      setShowSuggestions(false);
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
        
        {/* Chips */}
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

        {/* Autocomplete */}
        {showSuggestions && (
            <div className="absolute bottom-[calc(100%-10px)] left-0 w-full px-4 mb-2 pointer-events-none">
                <div className="max-w-4xl mx-auto pointer-events-auto">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                        <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Suggestions</div>
                        {suggestions.map((s, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSuggestionClick(s)}
                                className="text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 text-sm flex items-center gap-2 group"
                            >
                                <Search className="w-3 h-3 text-slate-400" />
                                <span>{s}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Attachment Previews */}
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
            {/* Main Input Row */}
            <div className="flex items-center gap-3">
                
                {/* File Upload Button */}
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*,video/*" 
                    multiple 
                    onChange={handleFileSelect}
                    disabled={isLoading}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0"
                    title="Attach image or video"
                >
                    <Paperclip className="w-5 h-5" />
                </button>

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

            {/* Symptom Duration (Consultation Only) */}
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
            Created by AI Master
        </p>
      </div>
    </div>
  );
};