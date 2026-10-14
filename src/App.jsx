import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/ToastProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ProtectedRoute, AdminRoute, VerifyRoute, StudentRoute } from './components/ProtectedRoute';

// Keep Landing and Register directly imported for immediate render
import Landing from './pages/Landing';
import Register from './pages/Register';

// Lazy-load secondary and heavy pages
const CardPage = lazy(() => import('./pages/CardPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const Benefits = lazy(() => import('./pages/Benefits'));
const OfficeRegistration = lazy(() => import('./pages/OfficeRegistration'));
const PartnerSignup = lazy(() => import('./pages/PartnerSignup'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

function RouteLoadingFallback() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-brand-red, #c8102e)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

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
      <Suspense fallback={<RouteLoadingFallback />}>
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
          
          {/* Legal Pages */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
