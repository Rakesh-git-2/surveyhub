"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/authContext';
import { apiRequest } from '../../api/api';

function fmt(seconds) {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function EngagementMetricsPage() {
  const { state } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!state.loading && !state.isAuthenticated) router.push('/auth');
  }, [state.loading, state.isAuthenticated, router]);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    apiRequest({ method: 'GET', url: '/api/admin/engagement-metrics/' })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [state.isAuthenticated]);

  if (state.loading || loading) {
    return <main className="main-container"><div className="grid-center"><p className="text-[var(--text-secondary)]">Loading...</p></div></main>;
  }

  if (error) {
    return <main className="main-container"><div className="grid-center"><p className="text-red-500">{error}</p></div></main>;
  }

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">Engagement Metrics</h1>
        <p className="text-[var(--text-secondary)] mb-8">Response rates and completion times per survey.</p>

        <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {[
            { label: 'Total Surveys', value: data?.total_surveys ?? 0 },
            { label: 'Total Responses', value: data?.total_responses ?? 0 },
            { label: 'Avg Responses / Survey', value: data?.avg_responses_per_survey ?? 0 },
          ].map(s => (
            <div key={s.label} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
              <p className="text-2xl font-bold text-[var(--text-main)]">{s.value}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {!data?.surveys?.length ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-[var(--border)]">
            <p className="text-[var(--text-secondary)] mb-4">No surveys yet.</p>
            <Link href="/survey-creation" className="px-5 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] font-semibold hover:opacity-90 transition text-sm">
              Create a Survey
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--secondary-bg)] text-[var(--text-secondary)]">
                  <th className="px-4 py-3 text-left font-medium">Survey</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Questions</th>
                  <th className="px-4 py-3 text-left font-medium">Responses</th>
                  <th className="px-4 py-3 text-left font-medium">Avg Completion</th>
                  <th className="px-4 py-3 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {data.surveys.map((s, i) => (
                  <tr key={s.id} className={`border-t border-[var(--border)] ${i % 2 !== 0 ? 'bg-[var(--secondary-bg)] bg-opacity-40' : ''}`}>
                    <td className="px-4 py-3 font-medium text-[var(--text-main)]">{s.title}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${s.is_active ? 'border-green-400 text-green-600 bg-green-50 dark:bg-green-950' : 'border-gray-300 text-gray-500'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{s.question_count}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--text-main)]">{s.total_responses}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {s.avg_completion_seconds != null
                        ? fmt(s.avg_completion_seconds)
                        : <span className="text-[var(--text-muted)] text-xs">No timing data</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/survey-report/${s.id}`} className="text-xs text-[var(--accent)] hover:underline">
                        Report →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-[var(--text-muted)] mt-4">
          Completion times are calculated from the moment a respondent opens the survey to when they submit. Timing data appears once respondents use a client that records <code>started_at</code>.
        </p>
      </div>
    </main>
  );
}
