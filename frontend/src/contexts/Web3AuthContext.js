import React, { createContext, useContext, useState, useEffect } from 'react';
// import { Web3Auth } from '@web3auth/modal';
// import { CHAIN_NAMESPACES } from '@web3auth/base';
// import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
// import { ethers } from 'ethers';

const Web3AuthContext = createContext();

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error('useWeb3Auth must be used within Web3AuthProvider');
  }
  return context;
};

// Mock configuration for development
const chainConfig = {
  chainId: "0xa4b1", // Arbitrum One
  rpcTarget: "https://arb1.arbitrum.io/rpc",
  displayName: "Arbitrum One",
};

export const Web3AuthProvider = ({ children }) => {
  const [web3auth] = useState(null); // Always null for mock
  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Start as false for mock
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    // Mock initialization - no actual Web3Auth setup
    console.log('Using mock Web3Auth for development');
  }, []);

  const login = async (loginProvider = 'google') => {
    try {
      setIsLoading(true);

      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user data based on provider
      const mockUsers = {
        google: {
          email: 'demo@gmail.com',
          name: 'Demo User (Google)',
          profileImage: '',
          verifierId: 'google-demo-user-id',
          typeOfLogin: 'google'
        },
        apple: {
          email: 'demo@icloud.com',
          name: 'Demo User (Apple)',
          profileImage: '',
          verifierId: 'apple-demo-user-id',
          typeOfLogin: 'apple'
        },
        facebook: {
          email: 'demo@facebook.com',
          name: 'Demo User (Facebook)',
          profileImage: '',
          verifierId: 'facebook-demo-user-id',
          typeOfLogin: 'facebook'
        }
      };

      const mockUser = mockUsers[loginProvider] || mockUsers.google;
      const mockAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';

      setIsAuthenticated(true);
      setUserInfo(mockUser);
      setWalletAddress(mockAddress);
      setProvider(null); // Mock provider

      return {
        provider: null,
        userInfo: mockUser,
        walletAddress: mockAddress
      };
    } catch (error) {
      console.error('Mock login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // Simulate logout delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setProvider(null);
      setIsAuthenticated(false);
      setUserInfo(null);
      setWalletAddress(null);
    } catch (error) {
      console.error('Mock logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getBalance = async () => {
    try {
      // Mock ETH balance
      return "0.1"; // 0.1 ETH
    } catch (error) {
      console.error('Mock get balance error:', error);
      throw error;
    }
  };

  const signMessage = async (message) => {
    try {
      // Mock signature
      await new Promise(resolve => setTimeout(resolve, 1000));
      return "0x" + "a".repeat(130); // Mock signature
    } catch (error) {
      console.error('Mock sign message error:', error);
      throw error;
    }
  };

  const sendTransaction = async (transaction) => {
    try {
      // Mock transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        hash: "0x" + Math.random().toString(16).substr(2, 64),
        wait: async () => ({
          status: 1,
          blockNumber: Math.floor(Math.random() * 1000000),
          gasUsed: "21000"
        })
      };
    } catch (error) {
      console.error('Mock send transaction error:', error);
      throw error;
    }
  };

  const value = {
    web3auth,
    provider,
    isLoading,
    isAuthenticated,
    userInfo,
    walletAddress,
    login,
    logout,
    getBalance,
    signMessage,
    sendTransaction,
  };

  return (
    <Web3AuthContext.Provider value={value}>
      {children}
    </Web3AuthContext.Provider>
  );
};
