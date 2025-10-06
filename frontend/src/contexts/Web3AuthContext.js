import React, { createContext, useContext, useState, useEffect } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, WALLET_ADAPTERS } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { ethers } from 'ethers';

const Web3AuthContext = createContext();

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error('useWeb3Auth must be used within Web3AuthProvider');
  }
  return context;
};

// Sepolia Testnet configuration
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7", // Sepolia Testnet (11155111 in decimal)
  rpcTarget: process.env.REACT_APP_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID",
  displayName: "Sepolia Testnet",
  blockExplorer: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
};

export const Web3AuthProvider = ({ children }) => {
  const [web3auth, setWeb3auth] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const clientId = process.env.REACT_APP_WEB3AUTH_CLIENT_ID;

        if (!clientId || clientId === 'your_web3auth_client_id_here') {
          console.warn('Web3Auth Client ID not configured. Please set REACT_APP_WEB3AUTH_CLIENT_ID in .env');
          setIsLoading(false);
          return;
        }

        // Initialize private key provider
        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig }
        });

        // Initialize Web3Auth
        const web3authInstance = new Web3Auth({
          clientId,
          web3AuthNetwork: process.env.REACT_APP_WEB3AUTH_NETWORK || "sapphire_devnet",
          chainConfig,
          privateKeyProvider,
          uiConfig: {
            appName: "Abunfi",
            mode: "light",
            loginMethodsOrder: ["google", "apple", "facebook"],
            logoLight: "https://abunfi.com/logo.png",
            logoDark: "https://abunfi.com/logo.png",
            defaultLanguage: "en",
            theme: {
              primary: "#1976d2",
            },
          },
        });

        await web3authInstance.initModal({
          modalConfig: {
            [WALLET_ADAPTERS.OPENLOGIN]: {
              label: "openlogin",
              loginMethods: {
                google: {
                  name: "google",
                  showOnModal: true,
                },
                apple: {
                  name: "apple",
                  showOnModal: true,
                },
                facebook: {
                  name: "facebook",
                  showOnModal: true,
                },
              },
            },
          },
        });

        setWeb3auth(web3authInstance);

        // Check if already connected
        if (web3authInstance.connected) {
          const web3authProvider = web3authInstance.provider;
          setProvider(web3authProvider);

          const ethersProvider = new ethers.BrowserProvider(web3authProvider);
          const signer = await ethersProvider.getSigner();
          const address = await signer.getAddress();

          const user = await web3authInstance.getUserInfo();

          setWalletAddress(address);
          setUserInfo(user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Web3Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = async (loginProvider = 'google') => {
    try {
      if (!web3auth) {
        throw new Error('Web3Auth not initialized. Please configure REACT_APP_WEB3AUTH_CLIENT_ID');
      }

      setIsLoading(true);

      // Connect with Web3Auth
      const web3authProvider = await web3auth.connect();

      if (!web3authProvider) {
        throw new Error('Failed to connect with Web3Auth');
      }

      setProvider(web3authProvider);

      // Get user info
      const user = await web3auth.getUserInfo();
      setUserInfo(user);

      // Get wallet address
      const ethersProvider = new ethers.BrowserProvider(web3authProvider);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);

      setIsAuthenticated(true);

      return {
        provider: web3authProvider,
        userInfo: user,
        walletAddress: address
      };
    } catch (error) {
      console.error('Web3Auth login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (!web3auth) {
        throw new Error('Web3Auth not initialized');
      }

      setIsLoading(true);

      await web3auth.logout();

      setProvider(null);
      setIsAuthenticated(false);
      setUserInfo(null);
      setWalletAddress(null);
    } catch (error) {
      console.error('Web3Auth logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getBalance = async () => {
    try {
      if (!provider) {
        throw new Error('Provider not available');
      }

      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const balance = await ethersProvider.getBalance(signer.address);

      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Get balance error:', error);
      throw error;
    }
  };

  const signMessage = async (message) => {
    try {
      if (!provider) {
        throw new Error('Provider not available');
      }

      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const signature = await signer.signMessage(message);

      return signature;
    } catch (error) {
      console.error('Sign message error:', error);
      throw error;
    }
  };

  const sendTransaction = async (transaction) => {
    try {
      if (!provider) {
        throw new Error('Provider not available');
      }

      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      const tx = await signer.sendTransaction(transaction);

      return tx;
    } catch (error) {
      console.error('Send transaction error:', error);
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
