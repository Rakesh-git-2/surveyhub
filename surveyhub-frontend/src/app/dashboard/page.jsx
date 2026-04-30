"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/authContext';
import { apiRequest } from '../../api/api';
import { ClipboardList, CheckCircle2, Inbox, EyeOff, Sparkles, MessageSquare, Lightbulb, BarChart2 } from 'lucide-react';

const card = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--r)', boxShadow: 'var(--shadow-sm)',
};

function StatusBadge({ active }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.18rem 0.6rem', borderRadius: 99,
      fontSize: '0.7rem', fontWeight: 600,
      background: active ? '#ECFDF5' : '#F9FAFB',
      border: `1px solid ${active ? '#6EE7B7' : '#D1D5DB'}`,
      color: active ? '#065F46' : '#6B7280',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? '#059669' : '#9CA3AF', display: 'inline-block' }} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function DashboardPage() {
  const { state } = useAuth();
  const router = useRouter();
  const [surveys, setSurveys] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (!state.loading && !state.isAuthenticated) router.push('/auth');
  }, [state.loading, state.isAuthenticated, router]);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    setLoading(true);
    apiRequest({ method: 'GET', url: '/api/surveys/', params: search ? { search } : undefined })
      .then(data => {
        const list = data.results ?? data;
        setSurveys(list);
        setTotalCount(data.count ?? list.length);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [state.isAuthenticated, search]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput.trim()); };

  const deleteSurvey = async (id) => {
    if (!confirm('Delete this survey? This cannot be undone.')) return;
    try {
      await apiRequest({ method: 'DELETE', url: `/api/surveys/${id}/` });
      setSurveys(prev => prev.filter(s => s.id !== id));
      setTotalCount(prev => prev - 1);
    } catch (err) {
      alert(err.message);
    }
  };

  if (state.loading || loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - var(--nav-h))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Loading your surveys…</p>
        </div>
      </div>
    );
  }

  const activeCount = surveys.filter(s => s.is_active).length;
  const anonCount = surveys.filter(s => s.allow_anonymous).length;
  const totalResponses = surveys.reduce((acc, s) => acc + (s.response_count ?? 0), 0);

  return (
    <div style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2.5rem 1.5rem' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.02em' }}>
              Dashboard
            </h1>
            <p style={{ color: 'var(--text-2)', marginTop: '0.3rem', fontSize: '0.9rem' }}>
              Welcome back, <strong>{state.user?.username}</strong>
            </p>
          </div>
          <Link href="/survey-creation" style={{
            padding: '0.65rem 1.4rem', background: 'var(--grad)', color: '#fff',
            fontWeight: 600, fontSize: '0.875rem', borderRadius: 'var(--r-sm)',
            textDecoration: 'none', boxShadow: '0 4px 12px rgba(124,58,237,.3)',
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            transition: 'all .18s',
          }}>
            + New Survey
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { value: totalCount,      label: 'Total Surveys',    Icon: ClipboardList },
            { value: activeCount,     label: 'Active Surveys',   Icon: CheckCircle2 },
            { value: totalResponses,  label: 'Total Responses',  Icon: Inbox },
            { value: anonCount,       label: 'Anonymous Enabled',Icon: EyeOff },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="stat-value">{s.value}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + list */}
        <div style={{ ...card, overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
          }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
              Your Surveys
              {totalCount > 0 && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-3)' }}>
                  ({totalCount})
                </span>
              )}
            </h2>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search surveys…"
                style={{
                  padding: '0.5rem 0.875rem', fontSize: '0.83rem',
                  border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)',
                  background: 'var(--surface)', color: 'var(--text-1)',
                  outline: 'none', width: 200, transition: 'border .18s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button type="submit" style={{
                padding: '0.5rem 1rem', borderRadius: 'var(--r-sm)',
                background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                fontSize: '0.83rem', color: 'var(--text-2)', cursor: 'pointer',
                transition: 'all .15s',
              }}>
                Search
              </button>
              {search && (
                <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} style={{
                  padding: '0.5rem 0.75rem', borderRadius: 'var(--r-sm)',
                  background: 'transparent', border: '1.5px solid var(--border)',
                  fontSize: '0.83rem', color: 'var(--text-3)', cursor: 'pointer',
                }}>
                  ✕
                </button>
              )}
            </form>
          </div>

          {error && (
            <div className="error-box" style={{ margin: '1rem 1.25rem 0' }}>{error}</div>
          )}

          {surveys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📋</div>
              <p style={{ color: 'var(--text-2)', fontWeight: 600, marginBottom: '0.4rem' }}>
                {search ? 'No surveys match your search' : 'No surveys yet'}
              </p>
              <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                {search ? 'Try a different search term.' : 'Create your first survey to get started.'}
              </p>
              {!search && (
                <Link href="/survey-creation" style={{
                  display: 'inline-flex', padding: '0.65rem 1.4rem',
                  background: 'var(--grad)', color: '#fff', fontWeight: 600,
                  fontSize: '0.875rem', borderRadius: 'var(--r-sm)', textDecoration: 'none',
                }}>
                  Create your first survey →
                </Link>
              )}
            </div>
          ) : (
            <div>
              {surveys.map((survey, idx) => (
                <div key={survey.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: '0.75rem',
                  padding: '1rem 1.25rem',
                  borderBottom: idx < surveys.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background .15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.9rem' }}>
                        {survey.title}
                      </span>
                      <StatusBadge active={survey.is_active} />
                      {survey.allow_anonymous && (
                        <span style={{
                          padding: '0.18rem 0.6rem', borderRadius: 99,
                          fontSize: '0.7rem', fontWeight: 600,
                          background: '#EFF6FF', border: '1px solid #93C5FD', color: '#1D4ED8',
                        }}>
                          Anonymous
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: '0.3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {survey.description && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                          {survey.description}
                        </span>
                      )}
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                        {survey.questions?.length ?? 0} questions · {survey.response_count ?? 0} responses
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                    {[
                      { href: `/survey-creation?edit=${survey.id}`, label: 'Edit' },
                      { href: `/survey-response/${survey.id}`,       label: 'Preview' },
                      { href: `/survey-report/${survey.id}`,         label: 'Report' },
                      { href: `/survey-distribution/${survey.id}`,   label: 'Share' },
                    ].map(btn => (
                      <Link key={btn.label} href={btn.href} style={{
                        padding: '0.4rem 0.85rem', borderRadius: 'var(--r-sm)',
                        fontSize: '0.78rem', fontWeight: 500,
                        border: '1.5px solid var(--border)', background: 'var(--surface)',
                        color: 'var(--text-2)', textDecoration: 'none', transition: 'all .15s',
                      }}
                        onMouseEnter={e => { (e.currentTarget).style.borderColor = 'var(--accent)'; (e.currentTarget).style.color = 'var(--accent)'; }}
                        onMouseLeave={e => { (e.currentTarget).style.borderColor = 'var(--border)'; (e.currentTarget).style.color = 'var(--text-2)'; }}
                      >
                        {btn.label}
                      </Link>
                    ))}
                    <button onClick={() => deleteSurvey(survey.id)} style={{
                      padding: '0.4rem 0.85rem', borderRadius: 'var(--r-sm)',
                      fontSize: '0.78rem', fontWeight: 500,
                      border: '1.5px solid var(--error-border)', background: 'transparent',
                      color: 'var(--error)', cursor: 'pointer', transition: 'all .15s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--error-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem', marginTop: '1.5rem' }}>
          {[
            { href: '/ai-survey-generation', Icon: Sparkles,      label: 'AI Survey Generation', desc: 'Generate from a topic' },
            { href: '/conversational-ai',    Icon: MessageSquare, label: 'Conversational AI',    desc: 'Chat to build surveys' },
            { href: '/ai-recommendations',   Icon: Lightbulb,     label: 'AI Insights',          desc: 'Analyse responses' },
            { href: '/advanced-reporting',   Icon: BarChart2,     label: 'Advanced Reports',     desc: 'Cross-survey analytics' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.875rem 1rem',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r)', textDecoration: 'none', transition: 'all .18s',
            }}
              onMouseEnter={e => { (e.currentTarget).style.borderColor = 'var(--border-2)'; (e.currentTarget).style.boxShadow = 'var(--shadow-sm)'; }}
              onMouseLeave={e => { (e.currentTarget).style.borderColor = 'var(--border)'; (e.currentTarget).style.boxShadow = 'none'; }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--r-sm)',
                background: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}><item.Icon size={18} color="var(--accent)" strokeWidth={1.75} /></div>
              <div>
                <p style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>{item.label}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', margin: 0 }}>{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
