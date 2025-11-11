
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const { userInfo } = useSelector((state) => state.user);

  // If user is logged in and has an admin role, render the child route.
  // Otherwise, redirect to the login page.
  const adminRoles = ['Admin', 'Super Admin', 'Moderator'];
  return userInfo && userInfo.role && adminRoles.includes(userInfo.role) ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default AdminRoute;
