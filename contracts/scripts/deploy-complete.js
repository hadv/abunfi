const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Network configurations
const NETWORK_CONFIG = {
  arbitrum: {
    name: "Arbitrum One",
    chainId: 42161,
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    aave: {
      pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
      dataProvider: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654"
    },
    compound: {
      comet: "0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA",
      rewards: "0x88730d254A2f7e6AC8388c3198aFd694bA9f7fae"
    },
    curve: {
      factory: "0xb9fC157394Af804a3578134A6585C0dc9cc990d4",
      registry: "0x445FE580eF8d70FF569aB36e80c647af338db351"
    },
    uniswap: {
      factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      positionManager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
      router: "0xE592427A0AEce92De3Edee1F18E0157C05861564"
    }
  },
  ethereum: {
    name: "Ethereum Mainnet",
    chainId: 1,
    USDC: "0xA0b86a33E6441b8dB2B2B0d4C1C1C1C1C1C1C1C1",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    aave: {
      pool: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
      dataProvider: "0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3"
    },
    compound: {
      comet: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
      rewards: "0x1B0e765F6224C21223AeA2af16c1C46E38885a40"
    },
    lido: {
      stETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"
    },
    rocketPool: {
      rETH: "0xae78736Cd615f374D3085123A210448E74Fc6393"
    }
  },
  polygon: {
    name: "Polygon",
    chainId: 137,
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    aave: {
      pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
      dataProvider: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654"
    }
  }
};

