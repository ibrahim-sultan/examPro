
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const { userInfo } = useSelector((state) => state.user);

  // If user is logged in and is an admin, render the child route.
  // Otherwise, redirect to the login page.
  return userInfo && userInfo.role === 'Admin' ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default AdminRoute;
