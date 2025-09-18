import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
// Import ABIs from symlinked contracts directory
import AbunfiVaultABI from '../contracts/AbunfiVault.json';
import AaveStrategyABI from '../contracts/AaveStrategy.json';
import MockERC20ABI from '../contracts/MockERC20.json';
import SocialAccountRegistryABI from '../contracts/SocialAccountRegistry.json';
import RiscZeroSocialVerifierABI from '../contracts/RiscZeroSocialVerifier.json';

// Mock ABIs for contracts that don't exist yet
const StrategyManagerABI = { abi: [] };
const CompoundStrategyABI = { abi: [] };
const LiquidStakingStrategyABI = { abi: [] };
const LiquidityProvidingStrategyABI = { abi: [] };
const UniswapV4FairFlowStablecoinStrategyABI = { abi: [] };
const AbunfiSmartAccountABI = { abi: [] };
const EIP7702BundlerABI = { abi: [] };
const EIP7702PaymasterABI = { abi: [] };

const ABIS = {
  AbunfiVault: AbunfiVaultABI,
  StrategyManager: StrategyManagerABI,
  AaveStrategy: AaveStrategyABI,
  CompoundStrategy: CompoundStrategyABI,
  LiquidStakingStrategy: LiquidStakingStrategyABI,
  LiquidityProvidingStrategy: LiquidityProvidingStrategyABI,
  UniswapV4FairFlowStablecoinStrategy: UniswapV4FairFlowStablecoinStrategyABI,
  AbunfiSmartAccount: AbunfiSmartAccountABI,
  EIP7702Bundler: EIP7702BundlerABI,
  EIP7702Paymaster: EIP7702PaymasterABI,
  SocialAccountRegistry: SocialAccountRegistryABI,
  RiscZeroSocialVerifier: RiscZeroSocialVerifierABI,
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
      const defaultProvider = new ethers.JsonRpcProvider(
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
    // Core contracts
    vault: process.env.REACT_APP_VAULT_CONTRACT_ADDRESS,
    strategyManager: process.env.REACT_APP_STRATEGY_MANAGER_ADDRESS,

    // Strategy contracts
    aaveStrategy: process.env.REACT_APP_AAVE_STRATEGY_ADDRESS,
    compoundStrategy: process.env.REACT_APP_COMPOUND_STRATEGY_ADDRESS,
    liquidStakingStrategy: process.env.REACT_APP_LIQUID_STAKING_STRATEGY_ADDRESS,
    liquidityProvidingStrategy: process.env.REACT_APP_LIQUIDITY_PROVIDING_STRATEGY_ADDRESS,
    uniswapV4FairFlowStrategy: process.env.REACT_APP_UNISWAP_V4_FAIRFLOW_STRATEGY_ADDRESS,

    // EIP-7702 Gasless Transaction contracts
    smartAccount: process.env.REACT_APP_SMART_ACCOUNT_ADDRESS,
    bundler: process.env.REACT_APP_EIP7702_BUNDLER_ADDRESS,
    paymaster: process.env.REACT_APP_EIP7702_PAYMASTER_ADDRESS,

    // zkVM Social Verification contracts
    socialAccountRegistry: process.env.REACT_APP_SOCIAL_ACCOUNT_REGISTRY_ADDRESS,
    riscZeroSocialVerifier: process.env.REACT_APP_RISC_ZERO_SOCIAL_VERIFIER_ADDRESS,

    // Token contracts
    usdc: process.env.REACT_APP_USDC_CONTRACT_ADDRESS,
  }), []);
};

/**
 * Additional strategy contract hooks
 */
export const useStrategyManagerContract = (address) => useContract('StrategyManager', address);
export const useAaveStrategyContract = (address) => useContract('AaveStrategy', address);
export const useCompoundStrategyContract = (address) => useContract('CompoundStrategy', address);
export const useLiquidStakingStrategyContract = (address) => useContract('LiquidStakingStrategy', address);
export const useLiquidityProvidingStrategyContract = (address) => useContract('LiquidityProvidingStrategy', address);
export const useUniswapV4FairFlowStrategyContract = (address) => useContract('UniswapV4FairFlowStablecoinStrategy', address);

// EIP-7702 Gasless Transaction contracts
export const useSmartAccountContract = (address) => useContract('AbunfiSmartAccount', address);
export const useBundlerContract = (address) => useContract('EIP7702Bundler', address);
export const usePaymasterContract = (address) => useContract('EIP7702Paymaster', address);

/**
 * zkVM Social Verification contract hooks
 */
export const useSocialAccountRegistryContract = (address) => useContract('SocialAccountRegistry', address);
export const useRiscZeroSocialVerifierContract = (address) => useContract('RiscZeroSocialVerifier', address);

/**
 * Hook to get all strategy contracts with their addresses
 */
export const useAllStrategyContracts = () => {
  const addresses = useContractAddresses();

  const aaveStrategy = useAaveStrategyContract(addresses.aaveStrategy);
  const compoundStrategy = useCompoundStrategyContract(addresses.compoundStrategy);
  const liquidStakingStrategy = useLiquidStakingStrategyContract(addresses.liquidStakingStrategy);
  const liquidityProvidingStrategy = useLiquidityProvidingStrategyContract(addresses.liquidityProvidingStrategy);
  const uniswapV4FairFlowStrategy = useUniswapV4FairFlowStrategyContract(addresses.uniswapV4FairFlowStrategy);

  return useMemo(() => ({
    aave: {
      contract: aaveStrategy.contract,
      readOnlyContract: aaveStrategy.readOnlyContract,
      address: addresses.aaveStrategy,
      isReady: aaveStrategy.isReady,
      name: 'Aave Strategy'
    },
    compound: {
      contract: compoundStrategy.contract,
      readOnlyContract: compoundStrategy.readOnlyContract,
      address: addresses.compoundStrategy,
      isReady: compoundStrategy.isReady,
      name: 'Compound Strategy'
    },
    liquidStaking: {
      contract: liquidStakingStrategy.contract,
      readOnlyContract: liquidStakingStrategy.readOnlyContract,
      address: addresses.liquidStakingStrategy,
      isReady: liquidStakingStrategy.isReady,
      name: 'Liquid Staking Strategy'
    },
    liquidityProviding: {
      contract: liquidityProvidingStrategy.contract,
      readOnlyContract: liquidityProvidingStrategy.readOnlyContract,
      address: addresses.liquidityProvidingStrategy,
      isReady: liquidityProvidingStrategy.isReady,
      name: 'Liquidity Providing Strategy'
    },
    uniswapV4FairFlow: {
      contract: uniswapV4FairFlowStrategy.contract,
      readOnlyContract: uniswapV4FairFlowStrategy.readOnlyContract,
      address: addresses.uniswapV4FairFlowStrategy,
      isReady: uniswapV4FairFlowStrategy.isReady,
      name: 'Uniswap V4 FairFlow Stablecoin Strategy'
    }
  }), [aaveStrategy, compoundStrategy, liquidStakingStrategy, liquidityProvidingStrategy, uniswapV4FairFlowStrategy, addresses]);
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
