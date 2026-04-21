// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedRoute = () => {
  const accessToken = Cookies.get('accessToken');
  const userId = Cookies.get('userId');

  // If no accessToken or userId → not authenticated
  const isAuthenticated = !!(accessToken && userId);

  // If not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated → render child routes (via <Outlet />)
  return <Outlet />;
};

export default ProtectedRoute;