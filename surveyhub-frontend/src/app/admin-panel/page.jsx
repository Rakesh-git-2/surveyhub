"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/authContext';
import { apiRequest } from '../../api/api';

function StatCard({ label, value, color = 'var(--accent)' }) {
  return (
    <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      <p className="text-sm text-[var(--text-secondary)] mt-1">{label}</p>
    </div>
  );
}

export default function AdminPanelPage() {
  const { state } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('surveys');
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    if (!state.loading && !state.isAuthenticated) router.push('/auth');
  }, [state.loading, state.isAuthenticated, router]);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    apiRequest({ method: 'GET', url: '/api/admin/stats/' })
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [state.isAuthenticated]);

  const toggleUser = async (user, field) => {
    setTogglingId(`${user.id}-${field}`);
    try {
      const updated = await apiRequest({
        method: 'PATCH',
        url: `/api/admin/users/${user.id}/toggle/`,
        data: { field },
      });
      setStats(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === user.id ? { ...u, ...updated } : u),
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const toggleSurveyActive = async (survey) => {
    try {
      await apiRequest({
        method: 'PATCH',
        url: `/api/surveys/${survey.id}/`,
        data: { is_active: !survey.is_active },
      });
      setStats(prev => ({
        ...prev,
        surveys: prev.surveys.map(s =>
          s.id === survey.id ? { ...s, is_active: !s.is_active } : s
        ),
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  if (state.loading || loading) {
    return <main className="main-container"><div className="grid-center"><p className="text-[var(--text-secondary)]">Loading...</p></div></main>;
  }

  if (error) {
    return (
      <main className="main-container">
        <div className="grid-center" style={{ maxWidth: 480 }}>
          <h1 className="page-title" style={{ fontSize: '1.6rem' }}>Admin Panel</h1>
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-950 dark:border-red-800 dark:text-red-400 w-full text-center">
            {error === 'Admin access required'
              ? 'You must be a Django staff/admin user to access this panel. Set is_staff=True in the Django admin.'
              : error}
          </div>
        </div>
      </main>
    );
  }

  const filteredSurveys = (stats?.surveys || []).filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.creator?.username?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = (stats?.users || []).filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-main)]">Admin Panel</h1>
          <p className="text-[var(--text-secondary)] mt-1">Platform overview and moderation tools.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <StatCard label="Total Users" value={stats?.total_users ?? '—'} />
          <StatCard label="Total Surveys" value={stats?.total_surveys ?? '—'} />
          <StatCard label="Total Responses" value={stats?.total_responses ?? '—'} />
          <StatCard label="Active Surveys" value={stats?.surveys?.filter(s => s.is_active).length ?? '—'} color="var(--success)" />
        </div>

        {/* Tabs + Search */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex border-b border-[var(--border)]">
            {['surveys', 'users'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSearch(''); }}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition ${tab === t ? 'border-[var(--accent)] text-[var(--text-main)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'}`}
              >
                {t} ({t === 'surveys' ? stats?.total_surveys : stats?.total_users})
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${tab}...`}
            className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] text-sm outline-none focus:border-[var(--accent)] transition"
            style={{ width: 220 }}
          />
        </div>

        {tab === 'surveys' && (
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--secondary-bg)] text-[var(--text-secondary)]">
                  <th className="px-4 py-3 text-left font-medium">Survey</th>
                  <th className="px-4 py-3 text-left font-medium">Creator</th>
                  <th className="px-4 py-3 text-left font-medium">Questions</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSurveys.map((survey, i) => (
                  <tr key={survey.id} className={`border-t border-[var(--border)] ${i % 2 === 0 ? '' : 'bg-[var(--secondary-bg)] bg-opacity-40'}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-main)]">{survey.title}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">{survey.description || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{survey.creator?.username || '—'}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{survey.questions?.length || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${survey.is_active ? 'border-green-400 text-green-600 bg-green-50 dark:bg-green-950' : 'border-gray-300 text-gray-500 bg-gray-50 dark:bg-gray-900'}`}>
                        {survey.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSurveyActive(survey)}
                        className="px-3 py-1 rounded-lg border border-[var(--border)] text-xs text-[var(--text-main)] hover:bg-[var(--secondary-bg)] transition"
                      >
                        {survey.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSurveys.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">No surveys found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'users' && (
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--secondary-bg)] text-[var(--text-secondary)]">
                  <th className="px-4 py-3 text-left font-medium">Username</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, i) => (
                  <tr key={user.id} className={`border-t border-[var(--border)] ${i % 2 === 0 ? '' : 'bg-[var(--secondary-bg)] bg-opacity-40'}`}>
                    <td className="px-4 py-3 font-medium text-[var(--text-main)]">{user.username}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{user.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${user.is_active !== false ? 'border-green-400 text-green-600 bg-green-50 dark:bg-green-950' : 'border-gray-300 text-gray-500 bg-gray-50 dark:bg-gray-900'}`}>
                        {user.is_active !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${user.is_staff ? 'border-purple-400 text-purple-600 bg-purple-50 dark:bg-purple-950' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}>
                        {user.is_staff ? 'Staff' : 'Member'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => toggleUser(user, 'is_active')} disabled={!!togglingId}
                          className="px-2 py-1 rounded text-xs border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--secondary-bg)] disabled:opacity-50 transition">
                          {user.is_active !== false ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => toggleUser(user, 'is_staff')} disabled={!!togglingId}
                          className="px-2 py-1 rounded text-xs border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--secondary-bg)] disabled:opacity-50 transition">
                          {user.is_staff ? '− Staff' : '+ Staff'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
