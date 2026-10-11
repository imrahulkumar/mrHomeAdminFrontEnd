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

const REPEATS = [
  { id: 'daily', label: 'Every day' },
  { id: 'alternate', label: 'Every other day' },
  { id: 'weekly', label: 'Weekly on selected days' },
  { id: 'once', label: 'One time, on a date' },
  { id: 'everyMinute', label: 'Every minute (testing)' },
  { id: 'every15s', label: 'Every 15 seconds (testing)' },
];
const INTERVAL_REPEATS = { everyMinute: 'minute', every15s: '15 seconds' };
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TABS = [
  { id: 'sent', label: 'Sent' },
  { id: 'scheduled', label: 'Scheduled / repeating' },
];

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in the admin's time zone
const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

const EMPTY_CONTENT = { title: '', message: '', image: '', product: '', link: '', audience: 'all', recipients: [], isActive: true };
const emptySent = () => ({ ...EMPTY_CONTENT, mode: 'now', expiresAt: '' });
const emptySchedule = () => ({
  ...EMPTY_CONTENT, mode: 'schedule', repeat: 'daily', weekdays: [], time: '09:00', startDate: today(), endDate: '', timezone: browserTimeZone(), replacePrevious: true,
});

// <input type="datetime-local"> works in local time without a zone; the API stores ISO dates.
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const formatTime = (hhmm) => (hhmm ? new Date(`2000-01-01T${hhmm}`).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '…');
const formatDay = (ymd) => (ymd ? new Date(`${ymd}T00:00`).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '…');

/** "Every Mon, Thu at 9:00 am · until 31 Dec 2026" */
function describeSchedule(s) {
  const at = `at ${formatTime(s.time)}`;
  const when = {
    once: `Once on ${formatDay(s.startDate)} ${at}`,
    daily: `Every day ${at}`,
    alternate: `Every other day ${at}`,
    weekly: `Every ${[...s.weekdays].sort().map((d) => WEEKDAYS[d]).join(', ')} ${at}`,
    everyMinute: `Every minute from ${formatDay(s.startDate)}, ${formatTime(s.time)}`,
    every15s: `Every 15 seconds from ${formatDay(s.startDate)}, ${formatTime(s.time)}`,
  }[s.repeat];
  return s.endDate && s.repeat !== 'once' ? `${when} · until ${formatDay(s.endDate)}` : when;
}

function scheduleStatus(s) {
  if (s.isActive) return <Badge tone="success">Active</Badge>;
  const finished = (s.repeat === 'once' && s.runCount > 0) || (s.endDate && s.endDate < today());
  return finished ? <Badge>Finished</Badge> : <Badge tone="warning">Paused</Badge>;
}

export default function Notifications() {
  const [tab, setTab] = useState('sent');
  const [editing, setEditing] = useState(null);
  const [version, setVersion] = useState(0); // bump to make the lists reload

  const newButton = (
    <button className="btn btn-primary" onClick={() => setEditing(tab === 'sent' ? emptySent() : emptySchedule())}>
      {tab === 'sent' ? '+ New notification' : '+ New schedule'}
    </button>
  );

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Announce new arrivals and offers in the store's 🔔 bell, now or automatically on a schedule."
        actions={newButton}
      />

      <div className="segmented notification-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sent'
        ? <SentList key={version} onEdit={setEditing} newButton={newButton} />
        : <ScheduleList key={version} onEdit={setEditing} newButton={newButton} />}

      {editing && (
        <NotificationForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(mode) => {
            setEditing(null);
            setTab(mode === 'now' ? 'sent' : 'scheduled');
            setVersion((v) => v + 1);
          }}
        />
      )}
    </>
  );
}

function AudienceCell({ item }) {
  return (
    <>
      <Badge tone="info">{AUDIENCE_LABEL[item.audience]}</Badge>
      {item.audience === 'users' && <p className="muted small">{item.recipients.map((r) => r.name).join(', ')}</p>}
    </>
  );
}

function TitleCell({ item, extra }) {
  return (
    <div className="cell-title">
      {item.image ? <img src={item.image} alt="" className="cell-img" /> : <span className="cell-img placeholder">🔔</span>}
      <div>
        <strong>{item.title}</strong> {extra}
        <p className="muted small notification-snippet">{item.message}</p>
      </div>
    </div>
  );
}

