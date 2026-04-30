"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '../../../api/api';

export default function SurveyResponseFormPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [startedAt] = useState(() => new Date().toISOString());

  useEffect(() => {
    apiRequest({ method: 'GET', url: `/api/surveys/${id}/public/` })
      .then(data => {
        setSurvey(data);
        const initial = {};
        data.questions?.forEach(q => { initial[q.id] = ''; });
        setAnswers(initial);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const setAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!survey) return;
    const required = survey.questions?.filter(q => q.required) || [];
    const missing = required.filter(q => !answers[q.id]?.toString().trim());
    if (missing.length > 0) {
      setError(`Please answer all required questions (${missing.map(q => `Q${q.order}`).join(', ')}).`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const answersPayload = survey.questions
        .filter(q => answers[q.id] !== '')
        .map(q => ({ question: q.id, answer_text: answers[q.id].toString() }));
      await apiRequest({
        method: 'POST',
        url: `/api/surveys/${id}/responses/`,
        data: { answers: answersPayload, started_at: startedAt },
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="main-container">
        <div className="grid-center">
          <div className="animate-pulse text-[var(--text-secondary)]">Loading survey...</div>
        </div>
      </main>
    );
  }

  if (error && !survey) {
    return (
      <main className="main-container">
        <div className="grid-center">
          <p className="text-red-500 text-center">{error}</p>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="main-container">
        <div className="grid-center" style={{ maxWidth: 480 }}>
          <div className="text-5xl mb-4 text-center">✓</div>
          <h1 className="text-2xl font-bold text-[var(--text-main)] text-center mb-2">Thank you!</h1>
          <p className="text-[var(--text-secondary)] text-center">Your response has been recorded.</p>
        </div>
      </main>
    );
  }

  const questions = survey?.questions || [];
  const progress = questions.length > 0 ? Math.round((Object.values(answers).filter(a => a !== '').length / questions.length) * 100) : 0;

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-main)]">{survey?.title}</h1>
          {survey?.description && <p className="text-[var(--text-secondary)] mt-2">{survey.description}</p>}
          {/* Progress bar */}
          <div className="mt-4 h-1.5 rounded-full bg-[var(--border)]">
            <div
              className="h-1.5 rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">{progress}% complete</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-950 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Questions */}
        <div className="flex flex-col gap-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
              <p className="font-medium text-[var(--text-main)] mb-4">
                {idx + 1}. {q.question_text}
                {q.required && <span className="ml-1 text-red-500">*</span>}
              </p>

              {q.question_type === 'text' && (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={e => setAnswer(q.id, e.target.value)}
                  placeholder="Type your answer..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition resize-none text-sm"
                />
              )}

              {q.question_type === 'multiple_choice' && (
                <div className="flex flex-col gap-2">
                  {q.choices?.map(choice => (
                    <label key={choice.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] cursor-pointer hover:border-[var(--accent)] transition">
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={choice.choice_text}
                        checked={answers[q.id] === choice.choice_text}
                        onChange={() => setAnswer(q.id, choice.choice_text)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-[var(--text-main)]">{choice.choice_text}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.question_type === 'rating' && (
                <div className="flex gap-3 flex-wrap">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAnswer(q.id, n.toString())}
                      className={`w-12 h-12 rounded-full border-2 font-semibold text-lg transition ${
                        answers[q.id] === n.toString()
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--text-inverse)]'
                          : 'border-[var(--border)] text-[var(--text-main)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}

              {q.question_type === 'yes_no' && (
                <div className="flex gap-3">
                  {['Yes', 'No'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswer(q.id, opt)}
                      className={`flex-1 py-3 rounded-lg border-2 font-medium transition ${
                        answers[q.id] === opt
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--text-inverse)]'
                          : 'border-[var(--border)] text-[var(--text-main)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="mt-8 mb-16">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[var(--accent)] text-[var(--text-inverse)] font-semibold text-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Response'}
          </button>
        </div>
      </div>
    </main>
  );
}
