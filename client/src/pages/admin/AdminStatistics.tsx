import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, BookOpen, Download, Flag, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { AdminStats } from '../../types';

export const AdminStatistics: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.getAdminStats();
        if (res?.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          Academic Analytics & Usage Insights
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed metrics on student engagement, resource download velocities, and knowledge exchanges
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Content Consumption
          </span>
          <p className="text-3xl font-extrabold text-slate-900">{stats?.totalDownloads || 0}</p>
          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> High student download velocity
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Registered Scholars
          </span>
          <p className="text-3xl font-extrabold text-slate-900">{stats?.totalUsers || 0}</p>
          <p className="text-xs text-indigo-600 font-medium">Verified active college peers</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Peer Study Circles
          </span>
          <p className="text-3xl font-extrabold text-slate-900">{stats?.totalCircles || 0}</p>
          <p className="text-xs text-purple-600 font-medium">Secured collaborative spaces</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900">Platform Health & Reliability</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 block">Database Status</span>
            <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-4 h-4" /> Operational (LibSQL / SQLite)
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 block">Object Storage</span>
            <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-4 h-4" /> Operational (Verified Files)
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 block">Authentication Service</span>
            <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-4 h-4" /> JWT + Role Authorization
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 block">Moderation Backlog</span>
            <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-1">
              {stats?.pendingReports || 0} items pending
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
