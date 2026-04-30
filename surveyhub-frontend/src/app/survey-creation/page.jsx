"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/authContext';
import { apiRequest } from '../../api/api';

const QUESTION_TYPES = [
  { value: 'text', label: 'Text Answer' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'rating', label: 'Rating Scale (1-5)' },
  { value: 'yes_no', label: 'Yes / No' },
];

function newQuestion(order) {
  return { question_text: '', question_type: 'text', required: false, order, choices: ['', ''] };
}

function apiQuestionToLocal(q, order) {
  return {
    id: q.id,
    question_text: q.question_text,
    question_type: q.question_type,
    required: q.required,
    order: q.order ?? order,
    choices: q.choices?.length ? q.choices.map(c => c.choice_text) : ['', ''],
  };
}

export default function SurveyCreationPage() {
  const { state } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [questions, setQuestions] = useState([newQuestion(1)]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!state.loading && !state.isAuthenticated) router.push('/auth');
  }, [state.loading, state.isAuthenticated, router]);

  useEffect(() => {
    if (!editId || !state.isAuthenticated) return;
    apiRequest({ method: 'GET', url: `/api/surveys/${editId}/` })
      .then(survey => {
        setTitle(survey.title);
        setDescription(survey.description || '');
        setAllowAnonymous(survey.allow_anonymous);
        if (survey.questions?.length) {
          setQuestions(survey.questions.map((q, i) => apiQuestionToLocal(q, i + 1)));
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoadingEdit(false));
  }, [editId, state.isAuthenticated]);

  const addQuestion = () => {
    setQuestions([...questions, newQuestion(questions.length + 1)]);
  };

  const removeQuestion = (idx) => {
    const removed = questions[idx];
    if (removed.id) setDeletedQuestionIds(prev => [...prev, removed.id]);
    setQuestions(questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i + 1 })));
  };

  const moveQuestion = (idx, dir) => {
    const next = [...questions];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setQuestions(next.map((q, i) => ({ ...q, order: i + 1 })));
  };

  const updateQuestion = (idx, field, value) => {
    const next = [...questions];
    next[idx] = { ...next[idx], [field]: value };
    setQuestions(next);
  };

  const updateChoice = (qIdx, cIdx, value) => {
    const next = [...questions];
    const choices = [...next[qIdx].choices];
    choices[cIdx] = value;
    next[qIdx] = { ...next[qIdx], choices };
    setQuestions(next);
  };

  const addChoice = (qIdx) => {
    const next = [...questions];
    next[qIdx] = { ...next[qIdx], choices: [...next[qIdx].choices, ''] };
    setQuestions(next);
  };

  const removeChoice = (qIdx, cIdx) => {
    const next = [...questions];
    next[qIdx] = { ...next[qIdx], choices: next[qIdx].choices.filter((_, i) => i !== cIdx) };
    setQuestions(next);
  };

  const buildQuestionPayload = (q) => {
    const payload = {
      question_text: q.question_text,
      question_type: q.question_type,
      required: q.required,
      order: q.order,
    };
    if (q.question_type === 'multiple_choice') {
      payload.choices = q.choices
        .filter(c => c.trim())
        .map((c, i) => ({ choice_text: c, order: i + 1 }));
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Survey title is required.'); return; }
    if (questions.some(q => !q.question_text.trim())) { setError('All questions need text.'); return; }
    setSaving(true);
    setError('');

    try {
      if (editId) {
        await apiRequest({
          method: 'PATCH', url: `/api/surveys/${editId}/`,
          data: { title, description, allow_anonymous: allowAnonymous },
        });
        for (const id of deletedQuestionIds) {
          await apiRequest({ method: 'DELETE', url: `/api/surveys/${editId}/questions/${id}/` });
        }
        for (const q of questions) {
          const payload = buildQuestionPayload(q);
          if (q.id) {
            await apiRequest({ method: 'PUT', url: `/api/surveys/${editId}/questions/${q.id}/`, data: payload });
          } else {
            await apiRequest({ method: 'POST', url: `/api/surveys/${editId}/questions/`, data: payload });
          }
        }
        router.push('/dashboard');
      } else {
        const survey = await apiRequest({
          method: 'POST', url: '/api/surveys/',
          data: { title, description, allow_anonymous: allowAnonymous, is_active: true },
        });
        for (const q of questions) {
          await apiRequest({ method: 'POST', url: `/api/surveys/${survey.id}/questions/`, data: buildQuestionPayload(q) });
        }
        router.push(`/survey-distribution/${survey.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (state.loading || loadingEdit) {
    return (
      <main className="main-container">
        <div className="grid-center">
          <div className="animate-pulse text-[var(--text-secondary)]">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">
          {editId ? 'Edit Survey' : 'Create Survey'}
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          {editId ? 'Update your survey details and questions.' : 'Build your survey by adding questions below.'}
        </p>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-950 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] flex flex-col gap-4">
            <h2 className="font-semibold text-[var(--text-main)]">Survey Details</h2>
            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">Title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Customer Satisfaction Survey"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of the survey..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition resize-none"
              />
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowAnonymous}
                onChange={e => setAllowAnonymous(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-[var(--text-main)]">Allow anonymous responses</span>
            </label>
          </div>

          <div className="flex flex-col gap-4">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Question {q.order}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveQuestion(qIdx, -1)} disabled={qIdx === 0}
                      className="px-2 py-1 rounded text-sm border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-30 hover:bg-[var(--secondary-bg)] transition">↑</button>
                    <button type="button" onClick={() => moveQuestion(qIdx, 1)} disabled={qIdx === questions.length - 1}
                      className="px-2 py-1 rounded text-sm border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-30 hover:bg-[var(--secondary-bg)] transition">↓</button>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => removeQuestion(qIdx)}
                        className="px-2 py-1 rounded text-sm border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition">✕</button>
                    )}
                  </div>
                </div>

                <input
                  value={q.question_text}
                  onChange={e => updateQuestion(qIdx, 'question_text', e.target.value)}
                  placeholder="Question text..."
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition"
                />

                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1" style={{ minWidth: 200 }}>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Type</label>
                    <select
                      value={q.question_type}
                      onChange={e => updateQuestion(qIdx, 'question_type', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition"
                    >
                      {QUESTION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer mt-5">
                    <input type="checkbox" checked={q.required}
                      onChange={e => updateQuestion(qIdx, 'required', e.target.checked)}
                      className="w-4 h-4 rounded" />
                    <span className="text-sm text-[var(--text-main)]">Required</span>
                  </label>
                </div>

                {q.question_type === 'multiple_choice' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-[var(--text-secondary)]">Answer choices</label>
                    {q.choices.map((c, cIdx) => (
                      <div key={cIdx} className="flex gap-2">
                        <input value={c} onChange={e => updateChoice(qIdx, cIdx, e.target.value)}
                          placeholder={`Choice ${cIdx + 1}`}
                          className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition text-sm" />
                        {q.choices.length > 2 && (
                          <button type="button" onClick={() => removeChoice(qIdx, cIdx)}
                            className="px-2 rounded text-red-400 hover:text-red-600 transition text-sm">✕</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addChoice(qIdx)}
                      className="text-sm text-[var(--accent)] hover:underline text-left w-fit">+ Add choice</button>
                  </div>
                )}

                {q.question_type === 'rating' && (
                  <div className="flex gap-2 mt-1">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-sm text-[var(--text-secondary)]">{n}</div>
                    ))}
                  </div>
                )}

                {q.question_type === 'yes_no' && (
                  <div className="flex gap-3 mt-1">
                    {['Yes', 'No'].map(opt => (
                      <div key={opt} className="px-4 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)]">{opt}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button type="button" onClick={addQuestion}
              className="py-3 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition text-sm font-medium">
              + Add Question
            </button>
          </div>

          <div className="flex gap-3 justify-end pb-8">
            <button type="button" onClick={() => router.push('/dashboard')}
              className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--secondary-bg)] transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] font-semibold hover:opacity-90 transition disabled:opacity-50">
              {saving ? (editId ? 'Saving...' : 'Publishing...') : (editId ? 'Save Changes' : 'Publish Survey')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
