import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import FarmerLayout from './layouts/FarmerLayout';
import AdminLayout from './layouts/AdminLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Crops from './pages/Crops';
import CropForm from './pages/CropForm';
import ScanPage from './pages/ScanPage';
import ScanResult from './pages/ScanResult';

// Chart-heavy pages are split into their own bundle.
const CropDetails = lazy(() => import('./pages/CropDetails'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const SprayAdvisory = lazy(() => import('./pages/SprayAdvisory'));
import Alerts from './pages/Alerts';
import AlertDetail from './pages/AlertDetail';
import WeatherPage from './pages/WeatherPage';
import Library from './pages/Library';
import LibraryDetail from './pages/LibraryDetail';
import History from './pages/History';
import Profile from './pages/Profile';
import Help from './pages/Help';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import AdminFarmers from './pages/admin/Farmers';
import AdminCrops from './pages/admin/Crops';
import AdminScans from './pages/admin/Scans';
import AdminDiseases from './pages/admin/Diseases';
import AdminPests from './pages/admin/Pests';
import AdminAlerts from './pages/admin/Alerts';
import AdminSettings from './pages/admin/Settings';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-700" role="status" aria-label="Loading" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}function FarmerRoute({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <FarmerLayout>{children}</FarmerLayout>
    </Protected>
  );
}

// Library is public but keeps the app shell (sidebar/bottom nav) when signed in.
function SmartLibraryRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-700" role="status" aria-label="Loading" />
      </div>
    );
  }
  if (user) return <FarmerLayout>{children}</FarmerLayout>;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <Protected>
      {user?.role === 'ADMIN' ? <AdminLayout>{children}</AdminLayout> : <Navigate to="/dashboard" replace />}
    </Protected>
  );
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center bg-canvas">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-700" role="status" aria-label="Loading" />
        </div>
      }
    >
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/library" element={<SmartLibraryRoute><Library /></SmartLibraryRoute>} />
      <Route path="/library/:id" element={<SmartLibraryRoute><LibraryDetail /></SmartLibraryRoute>} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route
        path="/dashboard"
        element={
          <FarmerRoute>
            <Dashboard />
          </FarmerRoute>
        }
      />
      <Route
        path="/crops"
        element={
          <FarmerRoute>
            <Crops />
          </FarmerRoute>
        }
      />
      <Route
        path="/crops/add"
        element={
          <FarmerRoute>
            <CropForm />
          </FarmerRoute>
        }
      />
      <Route
        path="/crops/:id"
        element={
          <FarmerRoute>
            <CropDetails />
          </FarmerRoute>
        }
      />
      <Route
        path="/crops/:id/edit"
        element={
          <FarmerRoute>
            <CropForm />
          </FarmerRoute>
        }
      />
      <Route
        path="/scan"
        element={
          <FarmerRoute>
            <ScanPage />
          </FarmerRoute>
        }
      />
      <Route
        path="/scan/result/:id"
        element={
          <FarmerRoute>
            <ScanResult />
          </FarmerRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <FarmerRoute>
            <Alerts />
          </FarmerRoute>
        }
      />
      <Route
        path="/alerts/:id"
        element={
          <FarmerRoute>
            <AlertDetail />
          </FarmerRoute>
        }
      />
      <Route
        path="/spray"
        element={
          <FarmerRoute>
            <SprayAdvisory />
          </FarmerRoute>
        }
      />
      <Route
        path="/weather"
        element={
          <FarmerRoute>
            <WeatherPage />
          </FarmerRoute>
        }
      />
      <Route
        path="/history"
        element={
          <FarmerRoute>
            <History />
          </FarmerRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <FarmerRoute>
            <Profile />
          </FarmerRoute>
        }
      />
      <Route
        path="/help"
        element={
          <FarmerRoute>
        <Help />
      </FarmerRoute>
        }
      />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/farmers" element={<AdminRoute><AdminFarmers /></AdminRoute>} />
      <Route path="/admin/crops" element={<AdminRoute><AdminCrops /></AdminRoute>} />
      <Route path="/admin/scans" element={<AdminRoute><AdminScans /></AdminRoute>} />
      <Route path="/admin/diseases" element={<AdminRoute><AdminDiseases /></AdminRoute>} />
      <Route path="/admin/pests" element={<AdminRoute><AdminPests /></AdminRoute>} />
      <Route path="/admin/alerts" element={<AdminRoute><AdminAlerts /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}
