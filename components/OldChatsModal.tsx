import React, { useEffect, useState } from 'react';
import { X, Clock, ChevronRight, MessageSquare, Trash2 } from 'lucide-react';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AuthUser, SavedChat, Message } from '../types';

interface OldChatsModalProps {
  onClose: () => void;
  user: AuthUser;
  onSelectChat: (messages: Message[]) => void;
}

export const OldChatsModal: React.FC<OldChatsModalProps> = ({ onClose, user, onSelectChat }) => {
  const [chats, setChats] = useState<SavedChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const chatsRef = collection(db, 'users', user.uid, 'saved_chats');
        const q = query(chatsRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        
        const fetchedChats = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          timestamp: doc.data().timestamp?.toDate() || new Date()
        })) as SavedChat[];
        
        setChats(fetchedChats);
      } catch (e) {
        console.error("Error fetching chats", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'saved_chats', id));
      setChats(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error("Error deleting chat", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Old Chats (Saved from Doctor AI)</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
          {isLoading ? (
            <div className="flex justify-center items-center h-full text-slate-400">Loading your history...</div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
              <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
              <p>You have no saved chats.</p>
              <p className="text-sm mt-2 opacity-80">When you start a new chat, your current chat can be saved here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chats.map(chat => (
                <div 
                  key={chat.id} 
                  onClick={() => {
                    onSelectChat(chat.messages);
                    onClose();
                  }}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate">{chat.title || 'Consultation'}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(chat.timestamp).toLocaleString()} • {chat.messages.length} messages
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleDelete(e, chat.id)} 
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete saved chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
