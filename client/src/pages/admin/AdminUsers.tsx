import React, { useState, useEffect } from 'react';
import { Users, Shield, UserX, UserCheck, Search, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers();
      if (res?.data) {
        setUsersList(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBan = async (id: string, currentBanned: boolean) => {
    const action = currentBanned ? 'unban' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      await api.toggleUserBan(id, !currentBanned);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleRoleChange = async (id: string, currentRole: 'STUDENT' | 'ADMIN') => {
    const nextRole = currentRole === 'ADMIN' ? 'STUDENT' : 'ADMIN';
    if (!window.confirm(`Change this user's role to ${nextRole}?`)) return;

    try {
      await api.updateUserRole(id, nextRole);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const filtered = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            User Management Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage student registrations, administrative permissions, and account suspensions
          </p>
        </div>

        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user or department..."
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Student / Faculty</th>
                  <th className="px-6 py-3.5">Department & Year</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Uploads</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5">Joined</th>
                  <th className="px-6 py-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isBanned = Boolean(u.is_banned);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}
                          alt={u.name}
                          className="w-8 h-8 rounded-full border border-indigo-200 object-cover"
                        />
                        <div>
                          <span className="font-semibold text-slate-900 block">{u.name}</span>
                          <span className="text-[11px] text-slate-400">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span>{u.department || 'N/A'}</span>
                        <span className="text-slate-400 block text-[10px]">{u.year || ''}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-semibold">{u.upload_count}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isBanned
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isBanned ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isSelf && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRoleChange(u.id, u.role)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] transition"
                            >
                              {u.role === 'ADMIN' ? 'Make Student' : 'Make Admin'}
                            </button>
                            <button
                              onClick={() => handleToggleBan(u.id, isBanned)}
                              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition ${
                                isBanned
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              }`}
                            >
                              {isBanned ? 'Re-activate' : 'Suspend'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
