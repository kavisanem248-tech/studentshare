import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookOpen, Trash2, Download, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { Material } from '../types';
import { MaterialCard } from '../components/MaterialCard';
import { PdfViewerModal } from '../components/PdfViewerModal';

export const SavedMaterialsPage: React.FC = () => {
  const [savedMaterials, setSavedMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const res = await api.getSavedMaterials();
      if (res?.data) {
        setSavedMaterials(res.data);
      }
    } catch (err) {
      console.error('Failed to load saved materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleBookmarkToggle = (materialId: string, isSaved: boolean) => {
    if (!isSaved) {
      setSavedMaterials((prev) => prev.filter((m) => m.id !== materialId));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-amber-500 fill-amber-400" />
          Saved Bookmarks & Course Notes
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Study materials you have pinned for quick revision and midterm exam prep
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : savedMaterials.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Bookmarked Materials Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you discover high-value course notes or exam papers, click the bookmark icon to keep them saved here.
          </p>
          <Link
            to="/materials"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <BookOpen className="w-4 h-4" />
            Explore Curriculum Materials
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedMaterials.map((mat) => (
            <MaterialCard
              key={mat.id}
              material={mat}
              onBookmarkToggle={handleBookmarkToggle}
              onPreviewClick={(m) => setPreviewMaterial(m)}
            />
          ))}
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
