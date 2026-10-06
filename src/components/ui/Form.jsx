/** Small form building blocks shared by every admin page. */

export function Field({ label, hint, children, span = 1 }) {
  return (
    <label className={`field ${span === 2 ? 'span-2' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track"><span className="toggle-thumb" /></span>
      <span>{label}</span>
    </label>
  );
}

export function FormGrid({ children }) {
  return <div className="form-grid">{children}</div>;
}

export function FormSection({ title, description, children }) {
  return (
    <section className="card form-section">
      <header>
        <h3>{title}</h3>
        {description && <p className="muted">{description}</p>}
      </header>
      {children}
    </section>
  );
}
