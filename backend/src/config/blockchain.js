const { ethers } = require('ethers');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// Load contract ABIs directly from submodule
function loadContractABI(contractName) {
  try {
    // Load directly from contracts submodule
    const contractsPath = path.join(__dirname, '../../../contracts-submodule/exports', `${contractName}.json`);
    if (fs.existsSync(contractsPath)) {
      const contractData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
      return contractData.abi;
    }

    // Try to load from index.json (consolidated ABIs)
    const indexPath = path.join(__dirname, '../../../contracts-submodule/exports/index.json');
    if (fs.existsSync(indexPath)) {
      const allContracts = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      if (allContracts[contractName] && allContracts[contractName].abi) {
        return allContracts[contractName].abi;
      }
    }

    throw new Error(`Contract ABI not found: ${contractName}`);
  } catch (error) {
    logger.warn(`Failed to load ABI for ${contractName}, using fallback:`, error.message);
    return getFallbackABI(contractName);
  }
}

// Fallback ABIs for development/testing
function getFallbackABI(contractName) {
  const fallbackABIs = {
    AbunfiVault: [
      "function deposit(uint256 amount, address receiver) external returns (uint256)",
      "function withdraw(uint256 shares, address receiver, address owner) external returns (uint256)",
      "function balanceOf(address user) external view returns (uint256)",
      "function totalAssets() external view returns (uint256)",
      "function userShares(address user) external view returns (uint256)",
      "function userDeposits(address user) external view returns (uint256)",
      "function asset() external view returns (address)",
      "function MINIMUM_DEPOSIT() external view returns (uint256)",
      "event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)",
      "event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)"
    ],
    MockERC20: [
      "function balanceOf(address owner) external view returns (uint256)",
      "function transfer(address to, uint256 amount) external returns (bool)",
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function allowance(address owner, address spender) external view returns (uint256)",
      "function decimals() external view returns (uint8)",
      "function name() external view returns (string)",
      "function symbol() external view returns (string)"
    ],
    AaveStrategy: [
      "function totalAssets() external view returns (uint256)",
      "function getAPY() external view returns (uint256)",
      "function name() external view returns (string)",
      "function asset() external view returns (address)",
      "function vault() external view returns (address)"
    ],
    CompoundStrategy: [
      "function totalAssets() external view returns (uint256)",
      "function getAPY() external view returns (uint256)",
      "function name() external view returns (string)",
      "function asset() external view returns (address)",
      "function vault() external view returns (address)"
    ],
    LiquidStakingStrategy: [
      "function totalAssets() external view returns (uint256)",
      "function getAPY() external view returns (uint256)",
      "function name() external view returns (string)",
      "function asset() external view returns (address)",
      "function vault() external view returns (address)"
    ],
    LiquidityProvidingStrategy: [
      "function totalAssets() external view returns (uint256)",
      "function getAPY() external view returns (uint256)",
      "function name() external view returns (string)",
      "function asset() external view returns (address)",
      "function vault() external view returns (address)"
    ],
    UniswapV4FairFlowStablecoinStrategy: [
      "function totalAssets() external view returns (uint256)",
      "function getAPY() external view returns (uint256)",
      "function name() external view returns (string)",
      "function asset() external view returns (address)",
      "function vault() external view returns (address)"
    ],
    StrategyManager: [
      "function addStrategy(address strategy, uint256 weight) external",
      "function removeStrategy(address strategy) external",
      "function updateStrategyWeight(address strategy, uint256 newWeight) external",
      "function getAllStrategies() external view returns (address[])"
    ],
    AbunfiSmartAccount: [
      "function execute(address target, uint256 value, bytes calldata data) external",
      "function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas) external"
    ],
    EIP7702Bundler: [
      "function bundleTransactions(bytes[] calldata transactions) external",
      "function estimateGas(bytes[] calldata transactions) external view returns (uint256)"
    ],
    EIP7702Paymaster: [
      "function sponsorTransaction(address user, bytes calldata transaction) external",
      "function getBalance() external view returns (uint256)"
    ]
  };

  return fallbackABIs[contractName] || [];
}

// Load ABIs
const VAULT_ABI = loadContractABI('AbunfiVault');
const STRATEGY_MANAGER_ABI = loadContractABI('StrategyManager');
const USDC_ABI = loadContractABI('MockERC20'); // Using MockERC20 ABI for USDC

// Strategy ABIs
const AAVE_STRATEGY_ABI = loadContractABI('AaveStrategy');
const COMPOUND_STRATEGY_ABI = loadContractABI('CompoundStrategy');
const LIQUID_STAKING_STRATEGY_ABI = loadContractABI('LiquidStakingStrategy');
const LIQUIDITY_PROVIDING_STRATEGY_ABI = loadContractABI('LiquidityProvidingStrategy');
const UNISWAP_V4_FAIRFLOW_STRATEGY_ABI = loadContractABI('UniswapV4FairFlowStablecoinStrategy');

