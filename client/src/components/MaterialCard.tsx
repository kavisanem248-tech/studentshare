import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Bookmark,
  Star,
  Eye,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Material } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface MaterialCardProps {
  material: Material;
  onBookmarkToggle?: (materialId: string, isSaved: boolean) => void;
  onPreviewClick?: (material: Material) => void;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onBookmarkToggle,
  onPreviewClick,
}) => {
  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState<boolean>(material.isSaved || false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [downloadCount, setDownloadCount] = useState<number>(material.downloadCount);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert('Please log in to save materials to your bookmarks.');
      return;
    }

    setIsSaving(true);
    try {
      if (isSaved) {
        await api.unsaveMaterial(material.id);
        setIsSaved(false);
        onBookmarkToggle?.(material.id, false);
      } else {
        await api.saveMaterial(material.id);
        setIsSaved(true);
        onBookmarkToggle?.(material.id, true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update bookmark');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      window.open(api.getDownloadUrl(material.id), '_blank');
      setDownloadCount((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'notes':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'question bank':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'lab manual':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cheat sheet':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'presentation':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Badges & Bookmark */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {material.subject}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeColor(
                material.materialType
              )}`}
            >
              {material.materialType}
            </span>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
              {material.unit}
            </span>
          </div>

          <button
            onClick={handleSaveToggle}
            disabled={isSaving}
            className={`p-2 rounded-xl border transition ${
              isSaved
                ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                : 'text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
            }`}
            title={isSaved ? 'Remove bookmark' : 'Bookmark this material'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <Link to={`/materials/${material.id}`} className="block group-hover:text-indigo-600 transition">
          <h3 className="font-semibold text-base text-slate-900 line-clamp-2 leading-snug">
            {material.title}
          </h3>
        </Link>

        {/* Topic & Academic Metadata */}
        <p className="text-xs text-indigo-600 font-medium mt-1 truncate">
          Topic: {material.topic}
        </p>

        <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
          {material.description || 'Verified course study material prepared for semester examinations.'}
        </p>

        {/* Department / Semester pill */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
          <span className="truncate">{material.department}</span>
          <span>•</span>
          <span className="whitespace-nowrap">{material.semester}</span>
        </div>
      </div>

      {/* Footer Area */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {/* Rating and Downloads */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-amber-600 font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{material.averageRating > 0 ? material.averageRating.toFixed(1) : 'New'}</span>
            {material.ratingCount > 0 && (
              <span className="text-[10px] text-slate-400 font-normal">({material.ratingCount})</span>
            )}
          </div>

          <div className="flex items-center gap-1 text-slate-500" title="Downloads">
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>{downloadCount}</span>
          </div>

          <span className="text-[10px] text-slate-400 uppercase font-mono">
            {material.fileType} • {formatFileSize(material.fileSize)}
          </span>
        </div>

        {/* Action Buttons: View is primary, Download is separate */}
        <div className="flex items-center gap-1.5">
          <Link
            to={`/materials/${material.id}/view`}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-semibold rounded-lg flex items-center gap-1 transition"
            title="View document in reader"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px]">View</span>
          </Link>

          <button
            onClick={handleDownload}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
            title="Download document file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
