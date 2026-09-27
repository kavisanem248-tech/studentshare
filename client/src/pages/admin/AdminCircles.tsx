import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Trash2, ArrowRight, Shield, Calendar, Lock } from 'lucide-react';
import { api } from '../../services/api';

export const AdminCircles: React.FC = () => {
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCircles = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminCircles();
      if (res?.data) {
        setCircles(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCircles();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete circle "${name}"? All member associations will be erased.`)) return;

    try {
      await api.deleteAdminCircle(id);
      fetchCircles();
    } catch (err: any) {
      alert(err.message || 'Failed to delete circle.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-600" />
          Friend Circles Administration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor all active peer study groups, member counts, and platform circle health
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : circles.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No Friend Circles currently active in the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Circle Name & Description</th>
                  <th className="px-6 py-3.5">Circle Owner</th>
                  <th className="px-6 py-3.5">Members</th>
                  <th className="px-6 py-3.5">Shared Notes</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {circles.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 max-w-xs">
                      <Link
                        to={`/circles/${c.id}`}
                        className="hover:text-purple-600 font-bold block"
                      >
                        {c.name}
                      </Link>
                      <span className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                        {c.description || 'No description provided.'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="font-semibold text-slate-800">{c.owner_name}</span>
                      <span className="text-[10px] text-slate-400 block">{c.owner_email}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{c.member_count} members</td>
                    <td className="px-6 py-4 text-slate-600">{c.material_count} notes</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/circles/${c.id}`}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold rounded-lg transition"
                        >
                          Inspect
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete circle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
