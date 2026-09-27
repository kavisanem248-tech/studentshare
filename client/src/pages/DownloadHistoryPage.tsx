import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, Download, BookOpen, ExternalLink, Calendar, FileText } from 'lucide-react';
import { api } from '../services/api';

export const DownloadHistoryPage: React.FC = () => {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.getDownloadHistory();
        if (res?.data) {
          setDownloads(res.data);
        }
      } catch (err) {
        console.error('Failed to load downloads:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-indigo-600" />
          Download History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete log of study materials downloaded for offline revision
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : downloads.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Download className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Download Activity Recorded</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Whenever you download a note or question bank from StudentShare, your download record will appear here.
            </p>
            <Link
              to="/materials"
              className="inline-block mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
            >
              Browse Study Materials
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Study Material</th>
                  <th className="px-6 py-3.5">Subject</th>
                  <th className="px-6 py-3.5">Uploader</th>
                  <th className="px-6 py-3.5">File Specs</th>
                  <th className="px-6 py-3.5">Downloaded At</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {downloads.map((item) => (
                  <tr key={item.download_id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <Link
                        to={`/materials/${item.material_id}`}
                        className="hover:text-indigo-600 flex items-center gap-2 group"
                      >
                        <FileText className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition flex-shrink-0" />
                        <span className="line-clamp-1">{item.title}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                        {item.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{item.uploader_name}</td>
                    <td className="px-6 py-4 text-slate-500 uppercase font-mono">
                      {item.file_type} • {formatFileSize(item.file_size)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(item.downloaded_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={api.getDownloadUrl(item.material_id)}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-lg font-medium text-slate-700 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Re-download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
