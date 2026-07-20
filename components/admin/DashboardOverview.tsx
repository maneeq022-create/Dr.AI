import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Users, UserPlus, DollarSign, Activity, MessageSquare } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, isAfter } from 'date-fns';

export const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    trialUsers: 0,
    premiumUsers: 0,
    todaySignups: 0,
    totalConsultations: 0,
    revenueMonth: 0,
    revenueYear: 0
  });
  const [chartData, setChartData] = useState<{ date: string; users: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        
        let total = 0, free = 0, trial = 0, premium = 0, today = 0;
        const now = new Date();
        const startOfToday = startOfDay(now);
        
        const last30Days = Array.from({ length: 30 }).map((_, i) => ({
           date: format(subDays(now, 29 - i), 'MMM dd'),
           users: 0
        }));

        snapshot.forEach(doc => {
          const data = doc.data();
          total++;
          
          if (data.subscriptionStatus === 'premium') premium++;
          else if (data.subscriptionStatus === 'trial') trial++;
          else free++;

          const createdAt = data.createdAt?.toDate();
          if (createdAt) {
             if (isAfter(createdAt, startOfToday)) {
                 today++;
             }
             const dayStr = format(createdAt, 'MMM dd');
             const dayIndex = last30Days.findIndex(d => d.date === dayStr);
             if (dayIndex !== -1) {
                 last30Days[dayIndex].users++;
             }
          }
        });

        let runningTotal = total - snapshot.docs.filter(d => {
            const date = d.data().createdAt?.toDate();
            return date && date >= subDays(now, 30);
        }).length;

        const finalChartData = last30Days.map(day => {
            runningTotal += day.users;
            return { date: day.date, users: runningTotal };
        });

        setStats(prev => ({
           ...prev,
           totalUsers: total,
           freeUsers: free,
           trialUsers: trial,
           premiumUsers: premium,
           todaySignups: today,
        }));
        setChartData(finalChartData);

      } catch (error) {
        console.error("Error fetching admin dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div className="text-slate-400 animate-pulse flex h-64 items-center justify-center">Loading statistics...</div>;
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'New Today', value: stats.todaySignups, icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Premium Users', value: stats.premiumUsers, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Revenue (Month)', value: `$${stats.revenueMonth}`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
         <div className="col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-4">User Growth (Last 30 Days)</h2>
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                     <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                     <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                        itemStyle={{ color: '#3b82f6' }}
                     />
                     <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4">User Breakdown</h2>
            <div className="flex-1 flex flex-col justify-center gap-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                     <span className="text-slate-300">Free Users</span>
                  </div>
                  <span className="text-white font-bold">{stats.freeUsers}</span>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                     <span className="text-slate-300">Trial Users</span>
                  </div>
                  <span className="text-white font-bold">{stats.trialUsers}</span>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                     <span className="text-slate-300">Premium Users</span>
                  </div>
                  <span className="text-white font-bold">{stats.premiumUsers}</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
