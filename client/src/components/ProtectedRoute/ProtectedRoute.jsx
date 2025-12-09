import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import styles from './ProtectedRoute.module.css';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  // Use useContext directly to avoid hook error if context not available
  const authContext = useContext(AuthContext);
  
  // If context is not available, show loading (shouldn't happen if properly wrapped)
  if (authContext === undefined) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={48} className={styles.spinner} />
        <p className={styles.loadingText}>Initializing...</p>
      </div>
    );
  }

  const { isAuthenticated, loading } = authContext;

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

  return children;
};

export default ProtectedRoute;

