import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { useWeb3Auth } from './contexts/Web3AuthContext';
import { useUser } from './contexts/UserContext';

// Components
import Layout from './components/Layout/Layout';
import LoadingScreen from './components/LoadingScreen';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SavingsPage from './pages/SavingsPage';
import TransactionsPage from './pages/TransactionsPage';
import ProfilePage from './pages/ProfilePage';
import StrategyManagerDashboard from './pages/StrategyManagerDashboard';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useWeb3Auth();
  const { user, isLoading: userLoading } = useUser();

  if (isLoading || userLoading) {
    return <LoadingScreen />;
  }

  // Check for Web3Auth authentication OR JWT token (for development login)
  const hasJWTToken = localStorage.getItem('abunfi_token');
  const isLoggedIn = isAuthenticated || (hasJWTToken && user);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useWeb3Auth();
  const { user } = useUser();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Check for Web3Auth authentication OR JWT token (for development login)
  const hasJWTToken = localStorage.getItem('abunfi_token');
  const isLoggedIn = isAuthenticated || (hasJWTToken && user);

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Role-based Protected Route Component
const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading } = useWeb3Auth();
  const { user, isLoading: userLoading } = useUser();

  if (isLoading || userLoading) {
    return <LoadingScreen />;
  }

  // Check for Web3Auth authentication OR JWT token (for development login)
  const hasJWTToken = localStorage.getItem('abunfi_token');
  const isLoggedIn = isAuthenticated || (hasJWTToken && user);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role || 'user';
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { isLoading: web3Loading } = useWeb3Auth();

  if (web3Loading) {
    return <LoadingScreen />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/savings" 
          element={
            <ProtectedRoute>
              <Layout>
                <SavingsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/transactions" 
          element={
            <ProtectedRoute>
              <Layout>
                <TransactionsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/strategy-manager"
          element={
            <RoleProtectedRoute allowedRoles={['strategy_manager', 'admin']}>
              <Layout>
                <StrategyManagerDashboard />
              </Layout>
            </RoleProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
}

export default App;
