import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { AsyncContent, OrderBadge, PageHeader } from '../components/ui/Common';
import { useApi } from '../hooks/useApi';
import { formatDate, formatPrice, ORDER_STATUSES } from '../utils/format';

export default function Dashboard() {
  const { data, loading, error, reload } = useApi(() => api.get('/dashboard'));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="An overview of your store" />
      <AsyncContent loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <div className="stats">
              <Stat label="Revenue" value={formatPrice(data.revenue)} accent />
              <Stat label="Orders" value={data.counts.orders} to="/orders" />
              <Stat label="Products" value={data.counts.products} to="/products" />
              <Stat label="Categories" value={data.counts.categories} to="/categories" />
              <Stat label="Customers" value={data.counts.customers} to="/users" />
              <Stat label="Videos" value={data.counts.videos} to="/videos" />
            </div>

            <div className="two-col">
              <section className="card">
                <div className="card-header">
                  <h3>Recent orders</h3>
                  <Link to="/orders">View all</Link>
                </div>
                {data.recentOrders.length === 0 ? (
                  <p className="muted pad">No orders yet.</p>
                ) : (
                  <table className="table">
                    <tbody>
                      {data.recentOrders.map((o) => (
                        <tr key={o._id}>
                          <td>
                            <strong>{o.orderNumber}</strong>
                            <div className="muted small">{o.user?.name} · {formatDate(o.createdAt)}</div>
                          </td>
                          <td>{formatPrice(o.total)}</td>
                          <td><OrderBadge status={o.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <div className="stack">
                <section className="card pad">
                  <h3>Orders by status</h3>
                  {ORDER_STATUSES.map((s) => (
                    <div key={s} className="kv">
                      <OrderBadge status={s} />
                      <strong>{data.ordersByStatus[s] ?? 0}</strong>
                    </div>
                  ))}
                </section>
                <section className="card pad">
                  <h3>Low stock</h3>
                  {data.lowStock.length === 0 ? (
                    <p className="muted">All products are well stocked.</p>
                  ) : (
                    data.lowStock.map((p) => (
                      <div key={p._id} className="kv">
                        <Link to={`/products/${p._id}`}>{p.name}</Link>
                        <strong className={p.stock === 0 ? 'text-danger' : ''}>{p.stock} left</strong>
                      </div>
                    ))
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </AsyncContent>
    </>
  );
}

function Stat({ label, value, to, accent }) {
  const body = (
    <>
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </>
  );
  return to ? <Link to={to} className="card stat">{body}</Link> : <div className={`card stat ${accent ? 'stat-accent' : ''}`}>{body}</div>;
}
