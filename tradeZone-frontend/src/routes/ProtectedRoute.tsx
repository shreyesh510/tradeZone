import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
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

  // If not authenticated in Redux state, check localStorage
  if (!isAuthenticated && !checkLocalStorageAuth()) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
