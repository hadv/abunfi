import { ethers } from 'ethers';
// Import ABIs directly from submodule
import AbunfiVaultABI from '../../contracts-submodule/exports/AbunfiVault.json';
import AaveStrategyABI from '../../contracts-submodule/exports/AaveStrategy.json';
import CompoundStrategyABI from '../../contracts-submodule/exports/CompoundStrategy.json';
import LiquidStakingStrategyABI from '../../contracts-submodule/exports/LiquidStakingStrategy.json';
import LiquidityProvidingStrategyABI from '../../contracts-submodule/exports/LiquidityProvidingStrategy.json';
import MockERC20ABI from '../../contracts-submodule/exports/MockERC20.json';

const ABIS = {
  AbunfiVault: AbunfiVaultABI,
  AaveStrategy: AaveStrategyABI,
  CompoundStrategy: CompoundStrategyABI,
  LiquidStakingStrategy: LiquidStakingStrategyABI,
  LiquidityProvidingStrategy: LiquidityProvidingStrategyABI,
  MockERC20: MockERC20ABI
};

/**
 * Blockchain service for direct contract interactions
 * This service provides methods for interacting with smart contracts
 * when hooks are not available (e.g., in service workers, utilities)
 */
class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.addresses = {
      vault: process.env.REACT_APP_VAULT_CONTRACT_ADDRESS,
      aaveStrategy: process.env.REACT_APP_AAVE_STRATEGY_ADDRESS,
      compoundStrategy: process.env.REACT_APP_COMPOUND_STRATEGY_ADDRESS,
      liquidStakingStrategy: process.env.REACT_APP_LIQUID_STAKING_STRATEGY_ADDRESS,
      liquidityProvidingStrategy: process.env.REACT_APP_LIQUIDITY_PROVIDING_STRATEGY_ADDRESS,
      usdc: process.env.REACT_APP_USDC_CONTRACT_ADDRESS,
    };
  }

  /**
   * Initialize the service with a provider
   */
  async initialize(provider) {
    try {
      this.provider = provider;
      this.signer = provider.getSigner();
      
      // Initialize contracts
      await this.initializeContracts();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      return false;
    }
  }

  /**
   * Initialize contract instances
   */
  async initializeContracts() {
    try {
      // Initialize vault contract
      if (this.addresses.vault) {
        this.contracts.vault = new ethers.Contract(
          this.addresses.vault,
          ABIS.AbunfiVault.abi,
          this.signer
        );
      }

      // Initialize USDC contract
      if (this.addresses.usdc) {
        this.contracts.usdc = new ethers.Contract(
          this.addresses.usdc,
          ABIS.MockERC20.abi,
          this.signer
        );
      }

      // Initialize Aave strategy contract
      if (this.addresses.aaveStrategy) {
        this.contracts.aaveStrategy = new ethers.Contract(
          this.addresses.aaveStrategy,
          ABIS.AaveStrategy.abi,
          this.signer
        );
      }

      // Initialize Compound strategy contract
      if (this.addresses.compoundStrategy) {
        this.contracts.compoundStrategy = new ethers.Contract(
          this.addresses.compoundStrategy,
          ABIS.CompoundStrategy.abi,
          this.signer
        );
      }

      // Initialize Liquid Staking strategy contract
      if (this.addresses.liquidStakingStrategy) {
        this.contracts.liquidStakingStrategy = new ethers.Contract(
          this.addresses.liquidStakingStrategy,
          ABIS.LiquidStakingStrategy.abi,
          this.signer
        );
      }

      // Initialize Liquidity Providing strategy contract
      if (this.addresses.liquidityProvidingStrategy) {
        this.contracts.liquidityProvidingStrategy = new ethers.Contract(
          this.addresses.liquidityProvidingStrategy,
          ABIS.LiquidityProvidingStrategy.abi,
          this.signer
        );
      }
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
      throw error;
    }
  }

  /**
   * Get vault statistics
   */
  async getVaultStats() {
    try {
      if (!this.contracts.vault) {
        throw new Error('Vault contract not initialized');
      }

      const [totalAssets, totalShares] = await Promise.all([
        this.contracts.vault.totalAssets(),
        this.contracts.vault.totalShares(),
      ]);

      // Get strategy info for APY calculation
      const strategies = await this.contracts.vault.getAllStrategiesInfo();
      
      let weightedAPY = 0;
      let totalWeight = 0;

      if (strategies.apys && strategies.weights) {
        for (let i = 0; i < strategies.apys.length; i++) {
          const apy = parseFloat(ethers.utils.formatUnits(strategies.apys[i], 2));
          const weight = parseFloat(ethers.utils.formatUnits(strategies.weights[i], 2));
          weightedAPY += apy * weight;
          totalWeight += weight;
        }
      }

      const currentAPY = totalWeight > 0 ? weightedAPY / totalWeight : 0;

      return {
        totalAssets: ethers.utils.formatUnits(totalAssets, 6), // USDC has 6 decimals
        totalShares: ethers.utils.formatEther(totalShares),
        currentAPY,
        strategyCount: strategies.addresses ? strategies.addresses.length : 0,
      };
    } catch (error) {
      console.error('Failed to get vault stats:', error);
      throw error;
    }
  }

  /**
   * Get user balance and portfolio information
   */
  async getUserPortfolio(userAddress) {
    try {
      if (!this.contracts.vault || !userAddress) {
        throw new Error('Vault contract not initialized or user address not provided');
      }

      const [userShares, userDeposits, earnedYield] = await Promise.all([
        this.contracts.vault.userShares(userAddress),
        this.contracts.vault.userDeposits(userAddress),
        this.contracts.vault.earnedYield(userAddress),
      ]);

      const totalBalance = await this.contracts.vault.balanceOf(userAddress);

      return {
        totalBalance: ethers.utils.formatUnits(totalBalance, 6),
        deposits: ethers.utils.formatUnits(userDeposits, 6),
        shares: ethers.utils.formatEther(userShares),
        earnedYield: ethers.utils.formatUnits(earnedYield, 6),
      };
    } catch (error) {
      console.error('Failed to get user portfolio:', error);
      throw error;
    }
  }

  /**
   * Estimate deposit transaction
   */
  async estimateDeposit(userAddress, amount) {
    try {
      if (!this.contracts.vault || !userAddress) {
        throw new Error('Vault contract not initialized or user address not provided');
      }

      const amountWei = ethers.utils.parseUnits(amount.toString(), 6);
      
      // Estimate gas
      const gasLimit = await this.contracts.vault.estimateGas.deposit(amountWei);
      const gasPrice = await this.provider.getGasPrice();
      const gasCost = gasLimit.mul(gasPrice);

      // Calculate estimated shares (simplified calculation)
      const totalAssets = await this.contracts.vault.totalAssets();
      const totalShares = await this.contracts.vault.totalShares();
      
      let estimatedShares;
      if (totalShares.isZero()) {
        estimatedShares = amountWei.mul(ethers.constants.WeiPerEther).div(ethers.utils.parseUnits('1', 6));
      } else {
        estimatedShares = amountWei.mul(totalShares).div(totalAssets);
      }

      return {
        estimatedShares: ethers.utils.formatEther(estimatedShares),
        gasLimit: gasLimit.toString(),
        gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
        gasCost: ethers.utils.formatEther(gasCost),
      };
    } catch (error) {
      console.error('Failed to estimate deposit:', error);
      throw error;
    }
  }

  /**
   * Execute deposit transaction
   */
  async deposit(amount) {
    try {
      if (!this.contracts.vault || !this.contracts.usdc) {
        throw new Error('Contracts not initialized');
      }

      const amountWei = ethers.utils.parseUnits(amount.toString(), 6);
      
      // Check and approve USDC if needed
      const allowance = await this.contracts.usdc.allowance(
        await this.signer.getAddress(),
        this.addresses.vault
      );

      if (allowance.lt(amountWei)) {
        const approveTx = await this.contracts.usdc.approve(
          this.addresses.vault,
          ethers.constants.MaxUint256
        );
        await approveTx.wait();
      }

      // Execute deposit
      const depositTx = await this.contracts.vault.deposit(amountWei);
      return await depositTx.wait();
    } catch (error) {
      console.error('Failed to execute deposit:', error);
      throw error;
    }
  }

  /**
   * Execute withdraw transaction
   */
  async withdraw(shares) {
    try {
      if (!this.contracts.vault) {
        throw new Error('Vault contract not initialized');
      }

      const sharesWei = ethers.utils.parseEther(shares.toString());
      const withdrawTx = await this.contracts.vault.withdraw(sharesWei);
      return await withdrawTx.wait();
    } catch (error) {
      console.error('Failed to execute withdraw:', error);
      throw error;
    }
  }

  /**
   * Get all strategies information
   */
  async getAllStrategies() {
    try {
      if (!this.contracts.vault) {
        throw new Error('Vault contract not initialized');
      }

      const strategiesInfo = await this.contracts.vault.getAllStrategiesInfo();
      
      return {
        addresses: strategiesInfo.addresses,
        names: strategiesInfo.names,
        totalAssets: strategiesInfo.totalAssetsAmounts.map(amount => 
          ethers.utils.formatUnits(amount, 6)
        ),
        apys: strategiesInfo.apys.map(apy => 
          parseFloat(ethers.utils.formatUnits(apy, 2))
        ),
        weights: strategiesInfo.weights.map(weight => 
          parseFloat(ethers.utils.formatUnits(weight, 2))
        ),
      };
    } catch (error) {
      console.error('Failed to get strategies:', error);
      throw error;
    }
  }

  /**
   * Get USDC balance for a user
   */
  async getUSDCBalance(userAddress) {
    try {
      if (!this.contracts.usdc || !userAddress) {
        throw new Error('USDC contract not initialized or user address not provided');
      }

      const balance = await this.contracts.usdc.balanceOf(userAddress);
      return ethers.utils.formatUnits(balance, 6);
    } catch (error) {
      console.error('Failed to get USDC balance:', error);
      throw error;
    }
  }

  /**
   * Format contract error for user display
   */
  formatError(error) {
    if (error?.reason) {
      return error.reason;
    }
    
    if (error?.data?.message) {
      return error.data.message;
    }
    
    if (error?.message) {
      const revertMatch = error.message.match(/revert (.+)/);
      if (revertMatch) {
        return revertMatch[1];
      }
      return error.message;
    }
    
    return 'Unknown blockchain error';
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
export default blockchainService;
