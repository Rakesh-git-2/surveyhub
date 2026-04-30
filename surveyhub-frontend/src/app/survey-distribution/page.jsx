"use client";
import Link from 'next/link';
import { useAuth } from '../../context/authContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../api/api';

export default function SurveyDistributionPage() {
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
        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">Survey Distribution</h1>
        <p className="text-[var(--text-secondary)] mb-8">Select a survey to get its shareable link and embed code.</p>
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
              <Link key={s.id} href={`/survey-distribution/${s.id}`}
                className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] flex items-center justify-between hover:border-[var(--accent)] transition">
                <div>
                  <p className="font-semibold text-[var(--text-main)]">{s.title}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{s.questions?.length || 0} questions</p>
                </div>
                <span className="text-[var(--text-secondary)] text-sm">Share →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
