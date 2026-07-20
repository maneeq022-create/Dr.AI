import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Search, Filter, Shield, ShieldOff, Trash2, ArrowUpCircle } from 'lucide-react';
import { format } from 'date-fns';

interface UserManagementProps {
  adminEmail: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({ adminEmail }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const recordLog = async (action: string, targetUserId: string) => {
    try {
      await addDoc(collection(db, 'adminLogs'), {
        adminEmail,
        action,
        targetUserId,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to log action", e);
    }
  };

  const handleUpgrade = async (userId: string) => {
    if (window.confirm("Manually upgrade this user to premium?")) {
       try {
           await updateDoc(doc(db, 'users', userId), { subscriptionStatus: 'premium' });
           await recordLog('Upgraded user to premium', userId);
           fetchUsers();
       } catch (e) { console.error(e); }
    }
  };

  const handleSuspend = async (userId: string, isSuspended: boolean) => {
     if (window.confirm(`Are you sure you want to ${isSuspended ? 'unsuspend' : 'suspend'} this user?`)) {
       try {
           await updateDoc(doc(db, 'users', userId), { isSuspended: !isSuspended });
           await recordLog(isSuspended ? 'Unsuspended user' : 'Suspended user', userId);
           fetchUsers();
       } catch (e) { console.error(e); }
     }
  };

  const handleDelete = async (userId: string) => {
     if (window.confirm("WARNING: This will permanently delete the user data. Proceed?")) {
        try {
           await deleteDoc(doc(db, 'users', userId));
           await recordLog('Deleted user', userId);
           fetchUsers();
        } catch (e) { console.error(e); }
     }
  };

  const filteredUsers = users.filter(u => {
      const matchSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = filterStatus === 'all' || u.subscriptionStatus === filterStatus;
      return matchSearch && matchFilter;
  });

  if (loading) return <div className="text-slate-400 animate-pulse flex h-64 items-center justify-center">Loading users...</div>;

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          
          <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                   type="text"
                   placeholder="Search by name or email..."
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-blue-500 w-64"
                />
             </div>
             
             <div className="relative">
                <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                   value={filterStatus}
                   onChange={e => setFilterStatus(e.target.value)}
                   className="bg-slate-900 border border-slate-700 text-white pl-10 pr-8 py-2 rounded-xl focus:outline-none focus:border-blue-500 appearance-none"
                >
                   <option value="all">All Status</option>
                   <option value="free">Free</option>
                   <option value="trial">Trial</option>
                   <option value="premium">Premium</option>
                </select>
             </div>
          </div>
       </div>

       <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
             <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
                <tr>
                   <th className="px-6 py-4 font-medium">Name & Email</th>
                   <th className="px-6 py-4 font-medium">Signup Date</th>
                   <th className="px-6 py-4 font-medium">Status</th>
                   <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-800">
                {filteredUsers.map(user => (
                   <tr key={user.id} className={`hover:bg-slate-800/30 transition-colors ${user.isSuspended ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                         <div className="font-medium text-white">{user.name} {user.isSuspended && '(Suspended)'}</div>
                         <div className="text-slate-500 text-xs">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                         {user.createdAt ? format(user.createdAt.toDate(), 'MMM dd, yyyy') : 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            user.subscriptionStatus === 'premium' ? 'bg-purple-500/20 text-purple-400' :
                            user.subscriptionStatus === 'trial' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-500/20 text-slate-400'
                         }`}>
                            {user.subscriptionStatus || 'free'}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                            {user.subscriptionStatus !== 'premium' && (
                               <button onClick={() => handleUpgrade(user.id)} className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors" title="Set to Premium">
                                  <ArrowUpCircle className="w-4 h-4" />
                               </button>
                            )}
                            <button onClick={() => handleSuspend(user.id, user.isSuspended)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors" title={user.isSuspended ? "Unsuspend User" : "Suspend User"}>
                               {user.isSuspended ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete User">
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </td>
                   </tr>
                ))}
                {filteredUsers.length === 0 && (
                   <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                         No users found matching your criteria.
                      </td>
                   </tr>
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
};
