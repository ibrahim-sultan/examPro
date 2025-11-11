import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
};

export default AdminLayout;
