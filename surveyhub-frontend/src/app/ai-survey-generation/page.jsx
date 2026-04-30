"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/authContext';
import { apiRequest } from '../../api/api';
import { Sparkles } from 'lucide-react';

const TYPE_LABELS = { text: 'Text', multiple_choice: 'Multiple Choice', rating: 'Rating', yes_no: 'Yes / No' };

export default function AISurveyGenerationPage() {
  const { state } = useAuth();
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (!state.loading && !state.isAuthenticated) router.push('/auth');
  }, [state.loading, state.isAuthenticated, router]);

  const generate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    setError('');
    setDraft(null);
    try {
      const result = await apiRequest({
        method: 'POST',
        url: '/api/ai/generate-survey/',
        data: { topic: topic.trim(), num_questions: numQuestions },
      });
      setDraft(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const updateQuestion = (idx, field, value) => {
    setDraft(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === idx ? { ...q, [field]: value } : q),
    }));
  };

  const removeQuestion = (idx) => {
    setDraft(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));
  };

  const publishSurvey = async () => {
    if (!draft?.questions?.length) return;
    setSaving(true);
    setError('');
    try {
      const survey = await apiRequest({
        method: 'POST',
        url: '/api/surveys/',
        data: { title: draft.title, description: draft.description, allow_anonymous: false, is_active: true },
      });
      for (let i = 0; i < draft.questions.length; i++) {
        const q = draft.questions[i];
        const payload = {
          question_text: q.question_text,
          question_type: q.question_type,
          required: q.required ?? true,
          order: i + 1,
        };
        if (q.question_type === 'multiple_choice' && q.choices?.length) {
          payload.choices = q.choices.filter(c => c?.trim()).map((c, ci) => ({ choice_text: c, order: ci + 1 }));
        }
        await apiRequest({ method: 'POST', url: `/api/surveys/${survey.id}/questions/`, data: payload });
      }
      router.push(`/survey-distribution/${survey.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">AI Survey Generation</h1>
        <p className="text-[var(--text-secondary)] mb-8">Describe your topic and Gemini will draft a complete survey for you to review and publish.</p>

        <form onSubmit={generate} className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] flex flex-col gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">Survey topic *</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Employee satisfaction, Product feedback, Event experience..."
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">Number of questions</label>
            <select
              value={numQuestions}
              onChange={e => setNumQuestions(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition"
            >
              {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} questions</option>)}
            </select>
          </div>
          <button
            type="submit"
            disabled={generating || !topic.trim()}
            className="px-6 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] font-semibold hover:opacity-90 transition disabled:opacity-50 w-fit"
          >
            {generating ? 'Generating…' : <><Sparkles size={14} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: 'text-bottom' }} />Generate Survey</>}
          </button>
        </form>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-950 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {generating && (
          <div className="text-center py-12 text-[var(--text-secondary)] animate-pulse">
            Gemini is drafting your survey…
          </div>
        )}

        {draft && !generating && (
          <div className="flex flex-col gap-6">
            <div className="p-6 rounded-xl border border-[var(--accent)] bg-[var(--card-bg)]">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <input
                    value={draft.title}
                    onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))}
                    className="text-xl font-bold text-[var(--text-main)] bg-transparent border-b border-transparent focus:border-[var(--accent)] outline-none w-full"
                  />
                  <input
                    value={draft.description || ''}
                    onChange={e => setDraft(prev => ({ ...prev, description: e.target.value }))}
                    className="text-sm text-[var(--text-secondary)] bg-transparent border-b border-transparent focus:border-[var(--accent)] outline-none w-full mt-1"
                    placeholder="Description…"
                  />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--secondary-bg)] text-[var(--text-muted)] border border-[var(--border)]">
                  AI Draft — review before publishing
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {draft.questions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary-bg)] bg-opacity-40">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-medium text-[var(--text-muted)]">Q{idx + 1} · {TYPE_LABELS[q.question_type] || q.question_type}</span>
                      <button onClick={() => removeQuestion(idx)} className="text-xs text-red-400 hover:text-red-600 transition">Remove</button>
                    </div>
                    <input
                      value={q.question_text}
                      onChange={e => updateQuestion(idx, 'question_text', e.target.value)}
                      className="w-full text-sm text-[var(--text-main)] bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] outline-none pb-1"
                    />
                    {q.question_type === 'multiple_choice' && q.choices?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {q.choices.map((c, ci) => (
                          <span key={ci} className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)]">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pb-8">
              <button
                onClick={() => setDraft(null)}
                className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--secondary-bg)] transition"
              >
                Discard
              </button>
              <button
                onClick={publishSurvey}
                disabled={saving || !draft.questions.length}
                className="px-6 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Publishing…' : 'Publish Survey'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
