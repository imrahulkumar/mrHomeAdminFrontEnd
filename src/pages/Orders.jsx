import { useState } from 'react';
import { api } from '../api/client';
import { AsyncContent, EmptyState, OrderBadge, PageHeader, Pagination } from '../components/ui/Common';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { formatDate, formatPrice, ORDER_STATUSES, PAYMENT_STATUSES } from '../utils/format';

export default function Orders() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const { data, loading, error, reload } = useApi(
    () => api.get('/orders', { status, q, page }),
    [status, q, page],
    { items: [], total: 0, pages: 0 },
  );

  return (
    <>
      <PageHeader title="Orders" subtitle={`${data.total} orders`} />

      <div className="toolbar">
        <input type="search" placeholder="Search order number…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card">
        <AsyncContent loading={loading} error={error} onRetry={reload} isEmpty={data.items.length === 0} empty={<EmptyState title="No orders found." />}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {data.items.map((o) => (
                  <tr key={o._id}>
                    <td><strong>{o.orderNumber}</strong><div className="muted small">{formatDate(o.createdAt)}</div></td>
                    <td>{o.user?.name}<div className="muted small">{o.user?.email}</div></td>
                    <td>{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                    <td>{formatPrice(o.total)}</td>
                    <td><span className="upper small">{o.payment.method}</span> <OrderBadge status={o.payment.status} /></td>
                    <td><OrderBadge status={o.status} /></td>
                    <td className="actions"><button className="btn btn-sm" onClick={() => setSelected(o)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={data.pages} onChange={setPage} />
        </AsyncContent>
      </div>

      {selected && (
        <OrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onUpdated={(o) => {
            setSelected(o);
            reload();
          }}
        />
      )}
    </>
  );
}

function OrderDetail({ order, onClose, onUpdated }) {
  const notify = useToast();
  const [saving, setSaving] = useState(false);

  const update = async (changes) => {
    if (changes.status === 'cancelled' && !confirm('Cancel this order? Stock will be returned to inventory.')) return;
    setSaving(true);
    try {
      onUpdated(await api.patch(`/orders/${order._id}/status`, changes));
      notify('Order updated.');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const a = order.address;
  return (
    <Modal wide title={`Order ${order.orderNumber}`} onClose={onClose}>
      <div className="order-detail">
        <div className="row wrap gap-lg">
          <label className="field">
            <span className="field-label">Order status</span>
            <select value={order.status} disabled={saving} onChange={(e) => update({ status: e.target.value })}>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Payment status</span>
            <select value={order.payment.status} disabled={saving} onChange={(e) => update({ paymentStatus: e.target.value })}>
              {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <div className="two-col equal">
          <section>
            <h4>Customer</h4>
            <p>{order.user?.name}<br /><span className="muted">{order.user?.email}</span></p>
            <h4>Ship to</h4>
            <p>{a.fullName} · {a.phone}<br />{a.line1}<br />{a.city}, {a.state} – {a.pincode}</p>
          </section>
          <section>
            <h4>Payment</h4>
            <p>
              Method: <span className="upper">{order.payment.method}</span><br />
              Transaction: {order.payment.transactionId ?? '—'}<br />
              Paid at: {formatDate(order.payment.paidAt)}<br />
              Placed: {formatDate(order.createdAt)}
            </p>
          </section>
        </div>

        <table className="table">
          <thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Total</th></tr></thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.product}>
                <td>{i.name}</td>
                <td>{formatPrice(i.price)}</td>
                <td>{i.qty}</td>
                <td>{formatPrice(i.price * i.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="totals">
          <div className="kv"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="kv"><span>GST</span><span>{formatPrice(order.gst)}</span></div>
          <div className="kv"><span>Shipping</span><span>{order.shipping ? formatPrice(order.shipping) : 'Free'}</span></div>
          <div className="kv total"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </div>
      </div>
    </Modal>
  );
}
