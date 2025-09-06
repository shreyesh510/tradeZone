import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth } from './redux/slices/authSlice';
import type { AppDispatch, RootState } from './redux/store';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { ReactToastifyProvider } from './contexts/ReactToastifyContext';
import { SocketProvider } from './contexts/SocketContext';
import ToastContainer from './components/ToastContainer';
import Login from './components/Login';
import Zone from './pages/zone';
import Settings from './pages/settings';
import LiveChart from './components/LiveChart';
import Positions from './pages/investment/positions';
import SymbolPositions from './pages/investment/positions/SymbolPositions';
import InvestmentDashboard from './pages/investment/dashboard';
import Withdraw from './pages/investment/withdraw';
import Deposit from './pages/investment/deposit';
import './index.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check localStorage for existing credentials
    const testToken = localStorage.getItem('testToken');
    const userData = localStorage.getItem('user');
    
    console.log('🔍 Checking localStorage:', { 
      hasToken: !!testToken, 
      hasUser: !!userData,
      token: testToken ? testToken.substring(0, 20) + '...' : null,
      user: userData ? JSON.parse(userData) : null
    });

    if (testToken && userData) {
      // User has credentials, initialize auth state
      dispatch(initializeAuth());
      console.log('✅ Credentials found, initializing auth...');
    } else {
      console.log('❌ No credentials found, user needs to login');
    }
    
    setIsInitialized(true);
  }, [dispatch]);

  // Show loading while checking credentials
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <SettingsProvider>
      <ReactToastifyProvider>
        <ToastProvider>
          <SocketProvider>
          <Router>
            <div className="App h-full w-full overflow-hidden">
              <Routes>
                <Route 
                  path="/login" 
                  element={
                    isAuthenticated ? <Navigate to="/zone" replace /> : <Login />
                  } 
                />
                <Route 
                  path="/zone" 
                  element={
                    <ProtectedRoute>
                      <Zone />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/chart" 
                  element={
                    <ProtectedRoute>
                      <LiveChart />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Investment Routes */}
                <Route 
                  path="/investment/positions" 
                  element={
                    <ProtectedRoute>
                      <Positions />
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
                  path="/investment/dashboard" 
                  element={
                    <ProtectedRoute>
                      <InvestmentDashboard />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/investment/withdraw" 
                  element={
                    <ProtectedRoute>
                      <Withdraw />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/investment/deposit" 
                  element={
                    <ProtectedRoute>
                      <Deposit />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/" 
                  element={
                    isAuthenticated ? <Navigate to="/zone" replace /> : <Navigate to="/login" replace />
                  } 
                />
              </Routes>
              
              {/* Global Toast Container */}
              <ToastContainer />
            </div>
          </Router>
        </SocketProvider>
      </ToastProvider>
    </ReactToastifyProvider>
    </SettingsProvider>
  );
}

export default App;
