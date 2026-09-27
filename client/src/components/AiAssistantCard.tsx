import React, { useState } from 'react';
import { Sparkles, MessageSquare, BookOpen, AlertCircle, Send, Check } from 'lucide-react';
import { api } from '../services/api';

interface AiAssistantCardProps {
  materialId: string;
  materialTitle: string;
}

export const AiAssistantCard: React.FC<AiAssistantCardProps> = ({
  materialId,
  materialTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'qa'>('summary');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    configured: boolean;
    summary?: string;
    keyPoints?: string[];
    message?: string;
  } | null>(null);

  const [question, setQuestion] = useState('');
  const [loadingQa, setLoadingQa] = useState(false);
  const [qaHistory, setQaHistory] = useState<Array<{ q: string; a: string; configured: boolean }>>([]);
  const [qaError, setQaError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.getAiSummary(materialId);
      setSummaryData(res);
    } catch (err: any) {
      setSummaryData({
        configured: false,
        message: err.message || 'AI feature is not configured.',
      });
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoadingQa(true);
    setQaError(null);

    const userQ = question.trim();
    setQuestion('');

    try {
      const res = await api.askAiQuestion(materialId, userQ);
      if (!res.configured) {
        setQaError(res.message || 'AI feature is not configured. Please supply AI_API_KEY in environment variables.');
        setQaHistory((prev) => [
          ...prev,
          {
            q: userQ,
            a: res.message || 'AI feature is not configured in this environment.',
            configured: false,
          },
        ]);
      } else {
        setQaHistory((prev) => [
          ...prev,
          { q: userQ, a: res.answer || 'No response generated.', configured: true },
        ]);
      }
    } catch (err: any) {
      setQaError(err.message || 'AI request failed.');
    } finally {
      setLoadingQa(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 rounded-3xl border border-indigo-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              StudentShare AI Study Assistant
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                AI Ready
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Summarize concepts or ask clarifying academic questions from this material
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              activeTab === 'summary'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PDF Summary
          </button>
          <button
            onClick={() => setActiveTab('qa')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              activeTab === 'qa'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ask Questions
          </button>
        </div>
      </div>

      {activeTab === 'summary' ? (
        <div className="space-y-4">
          {!summaryData ? (
            <div className="text-center py-6 bg-white/70 rounded-2xl border border-indigo-50 p-6">
              <BookOpen className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600 max-w-sm mx-auto mb-4">
                Generate a fast high-yield summary of "{materialTitle}" highlighting core concepts and exam topics.
              </p>
              <button
                onClick={handleGenerateSummary}
                disabled={loadingSummary}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {loadingSummary ? 'Analyzing Material...' : 'Generate AI Summary'}
              </button>
            </div>
          ) : !summaryData.configured ? (
            /* Mandatory unconfigured message per Section 26 */
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">AI feature is not configured</h4>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  {summaryData.message || 'AI feature is not configured. To activate instant PDF summarization, configure the AI_API_KEY environment variable in server/.env.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-white rounded-2xl border border-indigo-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Executive Summary</h4>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{summaryData.summary}</p>
              {summaryData.keyPoints && (
                <div className="pt-2 border-t border-slate-100">
                  <h5 className="text-[11px] font-bold text-slate-800 mb-1.5">Key Exam Takeaways:</h5>
                  <ul className="space-y-1">
                    {summaryData.keyPoints.map((pt, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-3 p-3 bg-white/70 rounded-2xl border border-indigo-50">
            {qaHistory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Ask any question about this study material (e.g. "Explain the core theorem", "What are the prerequisites?").
              </p>
            ) : (
              qaHistory.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-end">
                    <span className="bg-indigo-600 text-white text-xs px-3.5 py-1.5 rounded-2xl rounded-tr-sm max-w-xs">
                      {item.q}
                    </span>
                  </div>
                  <div className="flex justify-start">
                    <span
                      className={`text-xs px-3.5 py-2 rounded-2xl rounded-tl-sm max-w-md ${
                        item.configured
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.a}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAskQuestion} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about this material..."
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
            <button
              type="submit"
              disabled={loadingQa || !question.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Ask</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
