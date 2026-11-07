import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/auth.types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. If not authenticated, redirect to Login page
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Normalize role comparison
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleStr = String(user.role).toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase());

    // Allow staff and seller interchangeably
    const hasPermission = normalizedAllowed.some(r => {
      if (r === 'staff' || r === 'seller') {
        return userRoleStr === 'staff' || userRoleStr === 'seller';
      }
      return r === userRoleStr;
    });

    if (!hasPermission) {
      // Redirect user to their own portal
      if (userRoleStr === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      }
      if (userRoleStr === 'staff' || userRoleStr === 'seller') {
        return <Navigate to="/seller/dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};
