import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, BrainCircuit, Map, ExternalLink, Copy, Check, Link2, Volume2, Dog, Baby, HeartPulse, UserCircle2, ClipboardList } from 'lucide-react';
import { Message, ChatMode } from '../types';

interface MessageBubbleProps {
  message: Message;
  onFillForm: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onFillForm }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  
  // Helper to determine border color based on mode for AI messages
  const getModeStyles = () => {
    if (isUser) return 'bg-blue-600 text-white rounded-br-none';
    
    switch (message.mode) {
      case ChatMode.CONSULTATION:
        return 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none shadow-sm';
      case ChatMode.VET:
        return 'bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 text-slate-800 dark:text-amber-100 rounded-bl-none shadow-sm';
      case ChatMode.PEDIATRIC:
        return 'bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 text-slate-800 dark:text-rose-100 rounded-bl-none shadow-sm';
      case ChatMode.ELDERLY:
        return 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-slate-900 dark:text-indigo-100 rounded-bl-none shadow-sm font-medium'; // removed text-lg as it will be managed globally
      case ChatMode.PREGNANCY:
        return 'bg-pink-50 dark:bg-pink-900/30 border border-pink-100 dark:border-pink-800 text-slate-800 dark:text-pink-100 rounded-bl-none shadow-sm';
      case ChatMode.FIND_CARE:
        return 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 text-slate-800 dark:text-emerald-100 rounded-bl-none shadow-sm';
      case ChatMode.RESEARCH:
        return 'bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 text-slate-800 dark:text-violet-100 rounded-bl-none shadow-sm';
      default:
        return 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100';
    }
  };

  const ModeIcon = () => {
    if (isUser) return <User className="w-5 h-5 text-blue-100" />;
    switch (message.mode) {
        case ChatMode.CONSULTATION: return <Bot className="w-6 h-6 text-blue-600" />;
        case ChatMode.VET: return <Dog className="w-6 h-6 text-amber-600" />;
        case ChatMode.PEDIATRIC: return <Baby className="w-6 h-6 text-rose-600" />;
        case ChatMode.ELDERLY: return <UserCircle2 className="w-6 h-6 text-indigo-600" />;
        case ChatMode.PREGNANCY: return <HeartPulse className="w-6 h-6 text-pink-600" />;
        case ChatMode.FIND_CARE: return <Map className="w-6 h-6 text-emerald-600" />;
        case ChatMode.RESEARCH: return <BrainCircuit className="w-6 h-6 text-violet-600" />;
    }
    return <Bot />;
  };

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(message.text);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} group/bubble`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${isUser ? 'bg-blue-700' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'}`}>
          <ModeIcon />
        </div>

        {/* Bubble Container */}
        <div className={`flex flex-col gap-2 relative min-w-[200px]`}>
            {/* Thinking Indicator State */}
            {message.isThinking && !isUser && (
                <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full w-fit border border-amber-100 animate-pulse mb-1">
                    <BrainCircuit className="w-3 h-3" />
                    <span>Thinking...</span>
                </div>
            )}

            {/* Attachments Display */}
            {message.attachments && message.attachments.length > 0 && (
                <div className={`flex flex-wrap gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {message.attachments.map((att, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 bg-black/5 max-w-[200px]">
                            {att.type === 'video' ? (
                                <video src={att.url} controls className="max-h-48 w-auto" />
                            ) : (
                                <img src={att.url} alt="attachment" className="max-h-48 w-auto object-cover" />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Text Bubble */}
            {message.text && (
                <div className={`p-5 rounded-2xl ${getModeStyles()} leading-relaxed relative`}>
                    <ReactMarkdown 
                        components={{
                            ul: ({node, ...props}) => <ul className="list-disc ml-4 my-2 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal ml-4 my-2 space-y-1" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            a: ({node, ...props}) => <a className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300" target="_blank" rel="noopener noreferrer" {...props} />,
                        }}
                    >
                        {message.text}
                    </ReactMarkdown>

                    {/* Copy & Speak Buttons */}
                    {!isUser && !message.isThinking && (
                        <div className={`absolute top-2 right-2 flex gap-1 transition-all duration-200 ${copied ? 'opacity-100' : 'opacity-0 group-hover/bubble:opacity-100'}`}>
                            <button 
                                onClick={speak}
                                className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-700"
                                title="Listen to response"
                            >
                                <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={handleCopy}
                                className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-700"
                                title="Copy to clipboard"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Patient Form Action */}
            {!isUser && message.text?.includes('Patient Information Form') && (
                <div className="mt-2 bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg text-white">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-blue-900">Dr. AI Form Required</p>
                            <p className="text-xs text-blue-700/70">Help me provide a better diagnosis.</p>
                        </div>
                    </div>
                    <button 
                      onClick={onFillForm}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase shadow-lg active:scale-95 transition-transform"
                    >
                        Fill Form
                    </button>
                </div>
            )}

            {/* Research Mode Source Cards */}
            {!isUser && message.mode === ChatMode.RESEARCH && message.groundingMetadata?.searchChunks && message.groundingMetadata.searchChunks.length > 0 && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {message.groundingMetadata.searchChunks.map((chunk, idx) => {
                        let domain = '';
                        try {
                            domain = new URL(chunk.uri).hostname.replace('www.', '');
                        } catch (e) { domain = 'source'; }
                        
                        return (
                            <a 
                                key={idx} 
                                href={chunk.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col gap-1 p-3 bg-white border border-violet-100 rounded-xl hover:border-violet-300 hover:shadow-md transition-all group/card"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs font-bold text-violet-600 uppercase tracking-wide truncate">{domain}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-300 group-hover/card:text-violet-500" />
                                </div>
                                <span className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed">
                                    {chunk.title}
                                </span>
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Default / Other Mode Sources (Simple Pills) */}
            {!isUser && message.mode !== ChatMode.RESEARCH && message.groundingMetadata?.searchChunks && message.groundingMetadata.searchChunks.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-2">
                    {message.groundingMetadata.searchChunks.map((chunk, idx) => (
                        <a 
                            key={idx} 
                            href={chunk.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                        >
                            <Link2 className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{chunk.title || 'Source'}</span>
                        </a>
                    ))}
                </div>
            )}
             
            {/* Timestamp */}
            <span className={`text-[10px] text-slate-400 font-medium mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
      </div>
    </div>
  );
};