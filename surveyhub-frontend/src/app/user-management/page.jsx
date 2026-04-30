"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/authContext';
import { apiRequest } from '../../api/api';

export default function UserManagementPage() {
  const { state, login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    if (!state.loading && !state.isAuthenticated) router.push('/auth');
  }, [state.loading, state.isAuthenticated, router]);

  useEffect(() => {
    if (state.user) {
      setForm({
        first_name: state.user.first_name || '',
        last_name: state.user.last_name || '',
        email: state.user.email || '',
      });
    }
  }, [state.user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(''); setError('');
    try {
      const updated = await apiRequest({ method: 'PATCH', url: '/api/auth/user/', data: form });
      login(updated, localStorage.getItem('token'), localStorage.getItem('refreshToken'));
      setMsg('Profile updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) { setError('New passwords do not match.'); return; }
    if (passwords.newPass.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setSaving(true); setMsg(''); setError('');
    try {
      await apiRequest({
        method: 'POST', url: '/api/auth/change-password/',
        data: { old_password: passwords.current, new_password: passwords.newPass },
      });
      setMsg('Password changed successfully.');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (state.loading) {
    return <main className="main-container"><div className="grid-center"><p className="text-[var(--text-secondary)]">Loading...</p></div></main>;
  }

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">Account Settings</h1>
        <p className="text-[var(--text-secondary)] mb-8">Manage your profile and account.</p>

        {/* Avatar placeholder */}
        <div className="flex items-center gap-5 mb-8 p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
          <div className="w-16 h-16 rounded-full bg-[var(--accent)] flex items-center justify-center text-2xl font-bold text-[var(--text-inverse)]">
            {state.user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-[var(--text-main)] text-lg">{state.user?.username}</p>
            <p className="text-sm text-[var(--text-secondary)]">{state.user?.email}</p>
            <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] mt-1 inline-block">Free Plan</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-[var(--border)]">
          {['profile', 'security'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setMsg(''); setError(''); }}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition ${tab === t ? 'border-[var(--accent)] text-[var(--text-main)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {msg && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm dark:bg-green-950 dark:border-green-800 dark:text-green-400">
            {msg}
          </div>
        )}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-950 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {tab === 'profile' && (
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1" style={{ minWidth: 180 }}>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">First Name</label>
                <input
                  value={form.first_name}
                  onChange={e => setForm({ ...form, first_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition"
                />
              </div>
              <div className="flex-1" style={{ minWidth: 180 }}>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">Last Name</label>
                <input
                  value={form.last_name}
                  onChange={e => setForm({ ...form, last_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Username (cannot change)</label>
              <input
                value={state.user?.username || ''}
                disabled
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--secondary-bg)] text-[var(--text-muted)] cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] font-semibold hover:opacity-90 transition disabled:opacity-50 w-fit"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {tab === 'security' && (
          <form onSubmit={changePassword} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">Current Password</label>
              <input
                type="password"
                value={passwords.current}
                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">New Password</label>
              <input
                type="password"
                value={passwords.newPass}
                onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] font-semibold hover:opacity-90 transition disabled:opacity-50 w-fit"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
