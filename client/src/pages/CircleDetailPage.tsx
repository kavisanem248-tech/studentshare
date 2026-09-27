import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Lock,
  LogOut,
  Trash2,
  KeyRound,
  FileText,
  Megaphone,
  Plus,
  Shield,
  UserX,
  ArrowLeft,
  Download,
  Eye,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';
import { CircleDetail, Material } from '../types';
import { useAuth } from '../context/AuthContext';
import { PdfViewerModal } from '../components/PdfViewerModal';

export const CircleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [circle, setCircle] = useState<CircleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'announcements' | 'members'>('materials');

  // Modals / forms state
  const [showShareModal, setShowShareModal] = useState(false);
  const [userUploads, setUserUploads] = useState<Material[]>([]);
  const [selectedShareMatId, setSelectedShareMatId] = useState('');

  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCircleDetails(id);
      if (res?.data) {
        setCircle(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Access denied. You might not be a member of this private circle.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Load user uploads when sharing modal opens
  const openShareModal = async () => {
    setShowShareModal(true);
    try {
      const res = await api.getMyUploads();
      if (res?.data) {
        setUserUploads(res.data);
        if (res.data.length > 0) {
          setSelectedShareMatId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedShareMatId) return;

    try {
      await api.shareCircleMaterial(id, selectedShareMatId);
      alert('Material shared with your circle members!');
      setShowShareModal(false);
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to share material.');
    }
  };

  const handleRemoveMaterial = async (materialId: string) => {
    if (!id) return;
    if (!window.confirm('Remove this study material from the circle?')) return;

    try {
      await api.removeCircleMaterial(id, materialId);
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to remove material.');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !annTitle.trim() || !annContent.trim()) return;

    try {
      await api.createAnnouncement(id, {
        title: annTitle.trim(),
        content: annContent.trim(),
      });
      alert('Announcement posted to the circle!');
      setShowAnnounceModal(false);
      setAnnTitle('');
      setAnnContent('');
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to post announcement.');
    }
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    if (!id) return;
    if (!window.confirm('Delete this announcement?')) return;

    try {
      await api.deleteAnnouncement(id, annId);
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to delete announcement.');
    }
  };

  const handleLeaveCircle = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to leave this Friend Circle? You will lose access immediately.')) {
      return;
    }

    try {
      await api.leaveCircle(id);
      alert('You have left the Friend Circle.');
      navigate('/circles');
    } catch (err: any) {
      alert(err.message || 'Failed to leave circle.');
    }
  };

  const handleDeleteCircle = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to permanently delete this circle for all members? This action is irreversible.')) {
      return;
    }

    try {
      await api.deleteCircle(id);
      alert('Circle deleted successfully.');
      navigate('/circles');
    } catch (err: any) {
      alert(err.message || 'Failed to delete circle.');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newPassword.trim()) return;

    try {
      await api.updateCirclePassword(id, newPassword.trim());
      alert('Circle password updated. Existing members maintain access; new joiners must use the new password.');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err: any) {
      alert(err.message || 'Failed to update password.');
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!id) return;
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this circle?`)) {
      return;
    }

    try {
      await api.removeCircleMember(id, userId);
      alert(`${memberName} has been removed.`);
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member.');
    }
  };

  if (loading) {
    return (
      <div className="py-12 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="h-72 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  // Section 14: Private Circle Security Check Error View
  if (error || !circle) {
    return (
      <div className="py-16 max-w-lg mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Private Friend Circle Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error || 'This circle is private. You must be an authorized member with persistent database membership to view circle notes and announcements.'}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to="/circles"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            Join with Password
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = circle.myRole === 'OWNER';

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div>
        <Link
          to="/circles"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Friend Circles
        </Link>
      </div>

      {/* Circle Banner Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30">
                Private Friend Circle
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                Your Role: {circle.myRole}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {circle.name}
            </h1>

            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed">
              {circle.description || 'Private peer study circle for collaborative semester revision.'}
            </p>

            <div className="flex items-center gap-2 pt-2 text-xs text-purple-200">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Owner: {circle.ownerName}</span>
              <span>•</span>
              <span>Created {new Date(circle.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap md:flex-col gap-2 flex-shrink-0">
            {isOwner ? (
              <>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition flex items-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4 text-amber-300" />
                  Change Password
                </button>
                <button
                  onClick={handleDeleteCircle}
                  className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold rounded-xl border border-rose-500/30 transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  Delete Circle
                </button>
              </>
            ) : (
              <button
                onClick={handleLeaveCircle}
                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold rounded-xl border border-rose-500/30 transition flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                Leave Circle
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'materials'
                ? 'bg-white text-indigo-950 shadow-md'
                : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            Shared Materials ({circle.materials.length})
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'announcements'
                ? 'bg-white text-indigo-950 shadow-md'
                : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Announcements ({circle.announcements.length})
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-white text-indigo-950 shadow-md'
                : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            Members ({circle.members.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Circle Materials */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Private Course Notes Shared in this Circle
            </h2>
            <button
              onClick={openShareModal}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Share Material Here
            </button>
          </div>

          {circle.materials.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Study Materials Shared Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Share any notes you uploaded with your circle members for private study collaboration.
              </p>
              <button
                onClick={openShareModal}
                className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                Share Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {circle.materials.map((mat) => (
                <div
                  key={mat.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        {mat.subject}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {mat.unit}
                      </span>
                    </div>

                    <Link to={`/materials/${mat.id}`}>
                      <h4 className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition line-clamp-2">
                        {mat.title}
                      </h4>
                    </Link>

                    <p className="text-xs text-slate-500 line-clamp-2">{mat.topic}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono uppercase">
                      {mat.fileType}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewMaterial(mat)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a
                        href={api.getDownloadUrl(mat.id)}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {(isOwner || mat.uploaderId === user?.id) && (
                        <button
                          onClick={() => handleRemoveMaterial(mat.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Unlink from circle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Circle Announcements & Notices</h2>
            <button
              onClick={() => setShowAnnounceModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Post Announcement
            </button>
          </div>

          {circle.announcements.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Megaphone className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Announcements Posted Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Post test dates, study session timings, or lab review agendas for circle members.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {circle.announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{ann.title}</h4>
                      <p className="text-[11px] text-slate-400">
                        Posted by <strong className="text-slate-600">{ann.author_name}</strong> on{' '}
                        {new Date(ann.created_at).toLocaleString()}
                      </p>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Members List */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Circle Members Directory ({circle.members.length})
          </h2>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Student Member</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                  {isOwner && <th className="px-6 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {circle.members.map((m) => (
                  <tr key={m.membership_id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img
                        src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${m.name}`}
                        alt={m.name}
                        className="w-8 h-8 rounded-full border border-indigo-200 object-cover"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 block">{m.name}</span>
                        <span className="text-[11px] text-slate-400">{m.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{m.department || 'Academic Scholar'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          m.role === 'OWNER'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {m.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(m.joined_at).toLocaleDateString()}
                    </td>
                    {isOwner && (
                      <td className="px-6 py-4 text-right">
                        {m.role !== 'OWNER' && (
                          <button
                            onClick={() => handleRemoveMember(m.user_id, m.name)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-lg transition"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Share Material Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Share Study Material to Circle</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {userUploads.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 space-y-3">
                <p>You haven't uploaded any study materials yet to share.</p>
                <Link
                  to="/upload"
                  className="inline-block px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl"
                >
                  Upload Material First
                </Link>
              </div>
            ) : (
              <form onSubmit={handleShareMaterial} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Your Uploaded Material
                  </label>
                  <select
                    value={selectedShareMatId}
                    onChange={(e) => setSelectedShareMatId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                  >
                    {userUploads.map((mat) => (
                      <option key={mat.id} value={mat.id}>
                        {mat.title} ({mat.subject})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
                  >
                    Share with Members
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Post Announcement Modal */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Post Circle Announcement</h3>
              <button
                onClick={() => setShowAnnounceModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Saturday 6PM Group Study Call"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Content</label>
                <textarea
                  required
                  rows={3}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Details for circle members..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Change Circle Join Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Join Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new circle password..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Existing members remain members. Any future new joiners must enter this new password.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Modal */}
      <PdfViewerModal
        material={previewMaterial}
        isOpen={!!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
      />
    </div>
  );
};
