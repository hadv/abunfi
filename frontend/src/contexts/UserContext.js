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
