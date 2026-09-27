import React from 'react';
import { X, Download, Bookmark, FileText } from 'lucide-react';
import { Material } from '../types';
import { api } from '../services/api';
import { DocumentReader } from './DocumentReader';

interface PdfViewerModalProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onDownloadTriggered?: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  material,
  isOpen,
  onClose,
  onDownloadTriggered,
}) => {
  if (!isOpen || !material) return null;

  const previewUrl = api.getPreviewUrl(material.id);
  const downloadUrl = api.getDownloadUrl(material.id);

  const handleDownload = () => {
    onDownloadTriggered?.();
    window.open(downloadUrl, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 rounded-3xl w-full max-w-6xl h-[94vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden">
        {/* Modal Top Strip */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 text-white flex items-center justify-between gap-4 border-b border-slate-800 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-lg">
              {material.title}
            </h3>
            <p className="text-xs text-slate-400 truncate flex items-center gap-2">
              <span className="text-indigo-400 font-medium">{material.subject}</span>
              <span>•</span>
              <span>Uploaded by {material.uploaderName || 'Student'}</span>
              <span>•</span>
              <span className="uppercase font-mono text-[11px] text-slate-500">
                {material.fileType} ({formatFileSize(material.fileSize)})
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Separate Download button */}
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            {/* Close Modal button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real Document Reader Component */}
        <div className="flex-1 overflow-hidden">
          <DocumentReader
            material={material}
            previewUrl={previewUrl}
            onDownload={handleDownload}
            className="h-full rounded-none border-none shadow-none"
          />
        </div>
      </div>
    </div>
  );
};
