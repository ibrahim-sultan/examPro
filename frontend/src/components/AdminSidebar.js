import React from 'react';
import { NavLink } from 'react-router-dom';

const AdminSidebar = () => {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">Admin</div>
      <nav className="admin-sidebar__nav">
        <NavLink to="/admin" end className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
        <NavLink to="/admin/userlist" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>Users</NavLink>
        <NavLink to="/admin/grouplist" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>Groups</NavLink>
        <NavLink to="/admin/questionlist" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>Questions</NavLink>
        <NavLink to="/admin/examlist" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>Exams</NavLink>
        <NavLink to="/admin/monitoring" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>Monitoring</NavLink>
        <NavLink to="/admin/bulk" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>Bulk Upload</NavLink>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
