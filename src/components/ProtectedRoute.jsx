import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Redirects unauthenticated users to /login.
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="page-loader">
      <div className="spinner" />
    </div>
  );

  if (!user) return <Navigate to="/" replace />;
  return children;
}

/**
 * Redirects non-officers/admins to /card.
 */
export function AdminRoute({ children }) {
  const { member, loading } = useAuth();

  if (loading) return (
    <div className="page-loader">
      <div className="spinner" />
    </div>
  );

  if (!member || (member.role !== 'officer' && member.role !== 'admin')) {
    return <Navigate to="/card" replace />;
  }

  return children;
}
