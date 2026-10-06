import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { AsyncContent, Badge, EmptyState, PageHeader, StatusBadge } from '../components/ui/Common';
import { Field, FormGrid, Toggle } from '../components/ui/Form';
import { ImageInput } from '../components/ui/ImageInput';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';

const EMPTY = { name: '', slug: '', icon: '', image: '', tagline: '', order: 0, showInNav: true, isActive: true };

export default function Categories() {
  const notify = useToast();
  const { data: categories, loading, error, reload } = useApi(() => api.get('/categories'), [], []);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit

  const handleDelete = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await api.del(`/categories/${cat._id}`);
      notify('Category deleted.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Top-level categories shown in the store's navbar (e.g. Jewellery, Decorative Items)."
        actions={<button className="btn btn-primary" onClick={() => setEditing(EMPTY)}>+ Add category</button>}
      />

      <div className="card">
        <AsyncContent
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={categories.length === 0}
          empty={<EmptyState title="No categories yet." action={<button className="btn btn-primary" onClick={() => setEditing(EMPTY)}>Add your first category</button>} />}
        >
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Sub-categories</th>
                  <th>Products</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="cell-title">
                        <span className="cell-icon">{c.icon || '🗂️'}</span>
                        <div>
                          <strong>{c.name}</strong>
                          <div className="muted small">/{c.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Link to={`/subcategories?category=${c._id}`}>{c.subCategories.length} sub-categories</Link>
                    </td>
                    <td>{c.productCount}</td>
                    <td>{c.order}</td>
                    <td>
                      <div className="row">
                        <StatusBadge active={c.isActive} />
                        {!c.showInNav && <Badge>Not in nav</Badge>}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="btn btn-sm" onClick={() => setEditing(c)}>Edit</button>
                      <button className="btn btn-sm btn-danger-ghost" onClick={() => handleDelete(c)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncContent>
      </div>

      {editing && (
        <CategoryForm
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

function CategoryForm({ initial, onClose, onSaved }) {
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
      if (isNew) await api.post('/categories', body);
      else await api.put(`/categories/${initial._id}`, body);
      notify(isNew ? 'Category created.' : 'Category updated.');
      onSaved();
    } catch (err) {
      notify(err.message, 'error');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isNew ? 'Add category' : `Edit ${initial.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="category-form" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit}>
        <FormGrid>
          <Field label="Name *"><input value={form.name} onChange={(e) => set('name')(e.target.value)} required /></Field>
          <Field label="URL slug" hint="Leave blank to generate from the name."><input value={form.slug} onChange={(e) => set('slug')(e.target.value)} /></Field>
          <Field label="Icon" hint="An emoji, e.g. 💍"><input value={form.icon} onChange={(e) => set('icon')(e.target.value)} /></Field>
          <Field label="Display order" hint="Lower numbers appear first."><input type="number" value={form.order} onChange={(e) => set('order')(e.target.value)} /></Field>
          <Field label="Tagline" span={2}><input value={form.tagline} onChange={(e) => set('tagline')(e.target.value)} placeholder="Shown on the category page banner" /></Field>
          <Field label="Banner image" span={2}><ImageInput value={form.image} onChange={set('image')} /></Field>
        </FormGrid>
        <div className="row toggles">
          <Toggle label="Active (visible in store)" checked={form.isActive} onChange={set('isActive')} />
          <Toggle label="Show in navbar" checked={form.showInNav} onChange={set('showInNav')} />
        </div>
      </form>
    </Modal>
  );
}
