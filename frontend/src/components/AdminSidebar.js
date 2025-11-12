import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/userSlice';

const AdminSidebar = ({ onNavigate }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleNavigate = () => {
    if (onNavigate) onNavigate();
  };

  const onLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">Admin</div>
      <nav className="admin-sidebar__nav">
        <NavLink to="/admin" end onClick={handleNavigate} className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
        <NavLink to="/admin/userlist" onClick={handleNavigate} className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>Users</NavLink>
        <NavLink to="/admin/grouplist" onClick={handleNavigate} className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>Groups</NavLink>
        <NavLink to="/admin/questionlist" onClick={handleNavigate} className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>Questions</NavLink>
        <NavLink to="/admin/examlist" onClick={handleNavigate} className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>Exams</NavLink>
        <NavLink to="/admin/monitoring" onClick={handleNavigate} className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>Monitoring</NavLink>
        <NavLink to="/admin/bulk" onClick={handleNavigate} className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>Bulk Upload</NavLink>
      </nav>
      <div className="admin-sidebar__footer">
        <button type="button" className="admin-logout" onClick={onLogout}>Logout</button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
