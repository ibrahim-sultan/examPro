import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboardScreen = () => {
  return (
    <div className="p-3">
      <h2 className="mb-4">Admin Dashboard</h2>
      <div className="admin-grid">
        <Link to="/admin/userlist" className="admin-card">Manage Users</Link>
        <Link to="/admin/grouplist" className="admin-card">Manage Groups</Link>
        <Link to="/admin/questionlist" className="admin-card">Manage Questions</Link>
        <Link to="/admin/examlist" className="admin-card">Manage Exams</Link>
        <Link to="/admin/monitoring" className="admin-card">Monitoring</Link>
        <Link to="/admin/bulk" className="admin-card">Bulk Upload</Link>
      </div>
    </div>
  );
};

export default AdminDashboardScreen;
