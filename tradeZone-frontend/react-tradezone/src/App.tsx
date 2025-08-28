import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth } from './redux/slices/authSlice';
import type { AppDispatch, RootState } from './redux/store';
import Login from './components/Login';
import Dashboard from './pages/dashboard';
import LiveChart from './components/LiveChart';
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
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
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

          <Route 
            path="/" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
