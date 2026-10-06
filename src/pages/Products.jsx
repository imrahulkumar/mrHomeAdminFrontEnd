import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { AsyncContent, Badge, EmptyState, PageHeader, Pagination, StatusBadge } from '../components/ui/Common';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { formatPrice } from '../utils/format';

export default function Products() {
  const notify = useToast();
  const [params, setParams] = useSearchParams();
  const query = {
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    status: params.get('status') ?? 'all',
    page: Number(params.get('page')) || 1,
  };
  const [search, setSearch] = useState(query.q);

  const { data: categories } = useApi(() => api.get('/categories'), [], []);
  const { data, loading, error, reload } = useApi(
    () => api.get('/products', { ...query, sort: 'newest', limit: 20 }),
    [params.toString()],
    { items: [], total: 0, pages: 0 },
  );

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  // Debounce the search box into the URL (only re-run when the typed text changes).
  useEffect(() => {
    const t = setTimeout(() => search !== query.q && setParam('q', search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (p) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.del(`/products/${p._id}`);
      notify('Product deleted.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const toggleActive = async (p) => {
    try {
      await api.put(`/products/${p._id}`, { isActive: !p.isActive });
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${data.total} products`}
        actions={<Link to="/products/new" className="btn btn-primary">+ Add product</Link>}
      />

      <div className="toolbar">
        <input type="search" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={query.category} onChange={(e) => setParam('category', e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={query.status} onChange={(e) => setParam('status', e.target.value)}>
          <option value="all">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Hidden</option>
        </select>
      </div>

      <div className="card">
        <AsyncContent
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={data.items.length === 0}
          empty={<EmptyState title="No products found." action={<Link to="/products/new" className="btn btn-primary">Add a product</Link>} />}
        >
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="cell-title">
                        {p.images?.[0] ? <img src={p.images[0]} alt="" className="cell-img" /> : <span className="cell-img placeholder">{p.subCategory?.icon || p.category?.icon || '📦'}</span>}
                        <div>
                          <Link to={`/products/${p._id}`}><strong>{p.name}</strong></Link>
                          <div className="muted small">{p.material}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {p.category?.name}
                      {p.subCategory && <div className="muted small">{p.subCategory.name}</div>}
                    </td>
                    <td>
                      {formatPrice(p.price)}
                      {p.mrp > p.price && <div className="muted small strike">{formatPrice(p.mrp)}</div>}
                    </td>
                    <td className={p.stock === 0 ? 'text-danger' : ''}>{p.stock}</td>
                    <td>
                      <div className="row">
                        <button className="badge-btn" onClick={() => toggleActive(p)} title="Click to toggle">
                          <StatusBadge active={p.isActive} />
                        </button>
                        {p.isFeatured && <Badge tone="info">Featured</Badge>}
                      </div>
                    </td>
                    <td className="actions">
                      <Link className="btn btn-sm" to={`/products/${p._id}`}>Edit</Link>
                      <button className="btn btn-sm btn-danger-ghost" onClick={() => handleDelete(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={query.page} pages={data.pages} onChange={(p) => setParam('page', String(p))} />
        </AsyncContent>
      </div>
    </>
  );
}
