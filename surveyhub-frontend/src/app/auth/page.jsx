"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/authContext';
import { apiRequest } from '../../api/api';
import { Sparkles, BarChart2, Zap } from 'lucide-react';

const inputStyle = {
  width: '100%', padding: '0.7rem 1rem',
  borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border)',
  background: 'var(--surface)', color: 'var(--text-1)',
  fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
  transition: 'border-color .18s, box-shadow .18s',
};

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.4rem' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const focusStyle = (e) => {
    e.target.style.borderColor = 'var(--accent)';
    e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,.12)';
  };
  const blurStyle = (e) => {
    e.target.style.borderColor = 'var(--border)';
    e.target.style.boxShadow = 'none';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { setError('Username and password are required.'); return; }
    setLoading(true);
    try {
      const data = await apiRequest({ method: 'POST', url: '/api/auth/login/', data: { username: form.username, password: form.password } });
      login(data.user, data.access, data.refresh);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) { setError('All fields are required.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const data = await apiRequest({ method: 'POST', url: '/api/auth/register/', data: { username: form.username, email: form.email, password: form.password } });
      login(data.user, data.access, data.refresh);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - var(--nav-h))' }}>
      {/* Left panel — decorative */}
      <div style={{
        flex: '0 0 45%', background: 'var(--grad-hero)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '3rem', position: 'relative', overflow: 'hidden',
      }} className="hidden md:flex">
        {/* glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,.4) 0%, transparent 65%)',
        }} />
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(196,181,253,.7)', marginBottom: '1rem' }}>
            SurveyHub
          </p>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
            Collect insights
            <br />
            <span style={{ background: 'linear-gradient(90deg, #A78BFA, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              at scale
            </span>
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.7, maxWidth: 320 }}>
            Join teams who use AI to design smarter surveys, analyse responses instantly, and act on real insights.
          </p>

          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { Icon: Sparkles,  text: 'Generate surveys from a single prompt' },
              { Icon: BarChart2, text: 'AI-powered response analytics' },
              { Icon: Zap,       text: 'Real-time webhook integrations' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 'var(--r-sm)',
                  background: 'rgba(255,255,255,.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <item.Icon size={16} color="rgba(255,255,255,.8)" strokeWidth={1.75} />
                </div>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,.7)', fontWeight: 500 }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', background: 'var(--bg)',
      }}>
        <div style={{ width: '100%', maxWidth: 420, animation: 'fadeUp .35s ease' }}>
          {/* Logo for mobile */}
          <div className="flex md:hidden justify-center mb-8">
            <span style={{
              fontSize: '1.5rem', fontWeight: 800,
              background: 'var(--grad-text)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              SurveyHub
            </span>
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 0.35rem', letterSpacing: '-0.02em' }}>
            {tab === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', margin: '0 0 2rem' }}>
            {tab === 'login'
              ? "Sign in to your SurveyHub account."
              : "Get started with SurveyHub for free."}
          </p>

          {/* Tab switcher */}
          <div style={{
            display: 'flex', background: 'var(--surface-2)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
            padding: '4px', marginBottom: '1.75rem',
          }}>
            {['login', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: 'calc(var(--r-sm) - 2px)',
                  fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                  border: 'none', transition: 'all .18s',
                  background: tab === t ? 'var(--surface)' : 'transparent',
                  color: tab === t ? 'var(--text-1)' : 'var(--text-3)',
                  boxShadow: tab === t ? 'var(--shadow-xs)' : 'none',
                }}
              >
                {t === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          {error && (
            <div className="error-box" style={{ marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <Field label="Username">
                <input
                  name="username" value={form.username} onChange={handleChange}
                  placeholder="your_username" autoComplete="username"
                  style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
                />
              </Field>
              <Field label="Password">
                <input
                  name="password" type="password" value={form.password} onChange={handleChange}
                  placeholder="••••••••" autoComplete="current-password"
                  style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
                />
              </Field>
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '0.75rem',
                  background: 'var(--grad)', color: '#fff',
                  fontWeight: 700, fontSize: '0.9rem', borderRadius: 'var(--r-sm)',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1, transition: 'all .18s',
                  boxShadow: '0 4px 14px rgba(124,58,237,.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                {loading ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.3)' }} /> Signing in…</> : 'Sign in →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <Field label="Username">
                <input
                  name="username" value={form.username} onChange={handleChange}
                  placeholder="your_username" autoComplete="username"
                  style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
                />
              </Field>
              <Field label="Email">
                <input
                  name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="you@company.com" autoComplete="email"
                  style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
                />
              </Field>
              <Field label="Password">
                <input
                  name="password" type="password" value={form.password} onChange={handleChange}
                  placeholder="Min. 8 characters" autoComplete="new-password"
                  style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
                />
              </Field>
              <Field label="Confirm password">
                <input
                  name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
                  placeholder="••••••••" autoComplete="new-password"
                  style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
                />
              </Field>
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '0.75rem',
                  background: 'var(--grad)', color: '#fff',
                  fontWeight: 700, fontSize: '0.9rem', borderRadius: 'var(--r-sm)',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1, transition: 'all .18s',
                  boxShadow: '0 4px 14px rgba(124,58,237,.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                {loading ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.3)' }} /> Creating account…</> : 'Create account →'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-3)' }}>
            {tab === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError(''); }}
              style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              {tab === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
