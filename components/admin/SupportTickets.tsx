import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface SupportTicketsProps {
  adminEmail: string;
}

export const SupportTickets: React.FC<SupportTicketsProps> = ({ adminEmail }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setTickets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
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

  const handleResolve = async (id: string) => {
    try {
      await updateDoc(doc(db, 'supportTickets', id), { status: 'resolved' });
      await recordLog(`Resolved support ticket: ${id}`);
      fetchTickets();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-slate-400 animate-pulse flex h-64 items-center justify-center">Loading tickets...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Support Tickets</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-medium">User Email</th>
              <th className="px-6 py-4 font-medium">Message</th>
              <th className="px-6 py-4 font-medium">Submitted</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {tickets.map(ticket => (
              <tr key={ticket.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{ticket.email}</td>
                <td className="px-6 py-4 max-w-md truncate">{ticket.message}</td>
                <td className="px-6 py-4">
                  {ticket.createdAt ? format(ticket.createdAt.toDate(), 'MMM dd, yyyy') : 'Unknown'}
                </td>
                <td className="px-6 py-4">
                  {ticket.status === 'resolved' ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold"><CheckCircle className="w-3 h-3"/> Resolved</span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400 text-xs font-bold"><Clock className="w-3 h-3"/> Pending</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {ticket.status !== 'resolved' && (
                    <button 
                      onClick={() => handleResolve(ticket.id)}
                      className="text-blue-400 hover:text-blue-300 text-xs font-bold"
                    >
                      Mark Resolved
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No support tickets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
