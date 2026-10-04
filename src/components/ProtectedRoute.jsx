import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isValidUniversityEmail } from '../utils/validators';

export function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
}

export function StudentRoute({ children }) {
  const { user } = useAuth();
  return (user && isValidUniversityEmail(user.email)) ? children : <Navigate to="/" replace />;
}

export function AdminRoute({ children }) {
  const { member } = useAuth();
  const role = member?.role;
  return (role === 'officer' || role === 'admin') ? children : <Navigate to="/card" replace />;
}

export function VerifyRoute({ children }) {
  const { member } = useAuth();
  const role = member?.role;
  return (role === 'partner' || role === 'officer' || role === 'admin') ? children : <Navigate to="/" replace />;
}

