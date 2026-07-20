import React, { useState, useEffect } from 'react';
import { checkIsAdmin } from '../../services/firebase';
import { LayoutDashboard, Users, CreditCard, Settings, BarChart3, Bell, LifeBuoy, Shield, LogOut } from 'lucide-react';
import { AuthUser } from '../../types';
import { DashboardOverview } from './DashboardOverview';
import { UserManagement } from './UserManagement';
import { FeatureControl } from './FeatureControl';
import { Payments } from './Payments';
import { Analytics } from './Analytics';
import { Announcements } from './Announcements';
import { SupportTickets } from './SupportTickets';
import { SecurityLogs } from './SecurityLogs';

interface AdminPanelProps {
  user: AuthUser;
  onExit: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user, onExit }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    checkIsAdmin(user.email).then(setIsAdmin);
  }, [user.email]);

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Verifying Access...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4 text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-6">You do not have authorization to view this area.</p>
        <button onClick={onExit} className="px-6 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-700">Return to App</button>
      </div>
    );
  }

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'features', label: 'Features', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'support', label: 'Support', icon: LifeBuoy },
    { id: 'logs', label: 'Logs', icon: Shield },
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-900 p-4 flex flex-col">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
             <h2 className="font-bold text-white leading-tight">Admin Console</h2>
             <p className="text-[10px] text-slate-500">Dr. AI Secure System</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
        
        <div className="pt-4 border-t border-slate-800">
          <button onClick={onExit} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" /> Exit Admin
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-950">
         <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && <DashboardOverview />}
            {activeTab === 'users' && <UserManagement adminEmail={user.email!} />}
            {activeTab === 'payments' && <Payments />}
            {activeTab === 'features' && <FeatureControl adminEmail={user.email!} />}
            {activeTab === 'analytics' && <Analytics />}
            {activeTab === 'announcements' && <Announcements adminEmail={user.email!} />}
            {activeTab === 'support' && <SupportTickets adminEmail={user.email!} />}
            {activeTab === 'logs' && <SecurityLogs />}
         </div>
      </div>
    </div>
  );
};
