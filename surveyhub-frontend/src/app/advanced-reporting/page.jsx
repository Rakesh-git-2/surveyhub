"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/authContext';
import { apiRequest } from '../../api/api';

function StatCard({ label, value, sub }) {
  return (
    <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
      <p className="text-2xl font-bold text-[var(--text-main)]">{value}</p>
      <p className="text-sm text-[var(--text-secondary)] mt-1">{label}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </div>
  );
}

function MiniBar({ data }) {
  if (!data?.length) return <p className="text-sm text-[var(--text-muted)]">No data yet.</p>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-20 mt-3">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-t bg-[var(--accent)] opacity-80 transition-all"
            style={{ height: `${Math.max((d.count / max) * 64, 2)}px` }}
          />
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs bg-[var(--card-bg)] border border-[var(--border)] px-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
            {d.day}: {d.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdvancedReportingPage() {
  const { state } = useAuth();
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!state.loading && !state.isAuthenticated) router.push('/auth');
  }, [state.loading, state.isAuthenticated, router]);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    apiRequest({ method: 'GET', url: '/api/admin/advanced-report/' })
      .then(setReport)
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
        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">Advanced Reporting</h1>
        <p className="text-[var(--text-secondary)] mb-8">Cross-survey analytics and response trends.</p>

        {/* Top stats */}
        <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <StatCard label="Total Surveys" value={report?.total_surveys ?? 0} />
          <StatCard label="Active Surveys" value={report?.active_surveys ?? 0} />
          <StatCard label="Total Responses" value={report?.total_responses ?? 0} />
          <StatCard label="Last 7 Days" value={report?.responses_last_7_days ?? 0} sub="responses" />
          <StatCard label="Last 30 Days" value={report?.responses_last_30_days ?? 0} sub="responses" />
        </div>

        {/* Daily trend */}
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] mb-8">
          <h2 className="font-semibold text-[var(--text-main)] mb-1">Response Trend (last 30 days)</h2>
          <p className="text-xs text-[var(--text-muted)] mb-2">Hover bars for details</p>
          <MiniBar data={report?.daily_responses} />
        </div>

        {/* Per-survey breakdown */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-main)] mb-4">Survey Breakdown</h2>
          {!report?.survey_breakdown?.length ? (
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
                    <th className="px-4 py-3 text-left font-medium">Created</th>
                    <th className="px-4 py-3 text-left font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {report.survey_breakdown.map((s, i) => (
                    <tr key={s.id} className={`border-t border-[var(--border)] ${i % 2 !== 0 ? 'bg-[var(--secondary-bg)] bg-opacity-40' : ''}`}>
                      <td className="px-4 py-3 font-medium text-[var(--text-main)]">{s.title}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${s.is_active ? 'border-green-400 text-green-600 bg-green-50 dark:bg-green-950' : 'border-gray-300 text-gray-500'}`}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{s.question_count}</td>
                      <td className="px-4 py-3 font-semibold text-[var(--text-main)]">{s.response_count}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Link href={`/survey-report/${s.id}`} className="text-xs text-[var(--accent)] hover:underline">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
