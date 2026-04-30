"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/authContext';
import { apiRequest } from '../../api/api';
import { Lightbulb } from 'lucide-react';

const SENTIMENT_COLOR = { positive: 'text-green-600', neutral: 'text-yellow-600', negative: 'text-red-600' };

export default function AIRecommendationsPage() {
  const { state } = useAuth();
  const router = useRouter();
  const [surveys, setSurveys] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState(null);
  const [loadingSurveys, setLoadingSurveys] = useState(true);

  useEffect(() => {
    if (!state.loading && !state.isAuthenticated) router.push('/auth');
  }, [state.loading, state.isAuthenticated, router]);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    apiRequest({ method: 'GET', url: '/api/surveys/' })
      .then(data => setSurveys(data.results ?? data))
      .finally(() => setLoadingSurveys(false));
  }, [state.isAuthenticated]);

  const analyse = async () => {
    if (!selectedId) return;
    setAnalysing(true);
    setError('');
    setInsights(null);
    try {
      const result = await apiRequest({
        method: 'POST',
        url: '/api/ai/recommendations/',
        data: { survey_id: selectedId },
      });
      setInsights(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalysing(false);
    }
  };

  if (state.loading || loadingSurveys) {
    return <main className="main-container"><div className="grid-center"><p className="text-[var(--text-secondary)]">Loading…</p></div></main>;
  }

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">AI Recommendations</h1>
        <p className="text-[var(--text-secondary)] mb-8">Pick a survey and Gemini will analyse the responses and return actionable insights.</p>

        <div className="flex gap-3 mb-8 flex-wrap">
          <select
            value={selectedId}
            onChange={e => { setSelectedId(e.target.value); setInsights(null); setError(''); }}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition"
            style={{ minWidth: 200 }}
          >
            <option value="">Select a survey…</option>
            {surveys.map(s => (
              <option key={s.id} value={s.id}>{s.title} ({s.response_count ?? 0} responses)</option>
            ))}
          </select>
          <button
            onClick={analyse}
            disabled={!selectedId || analysing}
            className="px-6 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {analysing ? 'Analysing…' : <><Lightbulb size={14} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: 'text-bottom' }} />Analyse</>}
          </button>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-950 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {analysing && (
          <div className="text-center py-12 text-[var(--text-secondary)] animate-pulse">
            Gemini is analysing {surveys.find(s => String(s.id) === String(selectedId))?.title}…
          </div>
        )}

        {insights && !analysing && (
          <div className="flex flex-col gap-6">

            {/* Summary + sentiment */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h2 className="font-semibold text-[var(--text-main)]">Executive Summary</h2>
                {insights.sentiment && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border border-[var(--border)] capitalize ${SENTIMENT_COLOR[insights.sentiment] ?? 'text-[var(--text-secondary)]'}`}>
                    {insights.sentiment}
                  </span>
                )}
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{insights.summary}</p>
            </div>

            {/* Key findings */}
            {insights.key_findings?.length > 0 && (
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
                <h2 className="font-semibold text-[var(--text-main)] mb-3">Key Findings</h2>
                <ul className="flex flex-col gap-2">
                  {insights.key_findings.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="text-[var(--accent)] font-bold shrink-0">{i + 1}.</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations?.length > 0 && (
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
                <h2 className="font-semibold text-[var(--text-main)] mb-3">Recommendations</h2>
                <div className="flex flex-col gap-3">
                  {insights.recommendations.map((r, i) => (
                    <div key={i} className="p-4 rounded-lg bg-[var(--secondary-bg)] border border-[var(--border)]">
                      <p className="font-medium text-[var(--text-main)] text-sm">{r.title}</p>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">{r.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up questions */}
            {insights.follow_up_questions?.length > 0 && (
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
                <h2 className="font-semibold text-[var(--text-main)] mb-3">Suggested Follow-up Questions</h2>
                <ul className="flex flex-col gap-2">
                  {insights.follow_up_questions.map((q, i) => (
                    <li key={i} className="text-sm text-[var(--text-secondary)] pl-3 border-l-2 border-[var(--accent)]">{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