// EIP-7702 ABIs
const SMART_ACCOUNT_ABI = loadContractABI('AbunfiSmartAccount');
const BUNDLER_ABI = loadContractABI('EIP7702Bundler');
const PAYMASTER_ABI = loadContractABI('EIP7702Paymaster');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.vaultContract = null;
    this.strategyManagerContract = null;
    this.usdcContract = null;
    this.strategyContracts = {
      aave: null,
      compound: null,
      liquidStaking: null,
      liquidityProviding: null,
      uniswapV4FairFlow: null
    };
    this.eip7702Contracts = {
      smartAccount: null,
      bundler: null,
      paymaster: null
    };
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

      // Initialize core contracts
      if (process.env.VAULT_CONTRACT_ADDRESS && process.env.VAULT_CONTRACT_ADDRESS !== '0x...') {
        this.vaultContract = new ethers.Contract(
          process.env.VAULT_CONTRACT_ADDRESS,
          VAULT_ABI,
          this.provider
        );
      }

      if (process.env.STRATEGY_MANAGER_ADDRESS && process.env.STRATEGY_MANAGER_ADDRESS !== '0x...') {
        this.strategyManagerContract = new ethers.Contract(
          process.env.STRATEGY_MANAGER_ADDRESS,
          STRATEGY_MANAGER_ABI,
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

      // Initialize strategy contracts
      if (process.env.AAVE_STRATEGY_ADDRESS && process.env.AAVE_STRATEGY_ADDRESS !== '0x...') {
        this.strategyContracts.aave = new ethers.Contract(
          process.env.AAVE_STRATEGY_ADDRESS,
          AAVE_STRATEGY_ABI,
          this.provider
        );
      }

      if (process.env.COMPOUND_STRATEGY_ADDRESS && process.env.COMPOUND_STRATEGY_ADDRESS !== '0x...') {
        this.strategyContracts.compound = new ethers.Contract(
          process.env.COMPOUND_STRATEGY_ADDRESS,
          COMPOUND_STRATEGY_ABI,
          this.provider
        );
      }

      if (process.env.LIQUID_STAKING_STRATEGY_ADDRESS && process.env.LIQUID_STAKING_STRATEGY_ADDRESS !== '0x...') {
        this.strategyContracts.liquidStaking = new ethers.Contract(
          process.env.LIQUID_STAKING_STRATEGY_ADDRESS,
          LIQUID_STAKING_STRATEGY_ABI,
          this.provider
        );
      }

      if (process.env.LIQUIDITY_PROVIDING_STRATEGY_ADDRESS && process.env.LIQUIDITY_PROVIDING_STRATEGY_ADDRESS !== '0x...') {
        this.strategyContracts.liquidityProviding = new ethers.Contract(
          process.env.LIQUIDITY_PROVIDING_STRATEGY_ADDRESS,
          LIQUIDITY_PROVIDING_STRATEGY_ABI,
          this.provider
        );
      }

      if (process.env.UNISWAP_V4_FAIRFLOW_STRATEGY_ADDRESS && process.env.UNISWAP_V4_FAIRFLOW_STRATEGY_ADDRESS !== '0x...') {
        this.strategyContracts.uniswapV4FairFlow = new ethers.Contract(
          process.env.UNISWAP_V4_FAIRFLOW_STRATEGY_ADDRESS,
          UNISWAP_V4_FAIRFLOW_STRATEGY_ABI,
          this.provider
        );
      }

      // Initialize EIP-7702 contracts
      if (process.env.SMART_ACCOUNT_ADDRESS && process.env.SMART_ACCOUNT_ADDRESS !== '0x...') {
        this.eip7702Contracts.smartAccount = new ethers.Contract(
          process.env.SMART_ACCOUNT_ADDRESS,
          SMART_ACCOUNT_ABI,
          this.provider
        );
      }

      if (process.env.EIP7702_BUNDLER_ADDRESS && process.env.EIP7702_BUNDLER_ADDRESS !== '0x...') {
        this.eip7702Contracts.bundler = new ethers.Contract(
          process.env.EIP7702_BUNDLER_ADDRESS,
          BUNDLER_ABI,
          this.provider
        );
      }

      if (process.env.EIP7702_PAYMASTER_ADDRESS && process.env.EIP7702_PAYMASTER_ADDRESS !== '0x...') {
        this.eip7702Contracts.paymaster = new ethers.Contract(
          process.env.EIP7702_PAYMASTER_ADDRESS,
          PAYMASTER_ABI,
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
      if (!this.vaultContract) {
        throw new Error('Vault contract not initialized');
      }

      const totalAssets = await this.vaultContract.totalAssets();

      // Get all strategies info from vault contract
      let strategiesInfo = [];
      try {
        const allStrategiesInfo = await this.vaultContract.getAllStrategiesInfo();
        strategiesInfo = {
          addresses: allStrategiesInfo[0],
          names: allStrategiesInfo[1],
          totalAssetsAmounts: allStrategiesInfo[2],
          apys: allStrategiesInfo[3],
          weights: allStrategiesInfo[4]
        };
      } catch (error) {
        logger.warn('Could not get strategies info from vault:', error.message);
      }

      // Calculate weighted average APY
      let weightedAPY = 0;
      if (strategiesInfo.apys && strategiesInfo.weights) {
        let totalWeight = 0;
        for (let i = 0; i < strategiesInfo.apys.length; i++) {
          const apy = Number(strategiesInfo.apys[i]);
          const weight = Number(strategiesInfo.weights[i]);
          weightedAPY += (apy * weight);
          totalWeight += weight;
        }
        if (totalWeight > 0) {
          weightedAPY = weightedAPY / totalWeight / 100; // Convert from basis points
        }
      }

      return {
        totalAssets: ethers.formatUnits(totalAssets, 6),
        currentAPY: weightedAPY,
        strategiesCount: strategiesInfo.names ? strategiesInfo.names.length : 0,
        strategies: strategiesInfo
      };
    } catch (error) {
      logger.error('Error getting vault stats:', error);
      throw error;
    }
  }

  // Strategy-specific methods
  async getAllStrategiesInfo() {
    try {
      const strategies = [];

      // Get info from each strategy contract
      for (const [strategyType, contract] of Object.entries(this.strategyContracts)) {
        if (contract) {
          try {
            const [totalAssets, apy, name] = await Promise.all([
              contract.totalAssets(),
              contract.getAPY(),
              contract.name()
            ]);

            strategies.push({
              type: strategyType,
              name,
              totalAssets: ethers.formatUnits(totalAssets, 6),
              apy: Number(apy) / 100, // Convert from basis points
              address: await contract.getAddress()
            });
          } catch (error) {
            logger.warn(`Failed to get info for ${strategyType} strategy:`, error.message);
          }
        }
      }

      return strategies;
    } catch (error) {
      logger.error('Error getting all strategies info:', error);
      throw error;
    }
  }

  async getStrategyInfo(strategyType) {
    try {
      const contract = this.strategyContracts[strategyType];
      if (!contract) {
        throw new Error(`Strategy contract not found: ${strategyType}`);
      }

      const [totalAssets, apy, name] = await Promise.all([
        contract.totalAssets(),
        contract.getAPY(),
        contract.name()
      ]);

      return {
        type: strategyType,
        name,
        totalAssets: ethers.formatUnits(totalAssets, 6),
        apy: Number(apy) / 100, // Convert from basis points
        address: await contract.getAddress()
      };
    } catch (error) {
      logger.error(`Error getting ${strategyType} strategy info:`, error);
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

  // EIP-7702 Paymaster methods
  async getSecurityStatus(walletAddress) {
    try {
      if (!this.eip7702Contracts.paymaster) {
        logger.warn('Paymaster contract not initialized, using fallback data');
        return this.getFallbackSecurityStatus(walletAddress);
      }

      const paymaster = this.eip7702Contracts.paymaster;

      // Query contract for account status
      const [isWhitelisted, dailyGasUsed, dailyTxCount, lastResetTimestamp] = await Promise.all([
        paymaster.isWhitelisted(walletAddress),
        paymaster.dailyGasUsed(walletAddress),
        paymaster.dailyTxCount(walletAddress),
        paymaster.lastResetTimestamp(walletAddress)
      ]);

      // Get rate limits
      const dailyGasLimit = isWhitelisted
        ? ethers.parseEther('0.2')
        : ethers.parseEther('0.1');
      const dailyTxLimit = isWhitelisted ? 100 : 50;
      const perTxGasLimit = isWhitelisted
        ? ethers.parseEther('0.02')
        : ethers.parseEther('0.01');

      // Calculate usage percentages using BigNumber arithmetic to avoid precision loss
      const gasUsedPercentage = Number(dailyGasUsed * 10000n / dailyGasLimit) / 100; // Use basis points for precision
      const txUsedPercentage = (Number(dailyTxCount) / dailyTxLimit) * 100;

      // Calculate remaining
      const gasRemaining = ethers.formatEther(dailyGasLimit - dailyGasUsed);
      const txRemaining = dailyTxLimit - Number(dailyTxCount);

      // Determine risk level
      let riskLevel = 'low';
      if (gasUsedPercentage > 80 || txUsedPercentage > 80) {
        riskLevel = 'high';
      } else if (gasUsedPercentage > 60 || txUsedPercentage > 60) {
        riskLevel = 'medium';
      }

      // Generate warnings
      const warnings = [];
      if (gasUsedPercentage > 80) {
        warnings.push({
          type: 'gas_limit',
          severity: gasUsedPercentage > 95 ? 'critical' : 'warning',
          message: `You've used ${gasUsedPercentage.toFixed(1)}% of your daily gas limit`,
          remaining: gasRemaining
        });
      }

      if (txUsedPercentage > 80) {
        warnings.push({
          type: 'tx_limit',
          severity: txUsedPercentage > 95 ? 'critical' : 'warning',
          message: `You've used ${txUsedPercentage.toFixed(1)}% of your daily transaction limit`,
          remaining: txRemaining
        });
      }

      // Calculate next reset time
      const now = Math.floor(Date.now() / 1000);
      const lastReset = lastResetTimestamp.toNumber(); // Safe conversion for timestamp
      const nextReset = lastReset + (24 * 60 * 60); // 24 hours

      return {
        walletAddress,
        isWhitelisted,
        riskLevel,
        limits: {
          dailyGasLimit: ethers.formatEther(dailyGasLimit),
          dailyTxLimit,
          perTxGasLimit: ethers.formatEther(perTxGasLimit)
        },
        usage: {
          dailyGasUsed: ethers.formatEther(dailyGasUsed),
          dailyTxCount: dailyTxCount.toNumber(), // Safe conversion for transaction count
          gasUsedPercentage: gasUsedPercentage.toFixed(2),
          txUsedPercentage: txUsedPercentage.toFixed(2)
        },
        remaining: {
          gas: gasRemaining,
          transactions: txRemaining
        },
        warnings,
        timestamps: {
          lastReset: new Date(lastReset * 1000).toISOString(),
          nextReset: new Date(nextReset * 1000).toISOString(),
          currentTime: new Date(now * 1000).toISOString()
        }
      };
    } catch (error) {
      logger.error('Error querying paymaster contract:', error);
      return this.getFallbackSecurityStatus(walletAddress);
    }
  }

  getFallbackSecurityStatus(walletAddress) {
    const addressHash = ethers.keccak256(ethers.toUtf8Bytes(walletAddress));
    const hashInt = parseInt(addressHash.slice(2, 10), 16);

    const isWhitelisted = hashInt % 10 < 3;
    const gasUsedPercentage = (hashInt % 100) * 0.8;
    const txUsedPercentage = (hashInt % 100) * 0.6;

    const dailyGasLimit = isWhitelisted ? '0.2' : '0.1';
    const dailyTxLimit = isWhitelisted ? 100 : 50;
    const perTxLimit = isWhitelisted ? '0.02' : '0.01';

    const gasUsed = (parseFloat(dailyGasLimit) * gasUsedPercentage / 100).toFixed(6);
    const txUsed = Math.floor(dailyTxLimit * txUsedPercentage / 100);

    const gasRemaining = (parseFloat(dailyGasLimit) - parseFloat(gasUsed)).toFixed(6);
    const txRemaining = dailyTxLimit - txUsed;

    let riskLevel = 'low';
    if (gasUsedPercentage > 80 || txUsedPercentage > 80) {
      riskLevel = 'high';
    } else if (gasUsedPercentage > 60 || txUsedPercentage > 60) {
      riskLevel = 'medium';
    }

    const warnings = [];
    if (gasUsedPercentage > 80) {
      warnings.push({
        type: 'gas_limit',
        severity: gasUsedPercentage > 95 ? 'critical' : 'warning',
        message: `You've used ${gasUsedPercentage.toFixed(1)}% of your daily gas limit`,
        remaining: gasRemaining
      });
    }

    if (txUsedPercentage > 80) {
      warnings.push({
        type: 'tx_limit',
        severity: txUsedPercentage > 95 ? 'critical' : 'warning',
        message: `You've used ${txUsedPercentage.toFixed(1)}% of your daily transaction limit`,
        remaining: txRemaining
      });
    }

    const now = new Date();
    const lastReset = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextReset = new Date(lastReset.getTime() + 24 * 60 * 60 * 1000);

    return {
      walletAddress,
      isWhitelisted,
      riskLevel,
      limits: {
        dailyGasLimit,
        dailyTxLimit,
        perTxGasLimit: perTxLimit
      },
      usage: {
        dailyGasUsed: gasUsed,
        dailyTxCount: txUsed,
        gasUsedPercentage: gasUsedPercentage.toFixed(2),
        txUsedPercentage: txUsedPercentage.toFixed(2)
      },
      remaining: {
        gas: gasRemaining,
        transactions: txRemaining
      },
      warnings,
      timestamps: {
        lastReset: lastReset.toISOString(),
        nextReset: nextReset.toISOString(),
        currentTime: now.toISOString()
      },
      _fallback: true
    };
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
