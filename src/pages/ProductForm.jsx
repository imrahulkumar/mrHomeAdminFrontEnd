import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorState, Loader, PageHeader } from '../components/ui/Common';
import { Field, FormGrid, FormSection, Toggle } from '../components/ui/Form';
import { ImageListInput } from '../components/ui/ImageInput';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';

const EMPTY = {
  name: '', slug: '', description: '', category: '', subCategory: '', material: '',
  price: '', mrp: '', stock: 10, rating: 0, tags: '', images: [], isFeatured: false, isActive: true,
};

export default function ProductForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const notify = useToast();

  const { data: categories } = useApi(() => api.get('/categories'), [], []);
  const [form, setForm] = useState(isNew ? EMPTY : null);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    api
      .get(`/products/${id}`)
      .then((p) =>
        setForm({
          ...EMPTY,
          ...p,
          category: p.category?._id ?? '',
          subCategory: p.subCategory?._id ?? '',
          mrp: p.mrp ?? '',
          tags: (p.tags ?? []).join(', '),
        }),
      )
      .catch((err) => setLoadError(err.message));
  }, [id, isNew]);

  if (loadError) return <ErrorState message={loadError} />;
  if (!form) return <Loader />;

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setImages = (updater) => setForm((f) => ({ ...f, images: typeof updater === 'function' ? updater(f.images) : updater }));
  const subCategories = categories.find((c) => c._id === form.category)?.subCategories ?? [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      ...form,
      price: Number(form.price),
      mrp: form.mrp === '' ? null : Number(form.mrp),
      stock: Number(form.stock) || 0,
      rating: Number(form.rating) || 0,
      tags: form.tags,
    };
    try {
      if (isNew) await api.post('/products', body);
      else await api.put(`/products/${id}`, body);
      notify(isNew ? 'Product created.' : 'Product saved.');
      navigate('/products');
    } catch (err) {
      notify(err.message, 'error');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PageHeader
        title={isNew ? 'Add product' : `Edit: ${form.name}`}
        actions={
          <>
            <Link to="/products" className="btn">Cancel</Link>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>
          </>
        }
      />

      <div className="two-col">
        <div className="stack">
          <FormSection title="Basic details">
            <FormGrid>
              <Field label="Product name *" span={2}><input value={form.name} onChange={(e) => set('name')(e.target.value)} required /></Field>
              <Field label="Description" span={2}>
                <textarea rows={5} value={form.description} onChange={(e) => set('description')(e.target.value)} />
              </Field>
              <Field label="Material / metal" hint="Used as a filter in the store, e.g. 22K Gold, Brass">
                <input value={form.material} onChange={(e) => set('material')(e.target.value)} />
              </Field>
              <Field label="Tags" hint="Comma separated, helps search"><input value={form.tags} onChange={(e) => set('tags')(e.target.value)} /></Field>
            </FormGrid>
          </FormSection>

          <FormSection title="Images" description="Upload or paste URLs. The first image is shown on product cards.">
            <ImageListInput value={form.images} onChange={setImages} />
          </FormSection>

          <FormSection title="Pricing & inventory">
            <FormGrid>
              <Field label="Selling price (₹) *"><input type="number" min="0" value={form.price} onChange={(e) => set('price')(e.target.value)} required /></Field>
              <Field label="MRP (₹)" hint="Optional. Shown struck-through if higher than price."><input type="number" min="0" value={form.mrp} onChange={(e) => set('mrp')(e.target.value)} /></Field>
              <Field label="Stock"><input type="number" min="0" value={form.stock} onChange={(e) => set('stock')(e.target.value)} /></Field>
              <Field label="Rating (0–5)"><input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => set('rating')(e.target.value)} /></Field>
            </FormGrid>
          </FormSection>
        </div>

        <div className="stack">
          <FormSection title="Organisation">
            <Field label="Category *">
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subCategory: '' }))}
                required
              >
                <option value="" disabled>Choose…</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Sub-category">
              <select value={form.subCategory} onChange={(e) => set('subCategory')(e.target.value)} disabled={!form.category}>
                <option value="">None</option>
                {subCategories.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="URL slug" hint="Leave blank to generate from the name."><input value={form.slug} onChange={(e) => set('slug')(e.target.value)} /></Field>
          </FormSection>

          <FormSection title="Visibility">
            <div className="stack-sm">
              <Toggle label="Active (visible in store)" checked={form.isActive} onChange={set('isActive')} />
              <Toggle label="Featured on home page" checked={form.isFeatured} onChange={set('isFeatured')} />
            </div>
          </FormSection>

          {!isNew && (
            <FormSection title="Videos" description="Link YouTube videos to this product from the Videos page.">
              <Link to="/videos" className="btn btn-sm">Manage videos →</Link>
            </FormSection>
          )}
        </div>
      </div>
    </form>
  );
}
