import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component for restricting access to authenticated users.
 * 
 * @param {Object} props - Component props
 * @param {string[]} props.allowedRoles - Array of roles allowed to access the route
 * @returns {JSX.Element} The protected route component
 */
function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  
  // Show loading indicator while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }
  
  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If allowedRoles is specified and user's role is not included, redirect to unauthorized
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Otherwise, render the child route
  return <Outlet />;
}

export default ProtectedRoute; 