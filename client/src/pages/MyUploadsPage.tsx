import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Edit, Trash2, Download, Eye, Plus, Star, AlertCircle, X } from 'lucide-react';
import { api } from '../services/api';
import { Material } from '../types';

export const MyUploadsPage: React.FC = () => {
  const [uploads, setUploads] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const res = await api.getMyUploads();
      if (res?.data) {
        setUploads(res.data);
      }
    } catch (err) {
      console.error('Failed to load uploads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }

    try {
      await api.deleteMaterial(id);
      setUploads((prev) => prev.filter((m) => m.id !== id));
      alert('Study material deleted.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete material.');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    setIsSubmitting(true);
    setEditError(null);

    try {
      await api.updateMaterial(editingMaterial.id, {
        title: editingMaterial.title,
        subject: editingMaterial.subject,
        topic: editingMaterial.topic,
        description: editingMaterial.description,
        materialType: editingMaterial.materialType,
        unit: editingMaterial.unit,
      });

      alert('Material details updated successfully!');
      setEditingMaterial(null);
      fetchUploads();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update material.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            My Uploaded Study Materials
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your contributions to the StudentShare academic library
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Upload New Material
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : uploads.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">You Haven't Uploaded Any Materials Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Help your fellow students by publishing lecture notes, problem sets, or exam guides.
            </p>
            <Link
              to="/upload"
              className="inline-block mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
            >
              Upload Your First Document
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Title & Subject</th>
                  <th className="px-6 py-3.5">Topic & Unit</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Stats</th>
                  <th className="px-6 py-3.5">Upload Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {uploads.map((mat) => (
                  <tr key={mat.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 max-w-xs">
                      <Link
                        to={`/materials/${mat.id}`}
                        className="hover:text-indigo-600 line-clamp-1"
                      >
                        {mat.title}
                      </Link>
                      <span className="text-[11px] text-indigo-600 font-medium block mt-0.5">
                        {mat.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="font-medium">{mat.topic}</span>
                      <span className="text-slate-400 block text-[10px]">{mat.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {mat.materialType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-3">
                        <span title="Downloads">📥 {mat.downloadCount}</span>
                        <span title="Rating">⭐ {mat.averageRating > 0 ? mat.averageRating.toFixed(1) : 'New'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(mat.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/materials/${mat.id}`}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setEditingMaterial(mat)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mat.id, mat.title)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete"
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

      {/* Edit Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Edit Study Material Details</h3>
              <button
                onClick={() => setEditingMaterial(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 text-xs">{editError}</div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingMaterial.title}
                  onChange={(e) =>
                    setEditingMaterial({ ...editingMaterial, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={editingMaterial.subject}
                    onChange={(e) =>
                      setEditingMaterial({ ...editingMaterial, subject: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Topic</label>
                  <input
                    type="text"
                    required
                    value={editingMaterial.topic}
                    onChange={(e) =>
                      setEditingMaterial({ ...editingMaterial, topic: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingMaterial.description || ''}
                  onChange={(e) =>
                    setEditingMaterial({ ...editingMaterial, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
