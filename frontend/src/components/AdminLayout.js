import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);
  const close = () => setOpen(false);

  return (
    <div className={`admin-shell ${open ? 'sidebar-open' : ''}`}>
      {/* Mobile topbar */}
      <div className="admin-topbar">
        <button className="admin-topbar__btn" onClick={toggle} aria-label="Toggle menu">
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
        <div className="admin-topbar__title">Admin</div>
      </div>

      <div className={`admin-sidebar-wrap ${open ? 'open' : ''}`}>
        <AdminSidebar onNavigate={close} />
      </div>
      {open && <div className="admin-overlay" onClick={close} />}

      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
};

export default AdminLayout;
