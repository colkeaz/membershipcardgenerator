import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/ToastProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ProtectedRoute, AdminRoute, VerifyRoute, StudentRoute } from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Register from './pages/Register';
import CardPage from './pages/CardPage';
import AdminDashboard from './pages/AdminDashboard';
import VerifyPage from './pages/VerifyPage';
import Benefits from './pages/Benefits';
import OfficeRegistration from './pages/OfficeRegistration';
import PartnerSignup from './pages/PartnerSignup';

function AppRoutes() {
  const { user, member, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <img src="/ssc-seal.jpg" alt="SSC-AL" style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid var(--color-brand-red)', marginBottom: 16 }} />
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
            <StudentRoute>
              {member ? <Navigate to="/card" replace /> : <Register />}
            </StudentRoute>
          </ProtectedRoute>
        } />
        <Route path="/card" element={
          <ProtectedRoute>
            {!member ? (
              <Navigate to="/register" replace />
            ) : member.role === 'partner' ? (
              <Navigate to="/verify" replace />
            ) : (
              <CardPage />
            )}
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          </ProtectedRoute>
        } />
        {/* Partner Registration */}
        <Route path="/partner-signup" element={
          member ? <Navigate to="/verify" replace /> : <PartnerSignup />
        } />
        {/* Restricted — Only partners/officers/admins can verify cards */}
        <Route path="/verify" element={
          <ProtectedRoute>
            <VerifyRoute>
              <VerifyPage />
            </VerifyRoute>
          </ProtectedRoute>
        } />
        {/* Public — Benefits page accessible to everyone */}
        <Route path="/benefits" element={<Benefits />} />
        {/* Public — In-person office registration instructions */}
        <Route path="/office-registration" element={<OfficeRegistration />} />
        <Route path="/manual-registration" element={<Navigate to="/office-registration" replace />} />
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

