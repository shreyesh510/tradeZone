import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import { Login, Dashboard } from '../pages';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  const isAuthenticated = useAppSelector((state: any) => state.auth.isAuthenticated);

  // Check localStorage for auth info
  const checkLocalStorageAuth = () => {
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem('tradezone_auth');
      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          return authData.isAuthenticated && authData.user && authData.token;
        } catch (error) {
          console.error('Error parsing auth data from localStorage:', error);
          return false;
        }
      }
    }
    return false;
  };

  // Check if user is authenticated (either in Redux state or localStorage)
  const isUserAuthenticated = isAuthenticated || checkLocalStorageAuth();

  return (
    <Routes>
      <Route 
        path="/" 
        element={isUserAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      {/* Add more routes here as needed */}
      <Route 
        path="*" 
        element={<Navigate to="/" replace />} 
      />
    </Routes>
  );
}
