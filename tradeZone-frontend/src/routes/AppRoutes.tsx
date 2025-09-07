import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import { Login, Dashboard } from '../pages';
import ProtectedRoute from './ProtectedRoute';
import InvestmentDashboard from '../pages/investment/dashboard';
import InvestmentPositions from '../pages/investment/positions';
import SymbolPositions from '../pages/investment/positions/SymbolPositions';
import InvestmentWithdraw from '../pages/investment/withdraw';
import InvestmentDeposit from '../pages/investment/deposit';
import WalletsPage from '../pages/wallets';

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
      
      {/* Investment Routes */}
      <Route 
        path="/investment/dashboard" 
        element={
          <ProtectedRoute>
            <InvestmentDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/investment/positions" 
        element={
          <ProtectedRoute>
            <InvestmentPositions />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/investment/positions/:symbol" 
        element={
          <ProtectedRoute>
            <SymbolPositions />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/investment/withdraw" 
        element={
          <ProtectedRoute>
            <InvestmentWithdraw />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/investment/deposit" 
        element={
          <ProtectedRoute>
            <InvestmentDeposit />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/wallets" 
        element={
          <ProtectedRoute>
            <WalletsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch-all route */}
      <Route 
        path="*" 
        element={<Navigate to="/" replace />} 
      />
    </Routes>
  );
}
