import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, BookOpen, RotateCcw, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { api } from '../services/api';
import { Material } from '../types';
import { MaterialCard } from '../components/MaterialCard';
import { FilterBar } from '../components/FilterBar';
import { PdfViewerModal } from '../components/PdfViewerModal';

export const MaterialsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  // Filter states
  const q = searchParams.get('q') || '';
  const department = searchParams.get('department') || 'All';
  const year = searchParams.get('year') || 'All';
  const semester = searchParams.get('semester') || 'All';
  const unit = searchParams.get('unit') || 'All';
  const materialType = searchParams.get('materialType') || 'All';
  const subject = searchParams.get('subject') || 'All';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      if (q.trim()) {
        const res = await api.searchMaterials({
          q: q.trim(),
          department,
          year,
          semester,
          unit,
          materialType,
          sort,
          page,
          limit: 9,
        });
        setMaterials(res.data);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      } else {
        const res = await api.getMaterials({
          department,
          year,
          semester,
          unit,
          materialType,
          subject: subject !== 'All' ? subject : undefined,
          sort,
          page,
          limit: 9,
        });
        setMaterials(res.data);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [searchParams]);

  const updateParam = (newParams: Record<string, string | undefined>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === undefined || v === 'All' || v === '') {
        updated.delete(k);
      } else {
        updated.set(k, v);
      }
    });
    // Reset to page 1 on filter change
    if (!newParams.page) {
      updated.set('page', '1');
    }
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam({ q: searchInput.trim() });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="space-y-6">
      {/* Title & Search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Curriculum Library
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse verified lecture notes, solved papers, and lab manuals across departments
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, subject, topic, or tags..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-xs"
            />
          </div>
        </form>
      </div>

      {/* Filter Component */}
      <FilterBar
        department={department}
        year={year}
        semester={semester}
        unit={unit}
        materialType={materialType}
        sort={sort}
        onFilterChange={(filters) => updateParam(filters)}
        onReset={handleResetFilters}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800">{materials.length}</strong> of{' '}
          <strong className="text-slate-800">{total}</strong> study materials
          {q && (
            <span>
              {' '}
              matching "<strong className="text-indigo-600">{q}</strong>"
            </span>
          )}
        </span>
        {subject !== 'All' && (
          <span className="text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            Subject: {subject}
          </span>
        )}
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center mx-auto">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Study Materials Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No study documents match your active query or filter criteria. Try adjusting your search keywords or resetting filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((mat) => (
            <MaterialCard
              key={mat.id}
              material={mat}
              onPreviewClick={(m) => setPreviewMaterial(m)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => updateParam({ page: String(Math.max(1, page - 1)) })}
            disabled={page <= 1}
            className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold text-slate-700 px-3 py-1 bg-white border border-slate-200 rounded-xl">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => updateParam({ page: String(Math.min(totalPages, page + 1)) })}
            disabled={page >= totalPages}
            className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preview Modal */}
      <PdfViewerModal
        material={previewMaterial}
        isOpen={!!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
      />
    </div>
  );
};
