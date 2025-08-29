import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
// Import ABIs directly from submodule
import AbunfiVaultABI from '../../contracts-submodule/exports/AbunfiVault.json';
import AaveStrategyABI from '../../contracts-submodule/exports/AaveStrategy.json';
import MockERC20ABI from '../../contracts-submodule/exports/MockERC20.json';

const ABIS = {
  AbunfiVault: AbunfiVaultABI,
  AaveStrategy: AaveStrategyABI,
  MockERC20: MockERC20ABI
};

/**
 * Custom hook for interacting with smart contracts
 * @param {string} contractName - Name of the contract (AbunfiVault, AaveStrategy, MockERC20)
 * @param {string} contractAddress - Address of the deployed contract
 * @returns {Object} Contract instance and utilities
 */
export const useContract = (contractName, contractAddress) => {
  const { provider } = useWeb3Auth();

  const contract = useMemo(() => {
    if (!provider || !contractAddress || !contractName) {
      return null;
    }

    try {
      const abi = ABIS[contractName]?.abi;
      if (!abi) {
        console.error(`ABI not found for contract: ${contractName}`);
        return null;
      }

      const signer = provider.getSigner();
      return new ethers.Contract(contractAddress, abi, signer);
    } catch (error) {
      console.error(`Failed to create contract instance for ${contractName}:`, error);
      return null;
    }
  }, [provider, contractAddress, contractName]);

  const readOnlyContract = useMemo(() => {
    if (!contractAddress || !contractName) {
      return null;
    }

    try {
      const abi = ABIS[contractName]?.abi;
      if (!abi) {
        console.error(`ABI not found for contract: ${contractName}`);
        return null;
      }

      // Use a default provider for read-only operations
      const defaultProvider = new ethers.providers.JsonRpcProvider(
        process.env.REACT_APP_RPC_URL || 'https://arb1.arbitrum.io/rpc'
      );
      
      return new ethers.Contract(contractAddress, abi, defaultProvider);
    } catch (error) {
      console.error(`Failed to create read-only contract instance for ${contractName}:`, error);
      return null;
    }
  }, [contractAddress, contractName]);

  return {
    contract,
    readOnlyContract,
    isReady: !!contract,
    abi: ABIS[contractName]?.abi || null
  };
};

/**
 * Hook specifically for the AbunfiVault contract
 */
export const useVaultContract = (vaultAddress) => {
  return useContract('AbunfiVault', vaultAddress);
};

/**
 * Hook specifically for the AaveStrategy contract
 */
export const useAaveStrategyContract = (strategyAddress) => {
  return useContract('AaveStrategy', strategyAddress);
};

/**
 * Hook specifically for ERC20 tokens (using MockERC20 ABI)
 */
export const useERC20Contract = (tokenAddress) => {
  return useContract('MockERC20', tokenAddress);
};

/**
 * Hook for getting contract addresses from environment variables
 */
export const useContractAddresses = () => {
  return useMemo(() => ({
    vault: process.env.REACT_APP_VAULT_CONTRACT_ADDRESS,
    aaveStrategy: process.env.REACT_APP_AAVE_STRATEGY_ADDRESS,
    usdc: process.env.REACT_APP_USDC_CONTRACT_ADDRESS,
  }), []);
};

/**
 * Utility function to format contract errors
 */
export const formatContractError = (error) => {
  if (error?.reason) {
    return error.reason;
  }
  
  if (error?.data?.message) {
    return error.data.message;
  }
  
  if (error?.message) {
    // Extract revert reason from error message
    const revertMatch = error.message.match(/revert (.+)/);
    if (revertMatch) {
      return revertMatch[1];
    }
    return error.message;
  }
  
  return 'Unknown contract error';
};

/**
 * Utility function to estimate gas for a transaction
 */
export const estimateGas = async (contract, methodName, args = []) => {
  try {
    if (!contract || !contract.estimateGas || !contract.estimateGas[methodName]) {
      throw new Error(`Method ${methodName} not found on contract`);
    }
    
    const gasEstimate = await contract.estimateGas[methodName](...args);
    // Add 20% buffer to gas estimate
    return gasEstimate.mul(120).div(100);
  } catch (error) {
    console.error(`Gas estimation failed for ${methodName}:`, error);
    throw error;
  }
};

/**
 * Utility function to parse contract events
 */
export const parseContractEvents = (receipt, contract, eventName) => {
  try {
    if (!receipt || !receipt.logs || !contract || !contract.interface) {
      return [];
    }
    
    return receipt.logs
      .map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(log => log && log.name === eventName);
  } catch (error) {
    console.error(`Failed to parse events for ${eventName}:`, error);
    return [];
  }
};
