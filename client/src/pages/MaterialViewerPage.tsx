import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Bookmark,
  AlertCircle,
  FileText,
  User,
  BookOpen,
  Share2,
} from 'lucide-react';
import { api } from '../services/api';
import { Material } from '../types';
import { useAuth } from '../context/AuthContext';
import { DocumentReader } from '../components/DocumentReader';

export const MaterialViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadMaterial() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await api.getMaterialById(id);
        if (res?.data) {
          setMaterial(res.data);
          setIsSaved(res.data.isSaved || false);
        }
      } catch (err) {
        console.error('Failed to load material for preview:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMaterial();
  }, [id]);

  const handleDownload = () => {
    if (!material) return;
    // Explicit file download
    window.open(api.getDownloadUrl(material.id), '_blank');
  };

  const handleBookmarkToggle = async () => {
    if (!material) return;
    if (!isAuthenticated) {
      alert('Please log in to save materials to your bookmarks.');
      navigate('/login');
      return;
    }
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
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-10 max-w-7xl mx-auto space-y-4 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-2xl" />
        <div className="h-[78vh] bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Document Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested study material does not exist or may have been restricted.
        </p>
        <Link
          to="/materials"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Materials
        </Link>
      </div>
    );
  }

  const previewUrl = api.getPreviewUrl(material.id);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto py-2">
      {/* Required Header Layout:
          [ ← Back ]   [ Title / Subject / Uploader / File Info ]   [ Save ] [ Download ] */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Back button and Metadata */}
        <div className="flex items-start sm:items-center gap-3.5">
          <Link
            to={`/materials/${material.id}`}
            className="p-2 sm:px-3 sm:py-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold border border-slate-200 flex-shrink-0"
            title="Back to material details"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div className="space-y-1">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight line-clamp-1">
              {material.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                Subject: {material.subject}
              </span>

              <span className="flex items-center gap-1 text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Uploaded by: <strong className="text-slate-800">{material.uploaderName || 'Student'}</strong></span>
              </span>

              <span className="text-slate-300">•</span>

              <span className="font-mono uppercase text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {material.fileType} ({formatFileSize(material.fileSize)})
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Action Controls [ Save ] [ Download ] */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
          <button
            onClick={handleCopyLink}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition text-xs font-semibold flex items-center gap-1.5"
            title="Share document link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          {/* Save / Bookmark Button */}
          <button
            onClick={handleBookmarkToggle}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              isSaved
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          {/* Explicit Manual Download Button */}
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            title="Explicitly download the file to your system"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Main Document Reader UI */}
      <DocumentReader
        material={material}
        previewUrl={previewUrl}
        onDownload={handleDownload}
      />
    </div>
  );
};
