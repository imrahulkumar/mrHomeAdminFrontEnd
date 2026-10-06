import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { section: 'Catalogue' },
  { to: '/categories', label: 'Categories', icon: '🗂️' },
  { to: '/subcategories', label: 'Sub-categories', icon: '📁' },
  { to: '/products', label: 'Products', icon: '💍' },
  { to: '/videos', label: 'YouTube Videos', icon: '▶️' },
  { section: 'Sales' },
  { to: '/orders', label: 'Orders', icon: '🧾' },
  { to: '/users', label: 'Customers & Admins', icon: '👥' },
  { section: 'Website' },
  { to: '/settings', label: 'Site Settings', icon: '⚙️' },
];

const STORE_URL = import.meta.env.VITE_STORE_URL || 'http://localhost:5173';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const [prevPath, setPrevPath] = useState(pathname);

  // Close the mobile sidebar whenever the route changes.
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  return (
    <div className="layout">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">◆ Store Admin</div>
        <nav>
          {NAV.map((item) =>
            item.section ? (
              <p key={item.section} className="sidebar-section">{item.section}</p>
            ) : (
              <NavLink key={item.to} to={item.to} end={item.end} className="sidebar-link">
                <span>{item.icon}</span> {item.label}
              </NavLink>
            ),
          )}
        </nav>
        <a className="sidebar-link sidebar-store" href={STORE_URL} target="_blank" rel="noreferrer">
          <span>🛍️</span> View store ↗
        </a>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <div className="content">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          <div className="topbar-user">
            <span className="avatar">{user.name[0]?.toUpperCase()}</span>
            <div>
              <strong>{user.name}</strong>
              <small className="muted">{user.email}</small>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={logout}>Logout</button>
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
