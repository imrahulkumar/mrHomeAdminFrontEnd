import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { AsyncContent, EmptyState, PageHeader, StatusBadge } from '../components/ui/Common';
import { Field, FormGrid, Toggle } from '../components/ui/Form';
import { ImageInput } from '../components/ui/ImageInput';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';

const EMPTY = { name: '', slug: '', category: '', icon: '', image: '', order: 0, isActive: true };

export default function SubCategories() {
  const notify = useToast();
  const [params, setParams] = useSearchParams();
  const categoryFilter = params.get('category') ?? '';
  const { data: categories } = useApi(() => api.get('/categories'), [], []);
  const { data: subs, loading, error, reload } = useApi(() => api.get('/subcategories', { category: categoryFilter }), [categoryFilter], []);
  const [editing, setEditing] = useState(null);

  const handleDelete = async (sub) => {
    if (!confirm(`Delete sub-category "${sub.name}"?`)) return;
    try {
      await api.del(`/subcategories/${sub._id}`);
      notify('Sub-category deleted.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const openNew = () => setEditing({ ...EMPTY, category: categoryFilter || categories[0]?._id || '' });

  return (
    <>
      <PageHeader
        title="Sub-categories"
        subtitle="Used as filters inside each category (e.g. Rings, Necklaces inside Jewellery)."
        actions={<button className="btn btn-primary" onClick={openNew} disabled={!categories.length}>+ Add sub-category</button>}
      />

      <div className="toolbar">
        <select value={categoryFilter} onChange={(e) => setParams(e.target.value ? { category: e.target.value } : {})}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card">
        <AsyncContent
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={subs.length === 0}
          empty={<EmptyState title={categories.length ? 'No sub-categories here yet.' : 'Create a category first.'} />}
        >
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Sub-category</th><th>Parent category</th><th>Products</th><th>Order</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div className="cell-title">
                        <span className="cell-icon">{s.icon || '📁'}</span>
                        <div>
                          <strong>{s.name}</strong>
                          <div className="muted small">{s.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>{s.category?.name}</td>
                    <td>{s.productCount}</td>
                    <td>{s.order}</td>
                    <td><StatusBadge active={s.isActive} /></td>
                    <td className="actions">
                      <button className="btn btn-sm" onClick={() => setEditing({ ...s, category: s.category?._id })}>Edit</button>
                      <button className="btn btn-sm btn-danger-ghost" onClick={() => handleDelete(s)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncContent>
      </div>

      {editing && (
        <SubCategoryForm
          initial={editing}
          categories={categories}
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

function SubCategoryForm({ initial, categories, onClose, onSaved }) {
  const notify = useToast();
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const isNew = !initial._id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, order: Number(form.order) || 0 };
      if (isNew) await api.post('/subcategories', body);
      else await api.put(`/subcategories/${initial._id}`, body);
      notify(isNew ? 'Sub-category created.' : 'Sub-category updated.');
      onSaved();
    } catch (err) {
      notify(err.message, 'error');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isNew ? 'Add sub-category' : `Edit ${initial.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="sub-form" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </>
      }
    >
      <form id="sub-form" onSubmit={handleSubmit}>
        <FormGrid>
          <Field label="Parent category *" span={2}>
            <select value={form.category} onChange={(e) => set('category')(e.target.value)} required>
              <option value="" disabled>Choose…</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Name *"><input value={form.name} onChange={(e) => set('name')(e.target.value)} required /></Field>
          <Field label="URL slug" hint="Leave blank to generate from the name."><input value={form.slug} onChange={(e) => set('slug')(e.target.value)} /></Field>
          <Field label="Icon" hint="An emoji, e.g. 💍"><input value={form.icon} onChange={(e) => set('icon')(e.target.value)} /></Field>
          <Field label="Display order"><input type="number" value={form.order} onChange={(e) => set('order')(e.target.value)} /></Field>
          <Field label="Image" span={2}><ImageInput value={form.image} onChange={set('image')} /></Field>
        </FormGrid>
        <div className="row toggles">
          <Toggle label="Active (visible in store)" checked={form.isActive} onChange={set('isActive')} />
        </div>
      </form>
    </Modal>
  );
}
