"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/authContext';
import { apiRequest } from '../../api/api';

const INITIAL_MESSAGE = { role: 'assistant', content: "Hi! I'm your AI survey designer. Tell me what you want to measure or learn — your audience, your goals — and I'll help you craft the perfect questions." };

export default function ConversationalAIPage() {
  const { state } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [readyToCreate, setReadyToCreate] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!state.loading && !state.isAuthenticated) router.push('/auth');
  }, [state.loading, state.isAuthenticated, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setSending(true);
    setError('');

    try {
      const result = await apiRequest({
        method: 'POST',
        url: '/api/ai/chat/',
        data: { messages: newMessages },
      });

      setMessages(prev => [...prev, { role: 'assistant', content: result.message }]);

      if (result.suggested_questions?.length) {
        setSuggestedQuestions(result.suggested_questions);
      }
      if (result.ready_to_create) {
        setReadyToCreate(true);
      }
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sorry, I ran into an issue. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  const publishSurvey = async () => {
    if (!suggestedQuestions.length) return;
    setPublishing(true);
    setError('');
    try {
      // Derive title from conversation
      const firstUserMsg = messages.find(m => m.role === 'user')?.content || 'AI-Generated Survey';
      const title = firstUserMsg.length > 60 ? firstUserMsg.slice(0, 57) + '…' : firstUserMsg;

      const survey = await apiRequest({
        method: 'POST',
        url: '/api/surveys/',
        data: { title, description: 'Created with Conversational AI', allow_anonymous: false, is_active: true },
      });

      for (let i = 0; i < suggestedQuestions.length; i++) {
        const q = suggestedQuestions[i];
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
      setPublishing(false);
    }
  };

  const reset = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput('');
    setSuggestedQuestions([]);
    setReadyToCreate(false);
    setError('');
  };

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-main)]">Conversational AI</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-0.5">Design your survey through conversation.</p>
          </div>
          <button onClick={reset} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--secondary-bg)] transition">
            New Conversation
          </button>
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 flex flex-col gap-3 mb-4" style={{ minHeight: 0 }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[80%] ${
                  m.role === 'user'
                    ? 'bg-[var(--accent)] text-[var(--text-inverse)] rounded-br-sm'
                    : 'bg-[var(--secondary-bg)] text-[var(--text-main)] border border-[var(--border)] rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-[var(--secondary-bg)] border border-[var(--border)] text-[var(--text-muted)] text-sm animate-pulse">
                Gemini is thinking…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggested questions panel */}
        {suggestedQuestions.length > 0 && (
          <div className="rounded-xl border border-[var(--accent)] bg-[var(--card-bg)] p-4 mb-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-sm font-semibold text-[var(--text-main)]">
                ✦ {suggestedQuestions.length} question{suggestedQuestions.length !== 1 ? 's' : ''} suggested
              </p>
              <button
                onClick={publishSurvey}
                disabled={publishing}
                className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {publishing ? 'Publishing…' : 'Publish as Survey →'}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {suggestedQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="text-[var(--accent)] font-bold shrink-0 mt-0.5">{i + 1}.</span>
                  <div>
                    <span className="text-[var(--text-main)]">{q.question_text}</span>
                    <span className="ml-2 text-xs text-[var(--text-muted)] capitalize">{q.question_type?.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-950 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Input bar */}
        <form onSubmit={send} className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe your survey goals, audience, or ask for specific questions…"
            disabled={sending}
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-5 py-3 rounded-xl bg-[var(--accent)] text-[var(--text-inverse)] font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
