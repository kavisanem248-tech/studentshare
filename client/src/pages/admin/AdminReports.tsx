import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flag, CheckCircle2, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { ReportItem } from '../../types';

export const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminReports();
      if (res?.data) {
        setReports(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.updateReportStatus(id, newStatus);
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Failed to update report status.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'REVIEWED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACTIONED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'DISMISSED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Flag className="w-6 h-6 text-rose-600" />
          Reported Study Materials & Content Queue
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review peer reports regarding incorrect formulas, duplicate lecture notes, copyright, or spam
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800">Moderation Queue is Clear</h3>
            <p>No unresolved material flags currently pending administrator review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Reported Document</th>
                  <th className="px-6 py-3.5">Reason Category</th>
                  <th className="px-6 py-3.5">Student Feedback / Notes</th>
                  <th className="px-6 py-3.5">Reporter</th>
                  <th className="px-6 py-3.5">Current Status</th>
                  <th className="px-6 py-3.5 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 max-w-xs">
                      <Link
                        to={`/materials/${rep.material_id}`}
                        className="hover:text-indigo-600 line-clamp-1 flex items-center gap-1.5"
                      >
                        <span>{rep.material_title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      </Link>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Author: {rep.uploader_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                        {rep.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs">
                      <p className="line-clamp-2">{rep.details || 'No additional explanation given.'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span>{rep.reporter_name}</span>
                      <span className="text-[10px] text-slate-400 block">{rep.reporter_email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                          rep.status
                        )}`}
                      >
                        {rep.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={rep.status}
                        onChange={(e) => handleStatusChange(rep.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="REVIEWED">REVIEWED</option>
                        <option value="ACTIONED">ACTIONED</option>
                        <option value="DISMISSED">DISMISSED</option>
                      </select>
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
