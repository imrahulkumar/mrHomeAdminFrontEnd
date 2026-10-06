export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export const StatusBadge = ({ active }) => <Badge tone={active ? 'success' : 'neutral'}>{active ? 'Active' : 'Hidden'}</Badge>;

const ORDER_TONES = { pending: 'warning', confirmed: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger', paid: 'success', failed: 'danger', refunded: 'neutral' };
export const OrderBadge = ({ status }) => <Badge tone={ORDER_TONES[status] ?? 'neutral'}>{status}</Badge>;

export function Loader({ text = 'Loading…' }) {
  return <div className="state"><span className="spinner" /> {text}</div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state state-error">
      {message}
      {onRetry && <button className="btn btn-sm" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function EmptyState({ title, action }) {
  return (
    <div className="state">
      <p>{title}</p>
      {action}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="pagination">
      <button className="btn btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>← Prev</button>
      <span className="muted">Page {page} of {pages}</span>
      <button className="btn btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next →</button>
    </div>
  );
}

/** Renders the right state (loading / error / empty) or the children. */
export function AsyncContent({ loading, error, onRetry, isEmpty, empty, children }) {
  if (loading) return <Loader />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (isEmpty) return empty;
  return children;
}
