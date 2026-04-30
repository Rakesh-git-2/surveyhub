"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/authContext';
import { apiRequest } from '../../api/api';

const STATUS_COLOR = (code) => {
  if (!code) return 'text-[var(--text-muted)]';
  if (code >= 200 && code < 300) return 'text-green-600 dark:text-green-400';
  return 'text-red-500 dark:text-red-400';
};

export default function IntegrationsPage() {
  const { state } = useAuth();
  const router = useRouter();
  const [webhooks, setWebhooks] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ url: '', survey_id: '', secret: '' });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!state.loading && !state.isAuthenticated) router.push('/auth');
  }, [state.loading, state.isAuthenticated, router]);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    Promise.all([
      apiRequest({ method: 'GET', url: '/api/webhooks/' }),
      apiRequest({ method: 'GET', url: '/api/surveys/' }),
    ]).then(([hooks, surveyData]) => {
      setWebhooks(hooks);
      setSurveys(surveyData.results ?? surveyData);
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [state.isAuthenticated]);

  const createWebhook = async (e) => {
    e.preventDefault();
    if (!form.url.trim()) return;
    setSaving(true);
    setError('');
    try {
      const hook = await apiRequest({
        method: 'POST',
        url: '/api/webhooks/',
        data: {
          url: form.url.trim(),
          survey_id: form.survey_id || null,
          secret: form.secret.trim(),
        },
      });
      setWebhooks(prev => [hook, ...prev]);
      setForm({ url: '', survey_id: '', secret: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (hook) => {
    try {
      const updated = await apiRequest({
        method: 'PATCH',
        url: `/api/webhooks/${hook.id}/`,
        data: { is_active: !hook.is_active },
      });
      setWebhooks(prev => prev.map(h => h.id === hook.id ? updated : h));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteWebhook = async (id) => {
    if (!confirm('Delete this webhook?')) return;
    try {
      await apiRequest({ method: 'DELETE', url: `/api/webhooks/${id}/` });
      setWebhooks(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const fmt = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  if (state.loading || loading) {
    return (
      <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2rem 1.5rem' }}>
        <div className="flex items-center justify-center h-48">
          <p className="text-[var(--text-secondary)]">Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-main)]">Integrations</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-0.5">
              Webhooks fire a POST request to your URL whenever a new survey response is submitted.
            </p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] text-sm font-semibold hover:opacity-90 transition"
          >
            {showForm ? 'Cancel' : '+ Add Webhook'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={createWebhook}
            className="mt-4 mb-6 p-5 rounded-xl border border-[var(--accent)] bg-[var(--card-bg)] flex flex-col gap-4"
          >
            <h2 className="font-semibold text-[var(--text-main)]">New Webhook</h2>
            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1">Endpoint URL *</label>
              <input
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://your-server.com/webhook"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1">Survey <span className="text-[var(--text-muted)] font-normal">(leave blank for all surveys)</span></label>
              <select
                value={form.survey_id}
                onChange={e => setForm(f => ({ ...f, survey_id: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition text-sm"
              >
                <option value="">All surveys</option>
                {surveys.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1">
                Secret <span className="text-[var(--text-muted)] font-normal">(optional — used for HMAC-SHA256 signature)</span>
              </label>
              <input
                value={form.secret}
                onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
                placeholder="my-signing-secret"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition text-sm font-mono"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                If set, a <code className="bg-[var(--secondary-bg)] px-1 rounded">X-SurveyHub-Signature: sha256=…</code> header is sent with each delivery.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !form.url.trim()}
                className="px-5 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create Webhook'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-main)] hover:bg-[var(--secondary-bg)] transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-950 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {webhooks.length === 0 ? (
          <div className="mt-8 text-center py-16 rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)]">
            <p className="text-lg font-medium mb-1">No webhooks yet</p>
            <p className="text-sm">Click <strong>+ Add Webhook</strong> to connect an endpoint.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-4">
            {webhooks.map(hook => (
              <div
                key={hook.id}
                className={`p-5 rounded-xl border bg-[var(--card-bg)] ${hook.is_active ? 'border-[var(--border)]' : 'border-dashed border-[var(--border)] opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-[var(--text-main)] truncate">{hook.url}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {hook.survey_title ? `Survey: ${hook.survey_title}` : 'All surveys'} &nbsp;·&nbsp;
                      Created {fmt(hook.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full border border-[var(--border)] ${hook.is_active ? 'text-green-600 dark:text-green-400' : 'text-[var(--text-muted)]'}`}>
                      {hook.is_active ? 'Active' : 'Paused'}
                    </span>
                    <button
                      onClick={() => toggleActive(hook)}
                      className="text-xs px-3 py-1 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--secondary-bg)] transition"
                    >
                      {hook.is_active ? 'Pause' : 'Enable'}
                    </button>
                    <button
                      onClick={() => deleteWebhook(hook.id)}
                      className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {(hook.last_triggered_at || hook.last_status) && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-4 text-xs text-[var(--text-muted)]">
                    <span>Last triggered: {fmt(hook.last_triggered_at)}</span>
                    {hook.last_status != null && (
                      <span className={STATUS_COLOR(hook.last_status)}>
                        Status: {hook.last_status || 'failed'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Payload reference */}
        <div className="mt-8 p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
          <h2 className="text-sm font-semibold text-[var(--text-main)] mb-3">Payload format</h2>
          <pre className="text-xs text-[var(--text-secondary)] bg-[var(--secondary-bg)] p-3 rounded-lg overflow-x-auto">
{`POST https://your-endpoint.com/webhook
Content-Type: application/json
X-SurveyHub-Event: response.created
X-SurveyHub-Signature: sha256=<hmac>  (if secret is set)

{
  "event": "response.created",
  "survey_id": 1,
  "survey_title": "My Survey",
  "response_id": 42,
  "submitted_at": "2026-04-30T10:00:00Z",
  "respondent": "username or null"
}`}
          </pre>
        </div>
      </div>
    </main>
  );
}
