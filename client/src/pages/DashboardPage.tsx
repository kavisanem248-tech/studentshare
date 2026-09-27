import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Upload,
  Bookmark,
  History,
  Users,
  Star,
  Download,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Material, CircleSummary } from '../types';
import { MaterialCard } from '../components/MaterialCard';
import { PdfViewerModal } from '../components/PdfViewerModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([]);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [uploadCount, setUploadCount] = useState<number>(0);
  const [myCircles, setMyCircles] = useState<CircleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [materialsRes, savedRes, downloadsRes, uploadsRes, circlesRes] = await Promise.all([
          api.getMaterials({ limit: 4, sort: 'newest' }),
          api.getSavedMaterials(),
          api.getDownloadHistory(),
          api.getMyUploads(),
          api.getMyCircles(),
        ]);

        if (materialsRes?.data) setRecentMaterials(materialsRes.data);
        if (savedRes?.data) setSavedCount(savedRes.data.length);
        if (downloadsRes?.data) setDownloadCount(downloadsRes.data.length);
        if (uploadsRes?.data) setUploadCount(uploadsRes.data.length);
        if (circlesRes?.data) setMyCircles(circlesRes.data);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 text-white p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Student Academic Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Student'}! 👋
            </h1>
            <p className="text-sm text-indigo-100 leading-relaxed">
              {user?.department || 'Computer Science & Engineering'} • {user?.year || 'Academic Year'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/upload"
              className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              Upload Material
            </Link>
            <Link
              to="/circles"
              className="px-4 py-2.5 bg-indigo-900/60 hover:bg-indigo-900/80 text-white font-semibold text-xs rounded-xl border border-indigo-400/30 transition flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              Friend Circles
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Link
          to="/my-uploads"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Uploads</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{uploadCount}</p>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">Shared materials →</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
            <Upload className="w-5 h-5" />
          </div>
        </Link>

        <Link
          to="/saved-materials"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bookmarked</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{savedCount}</p>
            <p className="text-[11px] text-amber-600 font-medium mt-1">Saved study notes →</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
            <Bookmark className="w-5 h-5" />
          </div>
        </Link>

        <Link
          to="/download-history"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Downloaded</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{downloadCount}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Offline history →</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
            <Download className="w-5 h-5" />
          </div>
        </Link>

        <Link
          to="/circles"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Circles</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{myCircles.length}</p>
            <p className="text-[11px] text-purple-600 font-medium mt-1">Active study groups →</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
            <Users className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* Main Grid: Recent Community Uploads + Friend Circles Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Course Uploads */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Recent Community Uploads</h2>
            </div>
            <Link
              to="/materials"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Browse all library <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-56 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentMaterials.map((mat) => (
                <MaterialCard
                  key={mat.id}
                  material={mat}
                  onPreviewClick={(m) => setPreviewMaterial(m)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Friend Circles Quick Box */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">My Friend Circles</h2>
            </div>
            <Link
              to="/circles"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View all
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            {myCircles.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p>You haven't joined any circles yet.</p>
                <Link
                  to="/circles"
                  className="mt-2 inline-block text-xs font-bold text-indigo-600 hover:underline"
                >
                  Create or join a circle →
                </Link>
              </div>
            ) : (
              myCircles.slice(0, 4).map((c) => (
                <Link
                  key={c.id}
                  to={`/circles/${c.id}`}
                  className="block p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{c.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {c.member_count} members • {c.material_count} shared notes
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                      {c.role}
                    </span>
                  </div>
                </Link>
              ))
            )}

            <div className="pt-2 border-t border-slate-100">
              <Link
                to="/circles"
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                Create or Join New Circle
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      <PdfViewerModal
        material={previewMaterial}
        isOpen={!!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
      />
    </div>
  );
};
