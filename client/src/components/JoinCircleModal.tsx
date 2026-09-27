import React, { useState } from 'react';
import { Users, X, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface JoinCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess: (circleId: string) => void;
}

export const JoinCircleModal: React.FC<JoinCircleModalProps> = ({
  isOpen,
  onClose,
  onJoinSuccess,
}) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      setError('Please provide both Circle Name and Password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.joinCircle({
        name: name.trim(),
        password: password.trim(),
      });
      alert(res.message || 'Joined circle successfully!');
      onJoinSuccess(res.circleId);
      onClose();
      navigate(`/circles/${res.circleId}`);
    } catch (err: any) {
      if (err.circleId) {
        alert('You are already an active member of this circle! Opening your circle now...');
        onClose();
        navigate(`/circles/${err.circleId}`);
      } else {
        setError(err.message || 'Failed to join circle. Please verify name and password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Join Private Friend Circle</h3>
              <p className="text-xs text-slate-500">Enter exact circle name and password to join</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Exact Circle Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DSA Masters & LeetCode Squad"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Circle Access Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password provided by circle owner..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Tip for demo testing: Try joining "DBMS & Systems Explorers" with password "StudySquad2026".
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? 'Verifying...' : 'Verify & Join Circle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
