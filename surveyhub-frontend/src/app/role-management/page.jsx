"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/authContext';
import { apiRequest } from '../../api/api';

export default function RoleManagementPage() {
  const { state } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [creating, setCreating] = useState(false);
  const [expandedRole, setExpandedRole] = useState(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!state.loading && !state.isAuthenticated) router.push('/auth');
  }, [state.loading, state.isAuthenticated, router]);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    Promise.all([
      apiRequest({ method: 'GET', url: '/api/admin/roles/' }),
      apiRequest({ method: 'GET', url: '/api/admin/stats/' }),
    ])
      .then(([r, stats]) => { setRoles(r); setUsers(stats.users || []); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [state.isAuthenticated]);

  const createRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setCreating(true);
    try {
      const role = await apiRequest({ method: 'POST', url: '/api/admin/roles/', data: { name: newRoleName.trim() } });
      setRoles(prev => [...prev, role]);
      setNewRoleName('');
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteRole = async (id) => {
    if (!confirm('Delete this role?')) return;
    try {
      await apiRequest({ method: 'DELETE', url: `/api/admin/roles/${id}/` });
      setRoles(prev => prev.filter(r => r.id !== id));
      if (expandedRole === id) setExpandedRole(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const assignUser = async (roleId) => {
    if (!assignUserId) return;
    setAssigning(true);
    try {
      const updated = await apiRequest({
        method: 'POST', url: `/api/admin/roles/${roleId}/assign/`,
        data: { user_id: parseInt(assignUserId) },
      });
      setRoles(prev => prev.map(r => r.id === roleId ? { ...r, member_count: updated.member_count } : r));
      setAssignUserId('');
    } catch (err) {
      alert(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const removeUser = async (roleId, userId) => {
    try {
      const updated = await apiRequest({
        method: 'DELETE', url: `/api/admin/roles/${roleId}/assign/`,
        data: { user_id: userId },
      });
      setRoles(prev => prev.map(r => r.id === roleId ? { ...r, member_count: updated.member_count } : r));
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
          <h1 className="page-title" style={{ fontSize: '1.6rem' }}>Role Management</h1>
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-950 dark:border-red-800 dark:text-red-400 w-full text-center">
            {error === 'Admin access required' ? 'Staff/admin access is required.' : error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-main)]">Role Management</h1>
          <p className="text-[var(--text-secondary)] mt-1">Create roles and assign users to control access.</p>
        </div>

        {/* Create role */}
        <form onSubmit={createRole} className="flex gap-3 mb-8">
          <input
            value={newRoleName}
            onChange={e => setNewRoleName(e.target.value)}
            placeholder="New role name (e.g. Analyst, Viewer)"
            className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition"
          />
          <button
            type="submit"
            disabled={creating || !newRoleName.trim()}
            className="px-5 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Role'}
          </button>
        </form>

        {roles.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-[var(--border)]">
            <p className="text-[var(--text-secondary)]">No roles yet. Create one above.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {roles.map(role => (
              <div key={role.id} className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[var(--text-main)]">{role.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--secondary-bg)] text-[var(--text-secondary)] border border-[var(--border)]">
                      {role.member_count} {role.member_count === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-main)] hover:bg-[var(--secondary-bg)] transition"
                    >
                      {expandedRole === role.id ? 'Collapse' : 'Manage'}
                    </button>
                    <button
                      onClick={() => deleteRole(role.id)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {expandedRole === role.id && (
                  <div className="border-t border-[var(--border)] px-5 py-4 bg-[var(--secondary-bg)] bg-opacity-40">
                    <div className="flex gap-3 mb-4">
                      <select
                        value={assignUserId}
                        onChange={e => setAssignUserId(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] text-sm outline-none focus:border-[var(--accent)] transition"
                      >
                        <option value="">Select user to add...</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.username} {u.email ? `(${u.email})` : ''}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => assignUser(role.id)}
                        disabled={assigning || !assignUserId}
                        className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                    <RoleMembers roleId={role.id} users={users} onRemove={removeUser} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function RoleMembers({ roleId, users, onRemove }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest({ method: 'GET', url: `/api/admin/roles/${roleId}/members/` })
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [roleId]);

  if (loading) return <p className="text-sm text-[var(--text-secondary)]">Loading members...</p>;
  if (!members.length) return <p className="text-sm text-[var(--text-muted)]">No members yet.</p>;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Current members</p>
      {members.map(m => (
        <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border)]">
          <span className="text-sm text-[var(--text-main)]">{m.username}</span>
          <button
            onClick={() => onRemove(roleId, m.id)}
            className="text-xs text-red-500 hover:text-red-700 transition"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
