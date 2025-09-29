import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading, isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated()) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role (if specified)
  if (requiredRole && !hasRole(requiredRole)) {
    // Redirect to unauthorized page or home
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has required role, render children
  return children;
};

export default ProtectedRoute; 