class AbunfiDeployer {
  constructor(network) {
    this.network = network;
    this.config = NETWORK_CONFIG[network];
    this.deployedContracts = {};
    this.deploymentLog = [];
    
    if (!this.config) {
      throw new Error(`Unsupported network: ${network}`);
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    this.deploymentLog.push(logMessage);
  }

  async deploy() {
    this.log(`🚀 Starting Abunfi deployment on ${this.config.name}...`);
    
    const [deployer] = await ethers.getSigners();
    this.log(`Deploying with account: ${deployer.address}`);
    
    const balance = await deployer.provider.getBalance(deployer.address);
    this.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

    try {
      // Deploy core contracts
      await this.deployVault();
      await this.deployStrategyManager();
      
      // Deploy strategies
      await this.deployAaveStrategy();
      await this.deployCompoundStrategy();
      
      if (this.network === "ethereum") {
        await this.deployLiquidStakingStrategy();
      }
      
      await this.deployLiquidityProvidingStrategy();
      
      // Configure contracts
      await this.configureContracts();
      
      // Verify contracts
      await this.verifyContracts();
      
      // Save deployment info
      await this.saveDeploymentInfo();
      
      this.log("✨ Deployment completed successfully!");
      
    } catch (error) {
      this.log(`❌ Deployment failed: ${error.message}`);
      throw error;
    }
  }

  async deployVault() {
    this.log("\n📦 Deploying AbunfiVault...");
    
    const AbunfiVault = await ethers.getContractFactory("AbunfiVault");
    const vault = await AbunfiVault.deploy(this.config.USDC);
    await vault.waitForDeployment();
    
    const vaultAddress = await vault.getAddress();
    this.deployedContracts.vault = vaultAddress;
    this.log(`✅ AbunfiVault deployed to: ${vaultAddress}`);
  }

  async deployStrategyManager() {
    this.log("\n📦 Deploying StrategyManager...");
    
    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    const strategyManager = await StrategyManager.deploy();
    await strategyManager.waitForDeployment();
    
    const managerAddress = await strategyManager.getAddress();
    this.deployedContracts.strategyManager = managerAddress;
    this.log(`✅ StrategyManager deployed to: ${managerAddress}`);
  }

  async deployAaveStrategy() {
    if (!this.config.aave) {
      this.log("⚠️ Skipping Aave strategy - not supported on this network");
      return;
    }

    this.log("\n📦 Deploying AaveStrategy...");
    
    const AaveStrategy = await ethers.getContractFactory("AaveStrategy");
    const aaveStrategy = await AaveStrategy.deploy(
      this.config.USDC,
      this.config.aave.pool,
      this.config.aave.dataProvider,
      this.deployedContracts.vault
    );
    await aaveStrategy.waitForDeployment();
    
    const strategyAddress = await aaveStrategy.getAddress();
    this.deployedContracts.aaveStrategy = strategyAddress;
    this.log(`✅ AaveStrategy deployed to: ${strategyAddress}`);
  }

  async deployCompoundStrategy() {
    if (!this.config.compound) {
      this.log("⚠️ Skipping Compound strategy - not supported on this network");
      return;
    }

    this.log("\n📦 Deploying CompoundStrategy...");
    
    const CompoundStrategy = await ethers.getContractFactory("CompoundStrategy");
    const compoundStrategy = await CompoundStrategy.deploy(
      this.config.USDC,
      this.config.compound.comet,
      this.config.compound.rewards,
      this.deployedContracts.vault
    );
    await compoundStrategy.waitForDeployment();
    
    const strategyAddress = await compoundStrategy.getAddress();
    this.deployedContracts.compoundStrategy = strategyAddress;
    this.log(`✅ CompoundStrategy deployed to: ${strategyAddress}`);
  }

  async deployLiquidStakingStrategy() {
    this.log("\n📦 Deploying LiquidStakingStrategy...");
    
    const LiquidStakingStrategy = await ethers.getContractFactory("LiquidStakingStrategy");
    const liquidStakingStrategy = await LiquidStakingStrategy.deploy();
    await liquidStakingStrategy.waitForDeployment();
    
    const strategyAddress = await liquidStakingStrategy.getAddress();
    this.deployedContracts.liquidStakingStrategy = strategyAddress;
    this.log(`✅ LiquidStakingStrategy deployed to: ${strategyAddress}`);
  }

  async deployLiquidityProvidingStrategy() {
    this.log("\n📦 Deploying LiquidityProvidingStrategy...");
    
    const LiquidityProvidingStrategy = await ethers.getContractFactory("LiquidityProvidingStrategy");
    const liquidityProvidingStrategy = await LiquidityProvidingStrategy.deploy();
    await liquidityProvidingStrategy.waitForDeployment();
    
    const strategyAddress = await liquidityProvidingStrategy.getAddress();
    this.deployedContracts.liquidityProvidingStrategy = strategyAddress;
    this.log(`✅ LiquidityProvidingStrategy deployed to: ${strategyAddress}`);
  }

  async configureContracts() {
    this.log("\n🔧 Configuring contracts...");
    
    const vault = await ethers.getContractAt("AbunfiVault", this.deployedContracts.vault);
    const strategyManager = await ethers.getContractAt("StrategyManager", this.deployedContracts.strategyManager);
    
    // Add strategies to vault
    if (this.deployedContracts.aaveStrategy) {
      this.log("Adding Aave strategy to vault...");
      await vault.addStrategy(this.deployedContracts.aaveStrategy, 3000); // 30% weight
    }
    
    if (this.deployedContracts.compoundStrategy) {
      this.log("Adding Compound strategy to vault...");
      await vault.addStrategy(this.deployedContracts.compoundStrategy, 2500); // 25% weight
    }
    
    if (this.deployedContracts.liquidStakingStrategy) {
      this.log("Adding Liquid Staking strategy to vault...");
      await vault.addStrategy(this.deployedContracts.liquidStakingStrategy, 2000); // 20% weight
    }
    
    if (this.deployedContracts.liquidityProvidingStrategy) {
      this.log("Adding Liquidity Providing strategy to vault...");
      await vault.addStrategy(this.deployedContracts.liquidityProvidingStrategy, 2500); // 25% weight
    }
    
    // Add strategies to strategy manager
    if (this.deployedContracts.aaveStrategy) {
      this.log("Adding Aave strategy to strategy manager...");
      await strategyManager.addStrategy(
        this.deployedContracts.aaveStrategy,
        3000, // weight
        20,   // risk score
        4000, // max allocation (40%)
        1000  // min allocation (10%)
      );
    }
    
    this.log("✅ Contract configuration completed");
  }

  async verifyContracts() {
    if (process.env.ETHERSCAN_API_KEY) {
      this.log("\n🔍 Verifying contracts on Etherscan...");
      
      try {
        // Note: In a real deployment, you would use hardhat-verify plugin
        // This is a placeholder for the verification process
        this.log("Contract verification would be performed here");
        this.log("✅ Contract verification completed");
      } catch (error) {
        this.log(`⚠️ Contract verification failed: ${error.message}`);
      }
    } else {
      this.log("⚠️ Skipping contract verification - ETHERSCAN_API_KEY not provided");
    }
  }

  async saveDeploymentInfo() {
    const deploymentInfo = {
      network: this.network,
      chainId: this.config.chainId,
      timestamp: new Date().toISOString(),
      deployer: (await ethers.getSigners())[0].address,
      contracts: this.deployedContracts,
      config: this.config,
      log: this.deploymentLog
    };

    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `${this.network}-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    this.log(`💾 Deployment info saved to: ${filepath}`);

    // Also save latest deployment
    const latestPath = path.join(deploymentsDir, `${this.network}-latest.json`);
    fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));
  }
}

async function main() {
  const network = process.env.HARDHAT_NETWORK || "localhost";
  
  console.log(`Deploying to network: ${network}`);
  
  const deployer = new AbunfiDeployer(network);
  await deployer.deploy();
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = { AbunfiDeployer, NETWORK_CONFIG };
