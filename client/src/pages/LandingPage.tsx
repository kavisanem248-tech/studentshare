import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Upload,
  Users,
  ShieldCheck,
  Star,
  Download,
  ArrowRight,
  Sparkles,
  FileCheck,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import { Material } from '../types';
import { MaterialCard } from '../components/MaterialCard';
import { PdfViewerModal } from '../components/PdfViewerModal';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredMaterials, setFeaturedMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPreviewMaterial, setSelectedPreviewMaterial] = useState<Material | null>(null);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await api.getMaterials({ sort: 'highest_rated', limit: 6 });
        if (res?.data) {
          setFeaturedMaterials(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/materials?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const academicSubjects = [
    { name: 'Data Structures', color: 'from-blue-500/10 to-indigo-500/10 text-indigo-700 border-indigo-200' },
    { name: 'DBMS', color: 'from-emerald-500/10 to-teal-500/10 text-emerald-700 border-emerald-200' },
    { name: 'Operating Systems', color: 'from-purple-500/10 to-violet-500/10 text-purple-700 border-purple-200' },
    { name: 'Computer Networks', color: 'from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-200' },
    { name: 'Cyber Security', color: 'from-rose-500/10 to-red-500/10 text-rose-700 border-rose-200' },
    { name: 'Java Programming', color: 'from-cyan-500/10 to-blue-500/10 text-cyan-700 border-cyan-200' },
    { name: 'C Programming', color: 'from-slate-500/10 to-gray-500/10 text-slate-700 border-slate-200' },
    { name: 'Mathematics', color: 'from-fuchsia-500/10 to-pink-500/10 text-fuchsia-700 border-fuchsia-200' },
  ];

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 text-white px-6 py-16 sm:py-24 shadow-2xl">
        {/* Glow circles */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>The Premier Academic Material Sharing Network</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Find. Share. Learn.
          </h1>

          <p className="text-base sm:text-xl text-indigo-200 max-w-2xl mx-auto font-normal leading-relaxed">
            Access thousands of vetted college lecture notes, solved question banks, and lab manuals.
            Create private Friend Circles to collaborate with peer study groups.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto mt-8 flex flex-col sm:flex-row items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl"
          >
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject, topic, unit (e.g., AVL Trees, Normalization, OSI)..."
                className="w-full pl-11 pr-4 py-3 bg-transparent text-white placeholder-indigo-300/70 text-sm focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              Search
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick subject badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-indigo-300 font-semibold mr-1">Popular:</span>
            {academicSubjects.slice(0, 5).map((sub) => (
              <button
                key={sub.name}
                onClick={() => navigate(`/materials?subject=${encodeURIComponent(sub.name)}`)}
                className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 transition"
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative max-w-5xl mx-auto mt-16 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">100%</div>
            <div className="text-xs text-indigo-300 font-medium mt-1">Verified Peer Materials</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">8+</div>
            <div className="text-xs text-indigo-300 font-medium mt-1">Core Academic Subjects</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">Private</div>
            <div className="text-xs text-indigo-300 font-medium mt-1">Friend Circles</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">Instant</div>
            <div className="text-xs text-indigo-300 font-medium mt-1">Direct Download & Preview</div>
          </div>
        </div>
      </section>

      {/* Academic Disciplines Explorer */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Curriculum Catalog
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Explore Academic Disciplines
            </h2>
          </div>
          <Link
            to="/materials"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Browse all study notes <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {academicSubjects.map((sub) => (
            <button
              key={sub.name}
              onClick={() => navigate(`/materials?subject=${encodeURIComponent(sub.name)}`)}
              className={`p-4 rounded-2xl bg-gradient-to-br ${sub.color} border text-left hover:scale-[1.02] transition shadow-sm`}
            >
              <BookOpen className="w-5 h-5 mb-2 opacity-80" />
              <h3 className="font-bold text-sm line-clamp-1">{sub.name}</h3>
              <p className="text-[11px] opacity-75 mt-0.5">Explore notes & test questions →</p>
            </button>
          ))}
        </div>
      </section>

      {/* Featured High-Rated Materials */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Highest Rated Materials
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Top Student Summaries & Notes
            </h2>
          </div>
          <Link
            to="/materials?sort=highest_rated"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View all rated materials <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredMaterials.map((mat) => (
              <MaterialCard
                key={mat.id}
                material={mat}
                onPreviewClick={(m) => setSelectedPreviewMaterial(m)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Value Pillars Section */}
      <section className="bg-slate-100/80 rounded-3xl p-8 sm:p-12 border border-slate-200 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            Engineered For Students
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Why Students Rely On StudentShare
          </h2>
          <p className="text-sm text-slate-600">
            A secure, modern academic environment replacing chaotic chat groups with structured course materials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Private Friend Circles</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Create password-protected study circles for your project team or batch. Share materials,
              post announcements, and collaborate in complete privacy with persistent membership.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">AI-Ready Study Tools</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Built-in architecture for instantaneous PDF summarization, question answering, and key
              concept extraction to power up your exam preparations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Academic Integrity & Safety</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every document is scanned with strict MIME and extension validation. Peer reviews, star
              ratings, and moderation reports keep the repository pristine and accurate.
            </p>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-indigo-600 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl">
        <h2 className="text-3xl sm:text-4xl font-extrabold max-w-xl mx-auto">
          Start Sharing and Learning with Your Peers Today
        </h2>
        <p className="text-sm sm:text-base text-indigo-100 max-w-lg mx-auto">
          Create your free account, upload your handwritten or typed study guides, and join private friend circles.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/register"
            className="px-6 py-3 bg-white text-indigo-600 hover:bg-slate-50 font-bold text-sm rounded-xl shadow-md transition"
          >
            Create Free Account
          </Link>
          <Link
            to="/materials"
            className="px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm rounded-xl transition border border-indigo-500"
          >
            Explore Library
          </Link>
        </div>
      </section>

      {/* PDF Modal */}
      <PdfViewerModal
        material={selectedPreviewMaterial}
        isOpen={!!selectedPreviewMaterial}
        onClose={() => setSelectedPreviewMaterial(null)}
      />
    </div>
  );
};
