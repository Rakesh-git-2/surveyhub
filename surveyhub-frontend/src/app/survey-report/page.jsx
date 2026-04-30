"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/authContext';
import { apiRequest } from '../../api/api';

export default function SurveyReportPage() {
  const { state } = useAuth();
  const router = useRouter();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.loading && !state.isAuthenticated) router.push('/auth');
  }, [state.loading, state.isAuthenticated, router]);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    apiRequest({ method: 'GET', url: '/api/surveys/' })
      .then(data => setSurveys(data.results ?? data))
      .finally(() => setLoading(false));
  }, [state.isAuthenticated]);

  if (loading || state.loading) {
    return <main className="main-container"><div className="grid-center"><p className="text-[var(--text-secondary)]">Loading...</p></div></main>;
  }

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">Survey Reports</h1>
        <p className="text-[var(--text-secondary)] mb-8">Select a survey to view its responses and analytics.</p>
        {surveys.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-[var(--border)]">
            <p className="text-[var(--text-secondary)] mb-4">No surveys yet.</p>
            <Link href="/survey-creation" className="px-5 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] font-semibold hover:opacity-90 transition">
              Create a Survey
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {surveys.map(s => (
              <Link key={s.id} href={`/survey-report/${s.id}`}
                className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] flex items-center justify-between hover:border-[var(--accent)] transition">
                <div>
                  <p className="font-semibold text-[var(--text-main)]">{s.title}</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {s.questions?.length || 0} questions &middot; {s.response_count ?? 0} responses
                  </p>
                </div>
                <span className="text-[var(--text-secondary)] text-sm">View Report →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
