import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Bookmark,
  Star,
  Flag,
  Share2,
  Calendar,
  Building,
  GraduationCap,
  Eye,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Shield,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { Material } from '../types';
import { useAuth } from '../context/AuthContext';
import { RatingDialog } from '../components/RatingDialog';
import { ReportDialog } from '../components/ReportDialog';
import { PdfViewerModal } from '../components/PdfViewerModal';
import { AiAssistantCard } from '../components/AiAssistantCard';

export const MaterialDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);

  // Dialogs
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    async function loadMaterial() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await api.getMaterialById(id);
        if (res?.data) {
          setMaterial(res.data);
          setIsSaved(res.data.isSaved || false);
          setDownloadCount(res.data.downloadCount || 0);
        }
      } catch (err) {
        console.error('Failed to load material:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMaterial();
  }, [id]);

  const handleSaveToggle = async () => {
    if (!material) return;
    if (!isAuthenticated) {
      alert('Please sign in to save materials to your bookmarks.');
      navigate('/login');
      return;
    }

    setIsSaving(true);
    try {
      if (isSaved) {
        await api.unsaveMaterial(material.id);
        setIsSaved(false);
      } else {
        await api.saveMaterial(material.id);
        setIsSaved(true);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating bookmark');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!material) return;
    window.open(api.getDownloadUrl(material.id), '_blank');
    setDownloadCount((prev) => prev + 1);
  };

  const handleRatingSuccess = (avgRating: number, count: number) => {
    if (material) {
      setMaterial({
        ...material,
        averageRating: avgRating,
        ratingCount: count,
      });
    }
  };

  if (loading) {
    return (
      <div className="py-12 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        <div className="h-48 bg-slate-200 rounded-3xl" />
        <div className="h-72 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Study Material Not Found</h2>
        <p className="text-xs text-slate-500">The requested document might have been removed by its author or moderator.</p>
        <Link
          to="/materials"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse Library
        </Link>
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Back button */}
      <div>
        <Link
          to="/materials"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Materials Library
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            {/* Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {material.subject}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {material.materialType}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                {material.unit}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {material.title}
            </h1>

            <p className="text-sm font-semibold text-indigo-600">
              Curriculum Topic: {material.topic}
            </p>

            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              {material.description || 'Verified course study notes prepared for semester examinations and lab coursework.'}
            </p>

            {/* Tags */}
            {material.tags && material.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {material.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-medium bg-slate-50 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action CTA Block - View is primary, Download is separate explicit action */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-60 flex-shrink-0">
            <Link
              to={`/materials/${material.id}/view`}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View / Read Document
            </Link>

            <button
              onClick={() => setShowPreviewModal(true)}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl border border-indigo-200 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Open In-App Viewer
            </button>

            <button
              onClick={handleDownload}
              className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-xs transition flex items-center justify-center gap-2"
              title="Explicit file download"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Download Document
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleSaveToggle}
                disabled={isSaving}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  isSaved
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </button>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    alert('Please log in to rate study materials.');
                    navigate('/login');
                  } else {
                    setShowRatingDialog(true);
                  }
                }}
                className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                Rate
              </button>
            </div>

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  alert('Please log in to submit a material report.');
                  navigate('/login');
                } else {
                  setShowReportDialog(true);
                }
              }}
              className="text-[11px] text-slate-400 hover:text-rose-600 font-medium py-1 transition flex items-center justify-center gap-1 mt-1"
            >
              <Flag className="w-3 h-3" />
              Report this material
            </button>
          </div>
        </div>

        {/* Metadata Footer Strip */}
        <div className="pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Academic Department</span>
            <span className="font-semibold text-slate-800">{material.department}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Year & Semester</span>
            <span className="font-semibold text-slate-800">
              {material.year} • {material.semester}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">File Specifications</span>
            <span className="font-semibold text-slate-800 uppercase font-mono">
              {material.fileType} • {formatFileSize(material.fileSize)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Overall Rating</span>
            <div className="flex items-center gap-1 text-amber-600 font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{material.averageRating > 0 ? material.averageRating.toFixed(1) : 'New'}</span>
              <span className="text-slate-400 font-normal">({material.ratingCount} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Section (Section 26 AI-Ready Architecture) */}
      <AiAssistantCard materialId={material.id} materialTitle={material.title} />

      {/* Uploader Card & Student Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Uploader Profile */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Uploaded By
          </h3>
          <div className="flex items-center gap-3">
            <img
              src={
                material.uploaderAvatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${material.uploaderName || 'Student'}`
              }
              alt={material.uploaderName}
              className="w-12 h-12 rounded-full border border-indigo-200 object-cover"
            />
            <div>
              <h4 className="font-bold text-sm text-slate-900">{material.uploaderName}</h4>
              <p className="text-xs text-slate-500">{material.uploaderDept || 'College Scholar'}</p>
            </div>
          </div>

          <div className="text-xs text-slate-500 pt-3 border-t border-slate-100 space-y-1">
            <p>
              Shared on:{' '}
              <strong className="text-slate-700">
                {new Date(material.createdAt).toLocaleDateString()}
              </strong>
            </p>
            <p>
              Total Downloads:{' '}
              <strong className="text-slate-700">{downloadCount} times</strong>
            </p>
          </div>
        </div>

        {/* Right 2 cols: Reviews list */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Student Reviews & Feedback ({material.reviews?.length || 0})
            </h3>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  alert('Please sign in to rate.');
                  navigate('/login');
                } else {
                  setShowRatingDialog(true);
                }
              }}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Write a review →
            </button>
          </div>

          {!material.reviews || material.reviews.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No written reviews yet. Be the first to rate and review this study material!
            </div>
          ) : (
            <div className="space-y-4">
              {material.reviews.map((rev) => (
                <div key={rev.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{rev.user_name}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= rev.rating
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {rev.review && (
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.review}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <RatingDialog
        materialId={material.id}
        materialTitle={material.title}
        isOpen={showRatingDialog}
        onClose={() => setShowRatingDialog(false)}
        onRatingSuccess={handleRatingSuccess}
      />

      <ReportDialog
        materialId={material.id}
        materialTitle={material.title}
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        onReportSuccess={() => {}}
      />

      <PdfViewerModal
        material={material}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />
    </div>
  );
};
