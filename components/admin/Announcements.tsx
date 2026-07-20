import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Megaphone, Send } from 'lucide-react';
import { format } from 'date-fns';

interface AnnouncementsProps {
  adminEmail: string;
}

export const Announcements: React.FC<AnnouncementsProps> = ({ adminEmail }) => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setAnnouncements(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const recordLog = async (action: string) => {
    try {
      await addDoc(collection(db, 'adminLogs'), {
        adminEmail,
        action,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to log action", e);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        message,
        active: true,
        createdAt: serverTimestamp()
      });
      await recordLog('Posted global announcement');
      setMessage('');
      fetchAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'announcements', id), { active: !currentStatus });
      await recordLog(currentStatus ? 'Deactivated announcement' : 'Reactivated announcement');
      fetchAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-slate-400 animate-pulse flex h-64 items-center justify-center">Loading announcements...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Global Announcements</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-blue-500" /> Create New Announcement
        </h2>
        <div className="flex gap-4">
          <input 
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message to all users here..."
            className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={handleSend}
            disabled={!message.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" /> Send Now
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-medium">Message</th>
              <th className="px-6 py-4 font-medium">Sent On</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {announcements.map(ann => (
              <tr key={ann.id} className={`hover:bg-slate-800/30 transition-colors ${!ann.active ? 'opacity-50' : ''}`}>
                <td className="px-6 py-4 font-medium text-white">{ann.message}</td>
                <td className="px-6 py-4">
                  {ann.createdAt ? format(ann.createdAt.toDate(), 'MMM dd, yyyy HH:mm') : 'Unknown'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    ann.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {ann.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleToggleActive(ann.id, ann.active)}
                    className="text-blue-400 hover:text-blue-300 text-xs font-bold"
                  >
                    {ann.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {announcements.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No announcements history.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