function SentList({ onEdit, newButton }) {
  const notify = useToast();
  const [page, setPage] = useState(1);
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

  return (
    <div className="card">
      <AsyncContent
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={data.items.length === 0}
        empty={<EmptyState title="No notifications sent yet." action={newButton} />}
      >
        <div className="table-wrap">
          <table className="table table-stack">
            <thead><tr><th>Notification</th><th>Sent to</th><th>Status</th><th>Read by</th><th>Sent</th><th /></tr></thead>
            <tbody>
              {data.items.map((n) => {
                const expired = n.expiresAt && new Date(n.expiresAt) < new Date();
                return (
                  <tr key={n._id}>
                    <td><TitleCell item={n} extra={n.schedule && <Badge>Auto</Badge>} /></td>
                    <td data-label="Sent to"><AudienceCell item={n} /></td>
                    <td data-label="Status">{expired ? <Badge tone="warning">Expired</Badge> : <StatusBadge active={n.isActive} />}</td>
                    <td data-label="Read by">{n.readCount}</td>
                    <td data-label="Sent" className="small">{formatDate(n.createdAt)}</td>
                    <td className="actions">
                      <button
                        className="btn btn-sm"
                        onClick={() => onEdit({ ...n, mode: 'now', product: n.product?._id ?? '', expiresAt: toLocalInput(n.expiresAt) })}
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
  );
}

function ScheduleList({ onEdit, newButton }) {
  const notify = useToast();
  const { data: schedules, loading, error, reload } = useApi(() => api.get('/notifications/schedules'), [], []);

  const run = async (action, success) => {
    try {
      await action();
      notify(success);
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const toggleActive = (s) =>
    run(() => api.put(`/notifications/schedules/${s._id}`, { isActive: !s.isActive }), s.isActive ? 'Schedule paused.' : 'Schedule resumed.');

  const sendNow = (s) => {
    if (!confirm(`Send "${s.title}" now? The regular schedule is not changed.`)) return;
    run(() => api.post(`/notifications/schedules/${s._id}/send`), 'Notification sent.');
  };

  const handleDelete = (s) => {
    if (!confirm(`Delete schedule "${s.title}"? Notifications it already sent stay in the Sent list.`)) return;
    run(() => api.del(`/notifications/schedules/${s._id}`), 'Schedule deleted.');
  };

  return (
    <div className="card">
      <AsyncContent
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={schedules.length === 0}
        empty={<EmptyState title="No scheduled notifications yet. Create one to send it automatically, e.g. every morning." action={newButton} />}
      >
        <div className="table-wrap">
          <table className="table table-stack">
            <thead><tr><th>Notification</th><th>Sent to</th><th>Repeats</th><th>Next send</th><th>Sent so far</th><th>Status</th><th /></tr></thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s._id}>
                  <td><TitleCell item={s} /></td>
                  <td data-label="Sent to"><AudienceCell item={s} /></td>
                  <td data-label="Repeats" className="small">{describeSchedule(s)}</td>
                  <td data-label="Next send" className="small">{s.nextRunAt ? formatDate(s.nextRunAt) : '—'}</td>
                  <td data-label="Sent so far" className="small">
                    {s.runCount}
                    {s.lastRunAt && <span className="muted"> · last {formatDate(s.lastRunAt)}</span>}
                  </td>
                  <td data-label="Status">{scheduleStatus(s)}</td>
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => onEdit({ ...s, mode: 'schedule', product: s.product?._id ?? '', endDate: s.endDate ?? '' })}>Edit</button>
                    <button className="btn btn-sm" onClick={() => sendNow(s)}>Send now</button>
                    <button className="btn btn-sm" onClick={() => toggleActive(s)}>{s.isActive ? 'Pause' : 'Resume'}</button>
                    <button className="btn btn-sm btn-danger-ghost" onClick={() => handleDelete(s)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncContent>
    </div>
  );
}

function NotificationForm({ initial, onClose, onSaved }) {
  const notify = useToast();
  const [form, setForm] = useState(() => ({ ...(initial.mode === 'schedule' ? emptySchedule() : emptySent()), ...initial }));
  const [saving, setSaving] = useState(false);
  const { data: products } = useApi(() => api.get('/products', { limit: 100, sort: 'name' }), [], { items: [] });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const isNew = !initial._id;
  const scheduled = form.mode === 'schedule';
  const audience = AUDIENCES.find((a) => a.id === form.audience);

  // Switching between "send now" and "schedule" on a new notification keeps what was typed.
  const setMode = (mode) => setForm((f) => ({ ...(mode === 'schedule' ? emptySchedule() : emptySent()), ...pickContent(f), mode }));
  const toggleWeekday = (d) => set('weekdays')(form.weekdays.includes(d) ? form.weekdays.filter((x) => x !== d) : [...form.weekdays, d]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.audience === 'users' && !form.recipients.length) return notify('Pick at least one customer.', 'error');
    if (scheduled && form.repeat === 'weekly' && !form.weekdays.length) return notify('Pick at least one day of the week.', 'error');
    setSaving(true);
    try {
      const { mode, ...rest } = form;
      const body = { ...rest, recipients: form.recipients.map((r) => r._id) };
      if (!scheduled) body.expiresAt = form.expiresAt ? new Date(form.expiresAt).toISOString() : '';
      const path = scheduled ? '/notifications/schedules' : '/notifications';
      if (isNew) await api.post(path, body);
      else await api.put(`${path}/${initial._id}`, body);
      notify(scheduled ? (isNew ? 'Schedule created.' : 'Schedule updated.') : isNew ? 'Notification sent.' : 'Notification updated.');
      onSaved(mode);
    } catch (err) {
      notify(err.message, 'error');
      setSaving(false);
    }
  };

  const title = isNew ? 'New notification' : scheduled ? 'Edit schedule' : 'Edit notification';
  const submitLabel = saving ? 'Saving…' : !isNew ? 'Save' : scheduled ? 'Create schedule' : 'Send notification';

  return (
    <Modal
      wide
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="notification-form" disabled={saving}>{submitLabel}</button>
        </>
      }
    >
      <form id="notification-form" onSubmit={handleSubmit}>
        <FormGrid>
          {isNew && (
            <Field label="When" span={2} as="div" hint={scheduled ? 'Sent automatically on the timetable below.' : 'Shows up in the store right away.'}>
              <Segmented
                options={[{ id: 'now', label: 'Send now' }, { id: 'schedule', label: 'Schedule / repeat' }]}
                value={form.mode}
                onChange={setMode}
              />
            </Field>
          )}

          <Field label="Send to" span={2} as="div" hint={audience.hint}>
            <Segmented options={AUDIENCES} value={form.audience} onChange={set('audience')} />
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

          {scheduled ? (
            <>
              <h4 className="span-2 form-subhead">Timetable</h4>
              <Field label="Repeat">
                <select value={form.repeat} onChange={(e) => set('repeat')(e.target.value)}>
                  {REPEATS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </Field>
              <Field
                label={INTERVAL_REPEATS[form.repeat] ? 'First send at *' : 'Time *'}
                hint={INTERVAL_REPEATS[form.repeat]
                  ? `Then every ${INTERVAL_REPEATS[form.repeat]}. A past time starts right away. Time zone: ${form.timezone}`
                  : `Your time zone: ${form.timezone}`}
              >
                <input type="time" value={form.time} onChange={(e) => set('time')(e.target.value)} required />
              </Field>
              {form.repeat === 'weekly' && (
                <Field label="On these days *" span={2} as="div">
                  <div className="weekday-picker">
                    {WEEKDAYS.map((label, d) => (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={form.weekdays.includes(d)}
                        className={form.weekdays.includes(d) ? 'active' : ''}
                        onClick={() => toggleWeekday(d)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Field>
              )}
              <Field
                label={form.repeat === 'once' ? 'Date *' : 'Starts on *'}
                hint={form.repeat === 'alternate' ? 'Sends on this day, then every second day after it.' : undefined}
              >
                <input type="date" value={form.startDate} onChange={(e) => set('startDate')(e.target.value)} required />
              </Field>
              {form.repeat !== 'once' && (
                <Field label="Ends on" hint="Optional. Leave empty to repeat until you pause it.">
                  <input type="date" value={form.endDate} min={form.startDate} onChange={(e) => set('endDate')(e.target.value)} />
                </Field>
              )}
              <p className="span-2 schedule-summary">📅 {describeSchedule(form)}</p>
            </>
          ) : (
            <Field label="Expires on" hint="Optional. Hidden from the store after this time.">
              <input type="datetime-local" value={form.expiresAt} onChange={(e) => set('expiresAt')(e.target.value)} />
            </Field>
          )}
        </FormGrid>
        <div className="row toggles">
          <Toggle label={scheduled ? 'Schedule active' : 'Active'} checked={form.isActive} onChange={set('isActive')} />
          {scheduled && form.repeat !== 'once' && (
            <Toggle label="Replace the previous one when sending a new one" checked={form.replacePrevious} onChange={set('replacePrevious')} />
          )}
        </div>
      </form>
    </Modal>
  );
}

const pickContent = (f) => Object.fromEntries(Object.keys(EMPTY_CONTENT).map((k) => [k, f[k]]));

function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={value === o.id ? 'active' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
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
