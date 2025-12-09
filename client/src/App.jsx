import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import LandingPage from './features/landing';
import StudentAuth from './features/auth/pages/StudentAuth/StudentAuth';
import OAuthCallback from './features/auth/pages/OAuthCallback/OAuthCallback';
import CompanyLogin from './features/auth/pages/CompanyLogin/CompanyLogin';
import CompanySignup from './features/auth/pages/CompanySignup/CompanySignup';
import Dashboard from './features/dashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/student" element={<StudentAuth />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/auth/company/login" element={<CompanyLogin />} />
          <Route path="/auth/company/signup" element={<CompanySignup />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

