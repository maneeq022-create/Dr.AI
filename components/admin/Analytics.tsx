import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState({ free: 0, trial: 0, premium: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        let free = 0, trial = 0, premium = 0;

        snapshot.forEach(doc => {
          const status = doc.data().subscriptionStatus;
          if (status === 'premium') premium++;
          else if (status === 'trial') trial++;
          else free++;
        });

        setStats({ free, trial, premium });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-slate-400 animate-pulse flex h-64 items-center justify-center">Loading analytics...</div>;

  const pieData = [
    { name: 'Free Users', value: stats.free, color: '#64748b' },
    { name: 'Trial Users', value: stats.trial, color: '#f59e0b' },
    { name: 'Premium Users', value: stats.premium, color: '#8b5cf6' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Platform Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">User Distribution</h2>
          <div className="h-64 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
