const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Testnet configurations
const TESTNET_CONFIG = {
  sepolia: {
    name: "Sepolia Testnet",
    chainId: 11155111,
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Mock USDC for testing
    WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    faucets: {
      USDC: "https://faucet.circle.com/",
      ETH: "https://sepoliafaucet.com/"
    }
  },
  goerli: {
    name: "Goerli Testnet",
    chainId: 5,
    USDC: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
    WETH: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    aave: {
      pool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
      dataProvider: "0x9BE876c6DC42215B00d7efe892E2691C3bc35d10"
    }
  },
  mumbai: {
    name: "Polygon Mumbai",
    chainId: 80001,
    USDC: "0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e",
    WETH: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"
  },
  arbitrumGoerli: {
    name: "Arbitrum Goerli",
    chainId: 421613,
    USDC: "0x8FB1E3fC51F3b789dED7557E680551d93Ea9d892",
    WETH: "0xe39Ab88f8A4777030A534146A9Ca3B52bd5D43A3"
  }
};

class TestnetDeployer {
  constructor(network) {
    this.network = network;
    this.config = TESTNET_CONFIG[network];
    this.deployedContracts = {};
    this.mockContracts = {};
    
    if (!this.config) {
      throw new Error(`Unsupported testnet: ${network}`);
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  async deploy() {
    this.log(`🚀 Starting Abunfi testnet deployment on ${this.config.name}...`);
    
    const [deployer] = await ethers.getSigners();
    this.log(`Deploying with account: ${deployer.address}`);
    
    const balance = await deployer.provider.getBalance(deployer.address);
    this.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

    try {
      // Deploy mock contracts for testing
      await this.deployMockContracts();
      
      // Deploy core contracts
      await this.deployVault();
      await this.deployStrategyManager();
      
      // Deploy strategies with mocks
      await this.deployStrategiesWithMocks();
      
      // Configure contracts
      await this.configureTestnetContracts();
      
      // Setup test scenarios
      await this.setupTestScenarios();
      
      // Save deployment info
      await this.saveTestnetDeploymentInfo();
      
      this.log("✨ Testnet deployment completed successfully!");
      this.printTestnetInfo();
      
    } catch (error) {
      this.log(`❌ Deployment failed: ${error.message}`);
      throw error;
    }
  }

  async deployMockContracts() {
    this.log("\n📦 Deploying mock contracts for testing...");
    
    // Deploy mock USDC if not available
    if (!this.config.USDC) {
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const mockUSDC = await MockERC20.deploy("Mock USD Coin", "USDC", 6);
      await mockUSDC.waitForDeployment();
      
      this.mockContracts.USDC = await mockUSDC.getAddress();
      this.config.USDC = this.mockContracts.USDC;
      this.log(`✅ Mock USDC deployed to: ${this.mockContracts.USDC}`);
    }

    // Deploy mock Aave contracts
    const MockAavePool = await ethers.getContractFactory("MockAavePool");
    const mockAavePool = await MockAavePool.deploy();
    await mockAavePool.waitForDeployment();
    
    const MockAaveDataProvider = await ethers.getContractFactory("MockAaveDataProvider");
    const mockAaveDataProvider = await MockAaveDataProvider.deploy();
    await mockAaveDataProvider.waitForDeployment();
    
    this.mockContracts.aavePool = await mockAavePool.getAddress();
    this.mockContracts.aaveDataProvider = await mockAaveDataProvider.getAddress();
    
    // Deploy mock aUSDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockAUSDC = await MockERC20.deploy("Mock Aave USDC", "aUSDC", 6);
    await mockAUSDC.waitForDeployment();
    this.mockContracts.aUSDC = await mockAUSDC.getAddress();
    
    // Configure mock Aave
    await mockAavePool.setAToken(this.config.USDC, this.mockContracts.aUSDC);
    await mockAaveDataProvider.setReserveTokens(
      this.config.USDC,
      this.mockContracts.aUSDC,
      ethers.ZeroAddress,
      ethers.ZeroAddress
    );
    
    this.log(`✅ Mock Aave contracts deployed`);

    // Deploy mock Compound contracts
    const MockComet = await ethers.getContractFactory("MockComet");
    const mockComet = await MockComet.deploy(this.config.USDC);
    await mockComet.waitForDeployment();
    
    const MockCometRewards = await ethers.getContractFactory("MockCometRewards");
    const mockCometRewards = await MockCometRewards.deploy();
    await mockCometRewards.waitForDeployment();
    
    this.mockContracts.comet = await mockComet.getAddress();
    this.mockContracts.cometRewards = await mockCometRewards.getAddress();
    
    this.log(`✅ Mock Compound contracts deployed`);

    // Deploy mock liquid staking contracts
    const MockLidoStETH = await ethers.getContractFactory("MockLidoStETH");
    const mockStETH = await MockLidoStETH.deploy();
    await mockStETH.waitForDeployment();
    
    const MockRocketPoolRETH = await ethers.getContractFactory("MockRocketPoolRETH");
    const mockRETH = await MockRocketPoolRETH.deploy();
    await mockRETH.waitForDeployment();
    
    this.mockContracts.stETH = await mockStETH.getAddress();
    this.mockContracts.rETH = await mockRETH.getAddress();
    
    this.log(`✅ Mock liquid staking contracts deployed`);

    // Deploy mock Curve and Uniswap contracts
    const MockCurvePool = await ethers.getContractFactory("MockCurvePool");
    const mockCurvePool = await MockCurvePool.deploy(
      "Mock 3Pool",
      "3CRV",
      [this.config.USDC, this.config.USDC, this.config.USDC] // Simplified for testing
    );
    await mockCurvePool.waitForDeployment();
    
    this.mockContracts.curvePool = await mockCurvePool.getAddress();
    this.log(`✅ Mock Curve pool deployed`);
  }

  async deployVault() {
    this.log("\n📦 Deploying AbunfiVault...");
    
    const AbunfiVault = await ethers.getContractFactory("AbunfiVault");
    const vault = await AbunfiVault.deploy(this.config.USDC);
    await vault.waitForDeployment();
    
    this.deployedContracts.vault = await vault.getAddress();
    this.log(`✅ AbunfiVault deployed to: ${this.deployedContracts.vault}`);
  }

  async deployStrategyManager() {
    this.log("\n📦 Deploying StrategyManager...");
    
    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    const strategyManager = await StrategyManager.deploy();
    await strategyManager.waitForDeployment();
    
    this.deployedContracts.strategyManager = await strategyManager.getAddress();
    this.log(`✅ StrategyManager deployed to: ${this.deployedContracts.strategyManager}`);
  }

  async deployStrategiesWithMocks() {
    this.log("\n📦 Deploying strategies with mock dependencies...");
    
    // Deploy Aave strategy with mocks
    const AaveStrategy = await ethers.getContractFactory("AaveStrategy");
    const aaveStrategy = await AaveStrategy.deploy(
      this.config.USDC,
      this.mockContracts.aavePool,
      this.mockContracts.aaveDataProvider,
      this.deployedContracts.vault
    );
    await aaveStrategy.waitForDeployment();
    this.deployedContracts.aaveStrategy = await aaveStrategy.getAddress();
    
    // Deploy Compound strategy with mocks
    const CompoundStrategy = await ethers.getContractFactory("CompoundStrategy");
    const compoundStrategy = await CompoundStrategy.deploy(
      this.config.USDC,
      this.mockContracts.comet,
      this.mockContracts.cometRewards,
      this.deployedContracts.vault
    );
    await compoundStrategy.waitForDeployment();
    this.deployedContracts.compoundStrategy = await compoundStrategy.getAddress();
    
    this.log(`✅ Strategies deployed with mock dependencies`);
  }

  async configureTestnetContracts() {
    this.log("\n🔧 Configuring testnet contracts...");
    
    const vault = await ethers.getContractAt("AbunfiVault", this.deployedContracts.vault);
    
    // Add strategies to vault with test weights
    await vault.addStrategy(this.deployedContracts.aaveStrategy, 5000); // 50% weight
    await vault.addStrategy(this.deployedContracts.compoundStrategy, 5000); // 50% weight
    
    this.log("✅ Testnet contract configuration completed");
  }

  async setupTestScenarios() {
    this.log("\n🎭 Setting up test scenarios...");
    
    const [deployer] = await ethers.getSigners();
    
    // Mint test tokens to deployer
    if (this.mockContracts.USDC) {
      const mockUSDC = await ethers.getContractAt("MockERC20", this.mockContracts.USDC);
      await mockUSDC.mint(deployer.address, ethers.parseUnits("100000", 6)); // 100k USDC
      this.log("✅ Minted 100,000 USDC for testing");
    }
    
    // Setup mock yields
    const mockAavePool = await ethers.getContractAt("MockAavePool", this.mockContracts.aavePool);
    await mockAavePool.setSupplyRate(ethers.parseUnits("0.05", 27)); // 5% APY
    
    const mockComet = await ethers.getContractAt("MockComet", this.mockContracts.comet);
    await mockComet.setSupplyRate(ethers.parseUnits("0.045", 18)); // 4.5% APY
    
    this.log("✅ Test scenarios configured");
  }

  async saveTestnetDeploymentInfo() {
    const deploymentInfo = {
      network: this.network,
      chainId: this.config.chainId,
      timestamp: new Date().toISOString(),
      deployer: (await ethers.getSigners())[0].address,
      contracts: this.deployedContracts,
      mockContracts: this.mockContracts,
      config: this.config,
      testnet: true
    };

    const deploymentsDir = path.join(__dirname, "..", "deployments", "testnet");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `${this.network}-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    this.log(`💾 Testnet deployment info saved to: ${filepath}`);
  }

  printTestnetInfo() {
    console.log("\n" + "=".repeat(60));
    console.log("🎉 TESTNET DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log(`Network: ${this.config.name}`);
    console.log(`Chain ID: ${this.config.chainId}`);
    console.log("\n📋 Core Contracts:");
    console.log(`Vault: ${this.deployedContracts.vault}`);
    console.log(`Strategy Manager: ${this.deployedContracts.strategyManager}`);
    console.log("\n🎯 Strategies:");
    console.log(`Aave Strategy: ${this.deployedContracts.aaveStrategy}`);
    console.log(`Compound Strategy: ${this.deployedContracts.compoundStrategy}`);
    console.log("\n🧪 Mock Contracts:");
    Object.entries(this.mockContracts).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });
    console.log("\n💡 Testing Instructions:");
    console.log("1. Use the mock USDC contract to mint test tokens");
    console.log("2. Approve the vault to spend your USDC");
    console.log("3. Deposit USDC into the vault");
    console.log("4. Test strategy allocations and yields");
    console.log("5. Test withdrawals and harvesting");
    
    if (this.config.faucets) {
      console.log("\n🚰 Faucets:");
      Object.entries(this.config.faucets).forEach(([token, url]) => {
        console.log(`${token}: ${url}`);
      });
    }
    
    console.log("=".repeat(60));
  }
}

async function main() {
  const network = process.env.HARDHAT_NETWORK || "sepolia";
  
  if (!TESTNET_CONFIG[network]) {
    console.error(`❌ Unsupported testnet: ${network}`);
    console.log("Supported testnets:", Object.keys(TESTNET_CONFIG).join(", "));
    process.exit(1);
  }
  
  console.log(`Deploying to testnet: ${network}`);
  
  const deployer = new TestnetDeployer(network);
  await deployer.deploy();
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Testnet deployment failed:", error);
      process.exit(1);
    });
}

module.exports = { TestnetDeployer, TESTNET_CONFIG };
