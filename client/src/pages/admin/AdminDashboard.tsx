import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  BookOpen,
  Download,
  Flag,
  Folders,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { AdminStats } from '../../types';

export const AdminDashboard: React.FC = () => {
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
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-400">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Academic Administration Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Institutional Oversight & Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Monitor academic content quality, manage student user accounts, and resolve copyright/content moderation queues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/reports"
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Flag className="w-4 h-4" />
            Review Reports ({stats?.pendingReports || 0})
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : stats?.totalUsers || 0}
          </p>
          <Link to="/admin/users" className="text-[11px] text-indigo-600 font-medium hover:underline mt-1 block">
            Manage directory →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Materials</span>
            <BookOpen className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : stats?.totalMaterials || 0}
          </p>
          <Link to="/admin/materials" className="text-[11px] text-indigo-600 font-medium hover:underline mt-1 block">
            Review library →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Downloads</span>
            <Download className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : stats?.totalDownloads || 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Platform transactions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Friend Circles</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {loading ? '...' : stats?.totalCircles || 0}
          </p>
          <Link to="/admin/circles" className="text-[11px] text-indigo-600 font-medium hover:underline mt-1 block">
            Manage circles →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Pending Reports</span>
            <Flag className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-2">
            {loading ? '...' : stats?.pendingReports || 0}
          </p>
          <Link to="/admin/reports" className="text-[11px] text-rose-700 font-bold hover:underline mt-1 block">
            Action reports →
          </Link>
        </div>
      </div>

      {/* Tables Preview: Recent Users & Recent Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Uploads */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Recent Materials Published</h3>
            <Link to="/admin/materials" className="text-xs text-indigo-600 font-semibold hover:underline">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.recentMaterials?.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{m.title}</h4>
                  <p className="text-[11px] text-slate-500">
                    {m.subject} • By {m.uploader_name}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(m.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Student Signups */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Recent Student Registrations</h3>
            <Link to="/admin/users" className="text-xs text-indigo-600 font-semibold hover:underline">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.recentUsers?.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{u.name}</h4>
                  <p className="text-[11px] text-slate-500">{u.email}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {u.role}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
