import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/ToastProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Register from './pages/Register';
import CardPage from './pages/CardPage';
import AdminDashboard from './pages/AdminDashboard';
import VerifyPage from './pages/VerifyPage';
import Benefits from './pages/Benefits';

function AppRoutes() {
  const { user, member, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <img src="/logo.jpg" alt="SSC-AL" style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: 16 }} />
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={
          <ProtectedRoute>
            {member ? <Navigate to="/card" replace /> : <Register />}
          </ProtectedRoute>
        } />
        <Route path="/card" element={
          <ProtectedRoute>
            {!member ? <Navigate to="/register" replace /> : <CardPage />}
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          </ProtectedRoute>
        } />
        {/* Public — no auth needed to scan and verify a card */}
        <Route path="/verify" element={<VerifyPage />} />
        {/* Public — Benefits page accessible to everyone */}
        <Route path="/benefits" element={<Benefits />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
