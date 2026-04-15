import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import styles from './ProtectedRoute.module.css';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication.
 * allowedRoles: optional array e.g. ['STUDENT', 'ADMIN'] — if omitted any authenticated user passes
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const authContext = useContext(AuthContext);

  if (authContext === undefined) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={48} className={styles.spinner} />
        <p className={styles.loadingText}>Initializing...</p>
      </div>
    );
  }

  const { isAuthenticated, loading, user } = authContext;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={48} className={styles.spinner} />
        <p className={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/student" replace />;
  }

  // Role-based guard
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    // Redirect company users who land on student routes and vice-versa
    if (user.role === 'COMPANY') return <Navigate to="/company/dashboard" replace />;
    if (user.role === 'STUDENT') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
