import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWeb3Auth } from './Web3AuthContext';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import securityAuthService from '../services/securityAuthService';
import api from '../services/api';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { isAuthenticated, userInfo, walletAddress } = useWeb3Auth();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [portfolio, setPortfolio] = useState(null);

  // Check for existing JWT token on app startup
  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = localStorage.getItem('abunfi_token');
      console.log('🔍 UserContext: Checking existing auth', { token: !!token, user: !!user, isAuthenticated });

      if (token && !user && !isAuthenticated) {
        console.log('🔄 UserContext: Verifying token...');
        setIsLoading(true);
        try {
          // Verify token and get user data using userService
          const userData = await userService.getProfile();
          console.log('✅ UserContext: Token verified, user data:', userData.user);
          setUser(userData.user);
        } catch (error) {
          console.error('❌ UserContext: Token verification failed:', error);
          // Token is invalid, remove it
          localStorage.removeItem('abunfi_token');
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkExistingAuth();
  }, [user, isAuthenticated]);

  // Auto-login when Web3Auth is authenticated
  useEffect(() => {
    const handleAutoLogin = async () => {
      if (isAuthenticated && userInfo && walletAddress && !user) {
        setIsLoading(true);
        try {
          // Try to login with social auth
          const loginData = {
            socialId: userInfo.verifierId,
            socialProvider: userInfo.typeOfLogin,
            email: userInfo.email,
            name: userInfo.name,
            walletAddress: walletAddress,
            avatar: userInfo.profileImage
          };

          // Use enhanced social login with security checks
          const response = await securityAuthService.socialLoginWithSecurity(loginData);
          setUser(response.user);

          // Store token
          localStorage.setItem('abunfi_token', response.token);

          // Load portfolio
          await loadPortfolio();
        } catch (error) {
          console.error('Auto-login error:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleAutoLogin();
  }, [isAuthenticated, userInfo, walletAddress, user]);

  const loadPortfolio = async () => {
    try {
      const portfolioData = await userService.getPortfolio();
      setPortfolio(portfolioData);
    } catch (error) {
      console.error('Load portfolio error:', error);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await userService.updateProfile(profileData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const login = (userData) => {
    try {
      console.log('🔐 UserContext: Login called with user data:', userData);
      setUser(userData);
      // Load portfolio after login
      loadPortfolio();
      console.log('✅ UserContext: User set successfully');
    } catch (error) {
      console.error('❌ UserContext: Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setPortfolio(null);
      localStorage.removeItem('abunfi_token');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshPortfolio = async () => {
    await loadPortfolio();
  };

  const value = {
    user,
    isLoading,
    portfolio,
    login,
    updateProfile,
    logout,
    refreshPortfolio,
    loadPortfolio
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
