import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Student Pages
import { DashboardPage } from './pages/DashboardPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { MaterialDetailPage } from './pages/MaterialDetailPage';
import { MaterialViewerPage } from './pages/MaterialViewerPage';
import { UploadPage } from './pages/UploadPage';
import { SavedMaterialsPage } from './pages/SavedMaterialsPage';
import { DownloadHistoryPage } from './pages/DownloadHistoryPage';
import { MyUploadsPage } from './pages/MyUploadsPage';
import { CirclesPage } from './pages/CirclesPage';
import { CircleDetailPage } from './pages/CircleDetailPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminMaterials } from './pages/admin/AdminMaterials';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminCircles } from './pages/admin/AdminCircles';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminStatistics } from './pages/admin/AdminStatistics';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRole?: 'ADMIN';
}> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Layout Shell for Portal Pages (Student Dashboard or Admin)
const PortalLayout: React.FC<{ children: React.ReactNode; isAdmin?: boolean }> = ({
  children,
  isAdmin = false,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isAdminSection={isAdmin} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
      <Footer />
    </div>
  );
};

// Standard Public Layout
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <PublicLayout>
                  <LandingPage />
                </PublicLayout>
              }
            />
            <Route
              path="/login"
              element={
                <PublicLayout>
                  <LoginPage />
                </PublicLayout>
              }
            />
            <Route
              path="/register"
              element={
                <PublicLayout>
                  <RegisterPage />
                </PublicLayout>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicLayout>
                  <ForgotPasswordPage />
                </PublicLayout>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicLayout>
                  <ResetPasswordPage />
                </PublicLayout>
              }
            />

            {/* Public/Student Material Browsing */}
            <Route
              path="/materials"
              element={
                <PublicLayout>
                  <MaterialsPage />
                </PublicLayout>
              }
            />
            <Route
              path="/materials/:id"
              element={
                <PublicLayout>
                  <MaterialDetailPage />
                </PublicLayout>
              }
            />
            <Route
              path="/materials/:id/view"
              element={
                <PublicLayout>
                  <MaterialViewerPage />
                </PublicLayout>
              }
            />

            {/* Student Protected Portal Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <DashboardPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <UploadPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved-materials"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <SavedMaterialsPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/download-history"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <DownloadHistoryPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-uploads"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <MyUploadsPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/circles"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <CirclesPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/circles/:id"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <CircleDetailPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <NotificationsPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <SettingsPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <SettingsPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Console Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <PortalLayout isAdmin>
                    <AdminDashboard />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <PortalLayout isAdmin>
                    <AdminUsers />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/materials"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <PortalLayout isAdmin>
                    <AdminMaterials />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <PortalLayout isAdmin>
                    <AdminReports />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/circles"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <PortalLayout isAdmin>
                    <AdminCircles />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <PortalLayout isAdmin>
                    <AdminCategories />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/statistics"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <PortalLayout isAdmin>
                    <AdminStatistics />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
