import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboardScreen = () => {
  return (
    <div className="p-3">
      <h2 className="mb-4">Admin Dashboard</h2>
      <div className="admin-grid">
        <Link to="/admin/userlist" className="admin-card">
          <div className="admin-card__title">Users</div>
          <div className="admin-card__desc">Create, edit, and assign roles</div>
        </Link>
        <Link to="/admin/grouplist" className="admin-card">
          <div className="admin-card__title">Groups</div>
          <div className="admin-card__desc">Organize users into cohorts</div>
        </Link>
        <Link to="/admin/questionlist" className="admin-card">
          <div className="admin-card__title">Questions</div>
          <div className="admin-card__desc">Build and manage question bank</div>
        </Link>
        <Link to="/admin/examlist" className="admin-card">
          <div className="admin-card__title">Exams</div>
          <div className="admin-card__desc">Create and schedule exams</div>
        </Link>
        <Link to="/admin/monitoring" className="admin-card">
          <div className="admin-card__title">Monitoring</div>
          <div className="admin-card__desc">Track live exam activity</div>
        </Link>
        <Link to="/admin/bulk" className="admin-card">
          <div className="admin-card__title">Bulk Upload</div>
          <div className="admin-card__desc">Import users and questions</div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboardScreen;
