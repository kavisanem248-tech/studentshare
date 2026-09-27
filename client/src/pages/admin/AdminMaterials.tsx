import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Trash2, Eye, CheckCircle2, XCircle, Search, Download } from 'lucide-react';
import { api } from '../../services/api';
import { Material } from '../../types';
import { PdfViewerModal } from '../../components/PdfViewerModal';

export const AdminMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewMat, setPreviewMat] = useState<Material | null>(null);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminMaterials();
      if (res?.data) {
        setMaterials(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleToggleApproval = async (id: string, currentApproved: boolean) => {
    try {
      await api.toggleMaterialApproval(id, !currentApproved);
      fetchMaterials();
    } catch (err: any) {
      alert(err.message || 'Failed to update approval status.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Permanently remove "${title}" from server storage and database?`)) return;

    try {
      await api.deleteAdminMaterial(id);
      fetchMaterials();
    } catch (err: any) {
      alert(err.message || 'Failed to delete material.');
    }
  };

  const filtered = materials.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase()) ||
      (m.uploaderName && m.uploaderName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Curriculum Courseware Moderation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review uploaded student notes, check syllabus conformity, and manage visibility
          </p>
        </div>

        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, subject..."
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
                  <th className="px-6 py-3.5">Document Title</th>
                  <th className="px-6 py-3.5">Subject & Unit</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Author</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Stats</th>
                  <th className="px-6 py-3.5 text-right">Moderator Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((m) => {
                  const isApproved = Boolean(m.isApproved);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900 max-w-xs">
                        <Link
                          to={`/materials/${m.id}`}
                          className="hover:text-indigo-600 line-clamp-1"
                        >
                          {m.title}
                        </Link>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">
                          {m.fileType} • {(m.fileSize / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="font-semibold text-slate-800">{m.subject}</span>
                        <span className="text-slate-400 block text-[10px]">{m.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{m.department}</td>
                      <td className="px-6 py-4 text-slate-600">{m.uploaderName || 'Student'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isApproved ? 'Approved' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <span>📥 {m.downloadCount}</span> • <span>⭐ {m.averageRating}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewMat(m)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleApproval(m.id, isApproved)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                              isApproved
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {isApproved ? 'Hide' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleDelete(m.id, m.title)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PdfViewerModal
        material={previewMat}
        isOpen={!!previewMat}
        onClose={() => setPreviewMat(null)}
      />
    </div>
  );
};
