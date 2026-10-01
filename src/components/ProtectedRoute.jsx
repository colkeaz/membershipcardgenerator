import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isValidUniversityEmail } from '../utils/validators';

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
 * Enforces BatStateU domain for student registration.
 */
export function StudentRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="page-loader">
      <div className="spinner" />
    </div>
  );

  if (!user || !isValidUniversityEmail(user.email)) {
    return <Navigate to="/" replace />;
  }

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

/**
 * Redirects non-partners/officers/admins away from verification.
 */
export function VerifyRoute({ children }) {
  const { member, loading } = useAuth();

  if (loading) return (
    <div className="page-loader">
      <div className="spinner" />
    </div>
  );

  if (!member || (member.role !== 'partner' && member.role !== 'officer' && member.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  return children;
}

