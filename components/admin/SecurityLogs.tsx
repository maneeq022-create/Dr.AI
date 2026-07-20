import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format } from 'date-fns';

export const SecurityLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, 'adminLogs'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <div className="text-slate-400 animate-pulse flex h-64 items-center justify-center">Loading logs...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Security & Admin Logs</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-medium">Time</th>
              <th className="px-6 py-4 font-medium">Admin</th>
              <th className="px-6 py-4 font-medium">Action</th>
              <th className="px-6 py-4 font-medium">Target User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  {log.timestamp ? format(log.timestamp.toDate(), 'MMM dd, HH:mm:ss') : 'Unknown'}
                </td>
                <td className="px-6 py-4 font-medium text-blue-400">{log.adminEmail}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded font-mono text-xs">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400">{log.targetUserId || '-'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
