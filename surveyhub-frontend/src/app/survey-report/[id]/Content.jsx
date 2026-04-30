"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../../api/api';

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex flex-col gap-2 mt-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-secondary)] w-24 shrink-0 truncate">{item.label}</span>
          <div className="flex-1 h-6 rounded-full bg-[var(--secondary-bg)] overflow-hidden">
            <div
              className="h-6 rounded-full bg-[var(--accent)] transition-all duration-500"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-[var(--text-secondary)] w-6 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function analyzeResponses(question, responses) {
  const answers = responses.flatMap(r =>
    r.answers?.filter(a => a.question === question.id) || []
  );

  if (question.question_type === 'text') {
    return { type: 'text', values: answers.map(a => a.answer_text).filter(Boolean) };
  }

  if (question.question_type === 'multiple_choice') {
    const counts = {};
    question.choices?.forEach(c => { counts[c.choice_text] = 0; });
    answers.forEach(a => { if (counts[a.answer_text] !== undefined) counts[a.answer_text]++; });
    return { type: 'bar', data: Object.entries(counts).map(([label, count]) => ({ label, count })) };
  }

  if (question.question_type === 'rating') {
    const counts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    answers.forEach(a => { if (counts[a.answer_text] !== undefined) counts[a.answer_text]++; });
    const total = answers.length;
    const avg = total > 0 ? (answers.reduce((s, a) => s + Number(a.answer_text), 0) / total).toFixed(1) : 'N/A';
    return {
      type: 'bar',
      avg,
      data: Object.entries(counts).map(([label, count]) => ({ label: `★ ${label}`, count })),
    };
  }

  if (question.question_type === 'yes_no') {
    const counts = { Yes: 0, No: 0 };
    answers.forEach(a => { if (counts[a.answer_text] !== undefined) counts[a.answer_text]++; });
    return { type: 'bar', data: Object.entries(counts).map(([label, count]) => ({ label, count })) };
  }

  return null;
}

function exportCSV(survey, responses) {
  if (!survey || !responses.length) return;
  const headers = ['Response ID', 'Submitted At', ...survey.questions.map(q => q.question_text)];
  const rows = responses.map(r => {
    const answerMap = {};
    r.answers?.forEach(a => { answerMap[a.question] = a.answer_text; });
    return [r.id, r.submitted_at, ...survey.questions.map(q => answerMap[q.id] || '')];
  });
  const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${survey.title}-responses.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SurveyReportDetailPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiRequest({ method: 'GET', url: `/api/surveys/${id}/` }),
      apiRequest({ method: 'GET', url: `/api/surveys/${id}/responses/list/` }),
    ])
      .then(([s, r]) => { setSurvey(s); setResponses(r.results ?? r); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <main className="main-container"><div className="grid-center"><p className="text-[var(--text-secondary)]">Loading report...</p></div></main>;
  }

  if (error) {
    return <main className="main-container"><div className="grid-center"><p className="text-red-500">{error}</p></div></main>;
  }

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <Link href="/survey-report" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition">← All Reports</Link>
            <h1 className="text-3xl font-bold text-[var(--text-main)] mt-1">{survey?.title}</h1>
            {survey?.description && <p className="text-[var(--text-secondary)] mt-1">{survey.description}</p>}
          </div>
          <button
            onClick={() => exportCSV(survey, responses)}
            disabled={responses.length === 0}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-main)] hover:bg-[var(--secondary-bg)] disabled:opacity-40 transition"
          >
            Export CSV
          </button>
        </div>

        <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {[
            { label: 'Total Responses', value: responses.length },
            { label: 'Questions', value: survey?.questions?.length || 0 },
          ].map(stat => (
            <div key={stat.label} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
              <p className="text-2xl font-bold text-[var(--text-main)]">{stat.value}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {responses.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-[var(--border)]">
            <p className="text-[var(--text-secondary)] mb-4">No responses yet.</p>
            <Link href={`/survey-distribution/${id}`} className="px-5 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] font-semibold hover:opacity-90 transition text-sm">
              Share Survey
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {survey?.questions?.map((q, idx) => {
              const analysis = analyzeResponses(q, responses);
              return (
                <div key={q.id} className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
                  <p className="font-semibold text-[var(--text-main)] mb-1">
                    {idx + 1}. {q.question_text}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mb-3 capitalize">{q.question_type.replace('_', ' ')}</p>

                  {analysis?.type === 'bar' && (
                    <>
                      {analysis.avg && (
                        <p className="text-sm text-[var(--text-secondary)] mb-2">Average: <strong>{analysis.avg} / 5</strong></p>
                      )}
                      <BarChart data={analysis.data} />
                    </>
                  )}

                  {analysis?.type === 'text' && (
                    <div className="flex flex-col gap-2">
                      {analysis.values.length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)]">No text answers yet.</p>
                      ) : (
                        analysis.values.map((v, i) => (
                          <div key={i} className="px-4 py-2.5 rounded-lg bg-[var(--secondary-bg)] text-sm text-[var(--text-main)]">
                            {v}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
