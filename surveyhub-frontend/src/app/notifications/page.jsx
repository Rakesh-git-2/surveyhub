"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/authContext';
import { apiRequest } from '../../api/api';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsPage() {
  const { state } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!state.loading && !state.isAuthenticated) router.push('/auth');
  }, [state.loading, state.isAuthenticated, router]);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    apiRequest({ method: 'GET', url: '/api/notifications/' })
      .then(data => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [state.isAuthenticated]);

  const markRead = async (id) => {
    try {
      await apiRequest({ method: 'PATCH', url: `/api/notifications/${id}/read/` });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiRequest({ method: 'POST', url: '/api/notifications/read-all/' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      alert(err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  if (state.loading || loading) {
    return <main className="main-container"><div className="grid-center"><p className="text-[var(--text-secondary)]">Loading...</p></div></main>;
  }

  if (error) {
    return <main className="main-container"><div className="grid-center"><p className="text-red-500">{error}</p></div></main>;
  }

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-main)]">Notifications</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-main)] hover:bg-[var(--secondary-bg)] disabled:opacity-50 transition"
            >
              {markingAll ? 'Marking...' : 'Mark all as read'}
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-[var(--border)]">
            <p className="text-4xl mb-4">🔔</p>
            <p className="text-[var(--text-secondary)]">No notifications yet.</p>
            <p className="text-sm text-[var(--text-muted)] mt-2">You'll be notified when someone responds to your surveys.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition ${
                  n.is_read
                    ? 'border-[var(--border)] bg-[var(--card-bg)]'
                    : 'border-[var(--accent)] bg-[var(--card-bg)] shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-[var(--accent)]'}`} />
                    <div className="flex-1">
                      <p className={`text-sm ${n.is_read ? 'text-[var(--text-secondary)]' : 'text-[var(--text-main)] font-medium'}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-[var(--text-muted)]">{timeAgo(n.created_at)}</span>
                        {n.survey_id && (
                          <Link
                            href={`/survey-report/${n.survey_id}`}
                            className="text-xs text-[var(--accent)] hover:underline"
                          >
                            View report →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition shrink-0"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
