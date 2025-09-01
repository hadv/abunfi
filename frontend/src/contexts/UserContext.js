import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWeb3Auth } from './Web3AuthContext';
import { userService } from '../services/userService';
import { authService } from '../services/authService';

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
      if (token && !user && !isAuthenticated) {
        setIsLoading(true);
        try {
          // Verify token and get user data
          const response = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('abunfi_token');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
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

          const response = await authService.socialLogin(loginData);
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
      setUser(userData);
      // Load portfolio after login
      loadPortfolio();
    } catch (error) {
      console.error('Login error:', error);
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
