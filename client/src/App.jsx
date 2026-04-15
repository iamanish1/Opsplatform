import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { Loader2 } from 'lucide-react';
import './App.css';

const LandingPage = lazy(() => import('./features/landing'));
const StudentAuth = lazy(() => import('./features/auth/pages/StudentAuth/StudentAuth'));
const OAuthCallback = lazy(() => import('./features/auth/pages/OAuthCallback/OAuthCallback'));
const CompanyLogin = lazy(() => import('./features/auth/pages/CompanyLogin/CompanyLogin'));
const CompanySignup = lazy(() => import('./features/auth/pages/CompanySignup/CompanySignup'));
const Dashboard = lazy(() => import('./features/dashboard'));
const CompanyDashboard = lazy(() => import('./features/company'));
const PublicPortfolio = lazy(() => import('./features/portfolio/pages/PublicPortfolio/PublicPortfolio'));
const Leaderboard = lazy(() => import('./features/leaderboard/pages/Leaderboard/Leaderboard'));
const Onboarding = lazy(() => import('./features/onboarding/pages/Onboarding/Onboarding'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0f' }}>
    <Loader2 size={40} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth/student" element={<StudentAuth />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route path="/auth/company/login" element={<CompanyLogin />} />
              <Route path="/auth/company/signup" element={<CompanySignup />} />

              {/* Public pages — no auth required */}
              <Route path="/portfolio/:slug" element={<PublicPortfolio />} />
              <Route path="/leaderboard" element={<Leaderboard />} />

              {/* Student dashboard */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Student onboarding */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />

              {/* Company dashboard */}
              <Route
                path="/company/*"
                element={
                  <ProtectedRoute allowedRoles={['COMPANY', 'ADMIN']}>
                    <CompanyDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
