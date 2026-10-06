import { useState } from 'react';
import { api } from '../api/client';
import { AsyncContent, Badge, EmptyState, PageHeader, StatusBadge } from '../components/ui/Common';
import { Field, FormGrid, Toggle } from '../components/ui/Form';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { youTubeId } from '../utils/format';

const EMPTY = { title: '', youtubeUrl: '', description: '', product: '', category: '', showOnHome: true, order: 0, isActive: true };

export default function Videos() {
  const notify = useToast();
  const { data: videos, loading, error, reload } = useApi(() => api.get('/videos'), [], []);
  const [editing, setEditing] = useState(null);

  const handleDelete = async (v) => {
    if (!confirm(`Delete video "${v.title}"?`)) return;
    try {
      await api.del(`/videos/${v._id}`);
      notify('Video deleted.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="YouTube Videos"
        subtitle="Show videos on the home page, on a category page, or on a product page."
        actions={<button className="btn btn-primary" onClick={() => setEditing(EMPTY)}>+ Add video</button>}
      />

      <AsyncContent
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={videos.length === 0}
        empty={<div className="card"><EmptyState title="No videos yet." action={<button className="btn btn-primary" onClick={() => setEditing(EMPTY)}>Add a YouTube video</button>} /></div>}
      >
        <div className="video-grid">
          {videos.map((v) => (
            <article key={v._id} className="card video-card">
              <a href={v.youtubeUrl} target="_blank" rel="noreferrer" className="video-thumb">
                <img src={`https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`} alt="" />
                <span className="play">▶</span>
              </a>
              <div className="video-body">
                <strong>{v.title}</strong>
                <div className="row wrap">
                  <StatusBadge active={v.isActive} />
                  {v.showOnHome && <Badge tone="info">Home page</Badge>}
                  {v.category && <Badge>{v.category.name}</Badge>}
                  {v.product && <Badge>{v.product.name}</Badge>}
                </div>
                <div className="row">
                  <button
                    className="btn btn-sm"
                    onClick={() => setEditing({ ...v, product: v.product?._id ?? '', category: v.category?._id ?? '' })}
                  >
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger-ghost" onClick={() => handleDelete(v)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </AsyncContent>

      {editing && (
        <VideoForm
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

function VideoForm({ initial, onClose, onSaved }) {
  const notify = useToast();
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const { data: categories } = useApi(() => api.get('/categories'), [], []);
  const { data: products } = useApi(() => api.get('/products', { limit: 100, sort: 'name' }), [], { items: [] });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const isNew = !initial._id;
  const previewId = youTubeId(form.youtubeUrl);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!previewId) return notify('Please enter a valid YouTube link.', 'error');
    setSaving(true);
    try {
      const body = { ...form, order: Number(form.order) || 0 };
      if (isNew) await api.post('/videos', body);
      else await api.put(`/videos/${initial._id}`, body);
      notify(isNew ? 'Video added.' : 'Video updated.');
      onSaved();
    } catch (err) {
      notify(err.message, 'error');
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title={isNew ? 'Add YouTube video' : 'Edit video'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="video-form" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </>
      }
    >
      <form id="video-form" onSubmit={handleSubmit}>
        <FormGrid>
          <Field label="YouTube link *" span={2} hint="Any YouTube URL: watch, youtu.be, shorts or embed.">
            <input value={form.youtubeUrl} onChange={(e) => set('youtubeUrl')(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" required />
          </Field>
          {previewId && (
            <div className="span-2 video-preview">
              <iframe src={`https://www.youtube.com/embed/${previewId}`} title="Preview" allowFullScreen />
            </div>
          )}
          <Field label="Title *" span={2}><input value={form.title} onChange={(e) => set('title')(e.target.value)} required /></Field>
          <Field label="Description" span={2}><textarea rows={3} value={form.description} onChange={(e) => set('description')(e.target.value)} /></Field>
          <Field label="Show on category page">
            <select value={form.category} onChange={(e) => set('category')(e.target.value)}>
              <option value="">— None —</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Show on product page">
            <select value={form.product} onChange={(e) => set('product')(e.target.value)}>
              <option value="">— None —</option>
              {products.items.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Display order"><input type="number" value={form.order} onChange={(e) => set('order')(e.target.value)} /></Field>
        </FormGrid>
        <div className="row toggles">
          <Toggle label="Active" checked={form.isActive} onChange={set('isActive')} />
          <Toggle label="Show on home page" checked={form.showOnHome} onChange={set('showOnHome')} />
        </div>
      </form>
    </Modal>
  );
}
