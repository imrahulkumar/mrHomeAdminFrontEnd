import { useState } from 'react';
import { api } from '../api/client';
import { AsyncContent, Badge, EmptyState, PageHeader, Pagination } from '../components/ui/Common';
import { Field, FormGrid } from '../components/ui/Form';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { formatDate } from '../utils/format';

export default function Users() {
  const notify = useToast();
  const { user: me } = useAuth();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);

  const { data, loading, error, reload } = useApi(() => api.get('/users', { q, role, page }), [q, role, page], { items: [], total: 0, pages: 0 });

  const update = async (u, changes, message) => {
    if (!confirm(message)) return;
    try {
      await api.patch(`/users/${u._id}`, changes);
      notify('User updated.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Customers & Admins"
        subtitle={`${data.total} accounts`}
        actions={<button className="btn btn-primary" onClick={() => setAdding(true)}>+ Add admin</button>}
      />

      <div className="toolbar">
        <input type="search" placeholder="Search name or email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          <option value="user">Customers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="card">
        <AsyncContent loading={loading} error={error} onRetry={reload} isEmpty={data.items.length === 0} empty={<EmptyState title="No users found." />}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th /></tr></thead>
              <tbody>
                {data.items.map((u) => {
                  const isMe = u._id === me._id;
                  return (
                    <tr key={u._id}>
                      <td><strong>{u.name}</strong>{isMe && <span className="muted small"> (you)</span>}</td>
                      <td>{u.email}</td>
                      <td><Badge tone={u.role === 'admin' ? 'info' : 'neutral'}>{u.role}</Badge></td>
                      <td><Badge tone={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Disabled'}</Badge></td>
                      <td className="small">{formatDate(u.createdAt)}</td>
                      <td className="actions">
                        {!isMe && (
                          <>
                            <button
                              className="btn btn-sm"
                              onClick={() => update(u, { role: u.role === 'admin' ? 'user' : 'admin' }, u.role === 'admin' ? `Remove admin access from ${u.name}?` : `Give ${u.name} full admin access?`)}
                            >
                              {u.role === 'admin' ? 'Make customer' : 'Make admin'}
                            </button>
                            <button
                              className="btn btn-sm btn-danger-ghost"
                              onClick={() => update(u, { isActive: !u.isActive }, `${u.isActive ? 'Disable' : 'Enable'} ${u.name}'s account?`)}
                            >
                              {u.isActive ? 'Disable' : 'Enable'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={data.pages} onChange={setPage} />
        </AsyncContent>
      </div>

      {adding && <AddAdmin onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); }} />}
    </>
  );
}

function AddAdmin({ onClose, onSaved }) {
  const notify = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', { ...form, role: 'admin' });
      notify('Admin account created.');
      onSaved();
    } catch (err) {
      notify(err.message, 'error');
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Add admin"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="admin-form" disabled={saving}>{saving ? 'Creating…' : 'Create admin'}</button>
        </>
      }
    >
      <form id="admin-form" onSubmit={handleSubmit}>
        <FormGrid>
          <Field label="Name *" span={2}><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Email *"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Password *" hint="At least 6 characters"><input type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
        </FormGrid>
      </form>
    </Modal>
  );
}
