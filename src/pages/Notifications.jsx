import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AsyncContent, Badge, EmptyState, PageHeader, Pagination, StatusBadge } from '../components/ui/Common';
import { Field, FormGrid, Toggle } from '../components/ui/Form';
import { ImageInput } from '../components/ui/ImageInput';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { formatDate } from '../utils/format';

const AUDIENCES = [
  { id: 'all', label: 'Everyone', hint: 'All visitors: logged-in customers and guests.' },
  { id: 'registered', label: 'Registered', hint: 'Only customers who are logged in.' },
  { id: 'guests', label: 'Guests', hint: 'Only visitors who are not logged in.' },
  { id: 'users', label: 'Selected customers', hint: 'Only the customers you pick below.' },
];
const AUDIENCE_LABEL = Object.fromEntries(AUDIENCES.map((a) => [a.id, a.label]));

const EMPTY = { title: '', message: '', image: '', product: '', link: '', audience: 'all', recipients: [], expiresAt: '', isActive: true };

// <input type="datetime-local"> works in local time without a zone; the API stores ISO dates.
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function Notifications() {
  const notify = useToast();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const { data, loading, error, reload } = useApi(() => api.get('/notifications', { page }), [page], { items: [], total: 0, pages: 0 });

  const toggleActive = async (n) => {
    try {
      await api.put(`/notifications/${n._id}`, { isActive: !n.isActive });
      notify(n.isActive ? 'Notification hidden.' : 'Notification shown again.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDelete = async (n) => {
    if (!confirm(`Delete notification "${n.title}"? It will disappear for everyone.`)) return;
    try {
      await api.del(`/notifications/${n._id}`);
      notify('Notification deleted.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const newButton = <button className="btn btn-primary" onClick={() => setEditing(EMPTY)}>+ New notification</button>;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Announce new arrivals and offers. They appear in the store's 🔔 bell."
        actions={newButton}
      />

      <div className="card">
        <AsyncContent
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={data.items.length === 0}
          empty={<EmptyState title="No notifications sent yet." action={newButton} />}
        >
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Notification</th><th>Sent to</th><th>Status</th><th>Read by</th><th>Sent</th><th /></tr></thead>
              <tbody>
                {data.items.map((n) => {
                  const expired = n.expiresAt && new Date(n.expiresAt) < new Date();
                  return (
                    <tr key={n._id}>
                      <td>
                        <div className="cell-title">
                          {n.image ? <img src={n.image} alt="" className="cell-img" /> : <span className="cell-img placeholder">🔔</span>}
                          <div>
                            <strong>{n.title}</strong>
                            <p className="muted small notification-snippet">{n.message}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge tone="info">{AUDIENCE_LABEL[n.audience]}</Badge>
                        {n.audience === 'users' && (
                          <p className="muted small">{n.recipients.map((r) => r.name).join(', ')}</p>
                        )}
                      </td>
                      <td>
                        {expired ? <Badge tone="warning">Expired</Badge> : <StatusBadge active={n.isActive} />}
                      </td>
                      <td>{n.readCount}</td>
                      <td className="small">{formatDate(n.createdAt)}</td>
                      <td className="actions">
                        <button
                          className="btn btn-sm"
                          onClick={() => setEditing({ ...n, product: n.product?._id ?? '', expiresAt: toLocalInput(n.expiresAt) })}
                        >
                          Edit
                        </button>
                        <button className="btn btn-sm" onClick={() => toggleActive(n)}>{n.isActive ? 'Hide' : 'Show'}</button>
                        <button className="btn btn-sm btn-danger-ghost" onClick={() => handleDelete(n)}>Delete</button>
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

      {editing && (
        <NotificationForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </>
  );
}

function NotificationForm({ initial, onClose, onSaved }) {
  const notify = useToast();
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const { data: products } = useApi(() => api.get('/products', { limit: 100, sort: 'name' }), [], { items: [] });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const isNew = !initial._id;
  const audience = AUDIENCES.find((a) => a.id === form.audience);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.audience === 'users' && !form.recipients.length) return notify('Pick at least one customer.', 'error');
    setSaving(true);
    try {
      const body = {
        ...form,
        recipients: form.recipients.map((r) => r._id),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : '',
      };
      if (isNew) await api.post('/notifications', body);
      else await api.put(`/notifications/${initial._id}`, body);
      notify(isNew ? 'Notification sent.' : 'Notification updated.');
      onSaved();
    } catch (err) {
      notify(err.message, 'error');
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title={isNew ? 'New notification' : 'Edit notification'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="notification-form" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Send notification' : 'Save'}
          </button>
        </>
      }
    >
      <form id="notification-form" onSubmit={handleSubmit}>
        <FormGrid>
          <Field label="Send to" span={2} as="div" hint={audience.hint}>
            <div className="segmented" role="radiogroup">
              {AUDIENCES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={form.audience === a.id}
                  className={form.audience === a.id ? 'active' : ''}
                  onClick={() => set('audience')(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </Field>
          {form.audience === 'users' && (
            <Field label="Customers *" span={2} as="div">
              <RecipientPicker value={form.recipients} onChange={set('recipients')} />
            </Field>
          )}
          <Field label="Title *" span={2}>
            <input value={form.title} onChange={(e) => set('title')(e.target.value)} maxLength={120} placeholder="New arrival: Kundan bridal set" required />
          </Field>
          <Field label="Message *" span={2}>
            <textarea rows={3} value={form.message} onChange={(e) => set('message')(e.target.value)} maxLength={1000} required />
          </Field>
          <Field label="Image" span={2} as="div"><ImageInput value={form.image} onChange={set('image')} /></Field>
          <Field label="Links to product" hint="The “View” button opens this product.">
            <select value={form.product} onChange={(e) => set('product')(e.target.value)}>
              <option value="">— None —</option>
              {products.items.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="…or link" hint="Used when no product is chosen, e.g. /shop/rings">
            <input value={form.link} onChange={(e) => set('link')(e.target.value)} disabled={Boolean(form.product)} placeholder="/shop/…" />
          </Field>
          <Field label="Expires on" hint="Optional. Hidden from the store after this time.">
            <input type="datetime-local" value={form.expiresAt} onChange={(e) => set('expiresAt')(e.target.value)} />
          </Field>
        </FormGrid>
        <div className="row toggles">
          <Toggle label="Active" checked={form.isActive} onChange={set('isActive')} />        </div>
      </form>
    </Modal>
  );
}

/** Search customers by name/email and collect them as chips. `value` is a list of { _id, name, email }. */
function RecipientPicker({ value, onChange }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return undefined;
    }
    const timer = setTimeout(() => {
      api.get('/users', { q, role: 'user', limit: 8 }).then((d) => setResults(d.items)).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  const chosen = new Set(value.map((u) => u._id));
  const add = (u) => {
    onChange([...value, { _id: u._id, name: u.name, email: u.email }]);
    setQ('');
  };

  return (
    <div className="recipient-picker">
      {value.length > 0 && (
        <div className="row wrap">
          {value.map((u) => (
            <span key={u._id} className="chip" title={u.email}>
              {u.name}
              <button type="button" onClick={() => onChange(value.filter((x) => x._id !== u._id))} aria-label={`Remove ${u.name}`}>✕</button>
            </span>
          ))}
        </div>
      )}
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers by name or email…" />
      {results.length > 0 && (
        <ul className="recipient-results">
          {results.map((u) => (
            <li key={u._id}>
              <button type="button" onClick={() => add(u)} disabled={chosen.has(u._id)}>
                <strong>{u.name}</strong> <span className="muted small">{u.email}</span>
                {chosen.has(u._id) && <span className="muted small"> · added</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
