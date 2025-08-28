const { ethers } = require('ethers');
const logger = require('../utils/logger');

// Contract ABIs (simplified for MVP)
const VAULT_ABI = [
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 shares) external", 
  "function balanceOf(address user) external view returns (uint256)",
  "function earnedYield(address user) external view returns (uint256)",
  "function totalAssets() external view returns (uint256)",
  "function userShares(address user) external view returns (uint256)",
  "function userDeposits(address user) external view returns (uint256)",
  "event Deposit(address indexed user, uint256 amount, uint256 shares)",
  "event Withdraw(address indexed user, uint256 amount, uint256 shares)"
];

const USDC_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

const STRATEGY_ABI = [
  "function totalAssets() external view returns (uint256)",
  "function getAPY() external view returns (uint256)",
  "function name() external view returns (string)"
];

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.vaultContract = null;
    this.usdcContract = null;
    this.strategyContract = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      
      // Initialize signer (for admin operations)
      if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== 'your_private_key_here') {
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      } else {
        console.warn('No private key provided - admin operations will not be available');
      }

      // Initialize contracts only if addresses are provided
      if (process.env.VAULT_CONTRACT_ADDRESS && process.env.VAULT_CONTRACT_ADDRESS !== '0x...') {
        this.vaultContract = new ethers.Contract(
          process.env.VAULT_CONTRACT_ADDRESS,
          VAULT_ABI,
          this.provider
        );
      }

      if (process.env.USDC_CONTRACT_ADDRESS && process.env.USDC_CONTRACT_ADDRESS !== '0x...') {
        this.usdcContract = new ethers.Contract(
          process.env.USDC_CONTRACT_ADDRESS,
          USDC_ABI,
          this.provider
        );
      }

      if (process.env.AAVE_STRATEGY_ADDRESS && process.env.AAVE_STRATEGY_ADDRESS !== '0x...') {
        this.strategyContract = new ethers.Contract(
          process.env.AAVE_STRATEGY_ADDRESS,
          STRATEGY_ABI,
          this.provider
        );
      }

      // Test connection
      const network = await this.provider.getNetwork();
      logger.info(`Connected to blockchain network: ${network.name} (${network.chainId})`);

      this.initialized = true;
    } catch (error) {
      logger.error('Blockchain initialization error:', error);
      throw error;
    }
  }

  // User balance and portfolio methods
  async getUserBalance(userAddress) {
    try {
      if (!this.vaultContract) {
        throw new Error('Vault contract not initialized');
      }

      const balance = await this.vaultContract.balanceOf(userAddress);
      const deposits = await this.vaultContract.userDeposits(userAddress);
      const shares = await this.vaultContract.userShares(userAddress);
      const earnedYield = await this.vaultContract.earnedYield(userAddress);

      return {
        totalBalance: ethers.formatUnits(balance, 6), // USDC has 6 decimals
        deposits: ethers.formatUnits(deposits, 6),
        shares: ethers.formatUnits(shares, 18),
        earnedYield: ethers.formatUnits(earnedYield, 6)
      };
    } catch (error) {
      logger.error('Error getting user balance:', error);
      throw error;
    }
  }

  async getVaultStats() {
    try {
      if (!this.vaultContract || !this.strategyContract) {
        throw new Error('Contracts not initialized');
      }

      const totalAssets = await this.vaultContract.totalAssets();
      const strategyAPY = await this.strategyContract.getAPY();
      const strategyName = await this.strategyContract.name();

      return {
        totalAssets: ethers.formatUnits(totalAssets, 6),
        currentAPY: Number(strategyAPY) / 100, // Convert from basis points
        strategyName
      };
    } catch (error) {
      logger.error('Error getting vault stats:', error);
      throw error;
    }
  }

  // Transaction methods
  async estimateDepositGas(userAddress, amount) {
    try {
      const amountWei = ethers.parseUnits(amount.toString(), 6);
      const gasEstimate = await this.vaultContract.deposit.estimateGas(amountWei, {
        from: userAddress
      });
      
      const gasPrice = await this.provider.getFeeData();
      const gasCost = gasEstimate * gasPrice.gasPrice;
      
      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: gasPrice.gasPrice.toString(),
        gasCost: ethers.formatEther(gasCost)
      };
    } catch (error) {
      logger.error('Error estimating deposit gas:', error);
      throw error;
    }
  }

  async estimateWithdrawGas(userAddress, shares) {
    try {
      const sharesWei = ethers.parseUnits(shares.toString(), 18);
      const gasEstimate = await this.vaultContract.withdraw.estimateGas(sharesWei, {
        from: userAddress
      });
      
      const gasPrice = await this.provider.getFeeData();
      const gasCost = gasEstimate * gasPrice.gasPrice;
      
      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: gasPrice.gasPrice.toString(),
        gasCost: ethers.formatEther(gasCost)
      };
    } catch (error) {
      logger.error('Error estimating withdraw gas:', error);
      throw error;
    }
  }

  // Event monitoring
  async getRecentTransactions(userAddress, limit = 10) {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = currentBlock - 10000; // Last ~10k blocks

      const depositFilter = this.vaultContract.filters.Deposit(userAddress);
      const withdrawFilter = this.vaultContract.filters.Withdraw(userAddress);

      const [depositEvents, withdrawEvents] = await Promise.all([
        this.vaultContract.queryFilter(depositFilter, fromBlock),
        this.vaultContract.queryFilter(withdrawFilter, fromBlock)
      ]);

      const allEvents = [...depositEvents, ...withdrawEvents]
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, limit);

      const transactions = await Promise.all(
        allEvents.map(async (event) => {
          const block = await event.getBlock();
          return {
            type: event.eventName.toLowerCase(),
            amount: ethers.formatUnits(event.args.amount, 6),
            shares: ethers.formatUnits(event.args.shares, 18),
            timestamp: new Date(block.timestamp * 1000),
            txHash: event.transactionHash,
            blockNumber: event.blockNumber
          };
        })
      );

      return transactions;
    } catch (error) {
      logger.error('Error getting recent transactions:', error);
      throw error;
    }
  }

  // Utility methods
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  formatUSDC(amount) {
    return ethers.formatUnits(amount, 6);
  }

  parseUSDC(amount) {
    return ethers.parseUnits(amount.toString(), 6);
  }
}

// Singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;
