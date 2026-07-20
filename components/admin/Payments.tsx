import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { CreditCard, Search } from 'lucide-react';
import { format } from 'date-fns';

export const Payments: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Assuming we have a transactions collection
        const txRef = collection(db, 'transactions');
        const q = query(txRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const txList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(txList);
      } catch (e) {
        console.error('Error fetching transactions:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) return <div className="text-slate-400 animate-pulse flex h-64 items-center justify-center">Loading payments...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-white">Subscription & Payments</h1>
        <div className="flex items-center gap-2">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl flex items-center gap-2 font-bold">
            <CreditCard className="w-5 h-5" /> Safepay History
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-medium">User Email</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Plan</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">{tx.email || 'Unknown'}</td>
                <td className="px-6 py-4 font-medium text-white">${tx.amount?.toFixed(2) || '0.00'}</td>
                <td className="px-6 py-4 capitalize">{tx.plan || 'N/A'}</td>
                <td className="px-6 py-4">
                  {tx.createdAt ? format(tx.createdAt.toDate(), 'MMM dd, yyyy HH:mm') : 'Unknown'}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    tx.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                    tx.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {tx.status || 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No payment transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
