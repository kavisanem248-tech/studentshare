import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, KeyRound, ArrowRight, Shield, Layers, MessageSquare, BookOpen } from 'lucide-react';
import { api } from '../services/api';
import { CircleSummary } from '../types';
import { CreateCircleModal } from '../components/CreateCircleModal';
import { JoinCircleModal } from '../components/JoinCircleModal';

export const CirclesPage: React.FC = () => {
  const [circles, setCircles] = useState<CircleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const fetchCircles = async () => {
    setLoading(true);
    try {
      const res = await api.getMyCircles();
      if (res?.data) {
        setCircles(res.data);
      }
    } catch (err) {
      console.error('Failed to load circles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCircles();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Private Friend Circles
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Private, password-secured academic circles for peer study groups and project teams
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <KeyRound className="w-4 h-4 text-purple-600" />
            Join with Password
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Circle
          </button>
        </div>
      </div>

      {/* Grid of Joined Circles */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : circles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Friend Circles Joined Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create a password-protected study group for your friends, or join an existing circle using its secret password.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Join Circle
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
            >
              Create New Circle
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {circles.map((c) => (
            <Link
              key={c.id}
              to={`/circles/${c.id}`}
              className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl hover:border-purple-300 transition duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      c.role === 'OWNER'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    }`}
                  >
                    {c.role}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 group-hover:text-purple-600 transition line-clamp-1">
                  {c.name}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                  {c.description || 'Private academic group for peer study sessions and material exchanges.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span>👥 {c.member_count} members</span>
                  <span>📄 {c.material_count} notes</span>
                </div>

                <span className="text-purple-600 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                  Enter <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateCircleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchCircles()}
      />

      <JoinCircleModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoinSuccess={() => fetchCircles()}
      />
    </div>
  );
};
