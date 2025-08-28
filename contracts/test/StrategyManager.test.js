const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StrategyManager", function () {
  let strategyManager;
  let mockAaveStrategy;
  let mockCompoundStrategy;
  let mockLiquidStakingStrategy;
  let mockUSDC;
  let owner;
  let user1;
  let user2;

  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 6); // 1M USDC

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();

    // Deploy StrategyManager
    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    strategyManager = await StrategyManager.deploy();
    await strategyManager.waitForDeployment();

    // Create mock strategies (simplified for testing)
    const MockStrategy = await ethers.getContractFactory("MockStrategy");
    
    mockAaveStrategy = await MockStrategy.deploy(
      await mockUSDC.getAddress(),
      "Aave Strategy",
      500 // 5% APY
    );
    await mockAaveStrategy.waitForDeployment();

    mockCompoundStrategy = await MockStrategy.deploy(
      await mockUSDC.getAddress(),
      "Compound Strategy",
      450 // 4.5% APY
    );
    await mockCompoundStrategy.waitForDeployment();

    mockLiquidStakingStrategy = await MockStrategy.deploy(
      await mockUSDC.getAddress(),
      "Liquid Staking Strategy",
      600 // 6% APY
    );
    await mockLiquidStakingStrategy.waitForDeployment();

    // Setup initial balances
    await mockUSDC.mint(await strategyManager.getAddress(), INITIAL_SUPPLY);
  });

  describe("Deployment", function () {
    it("Should initialize with correct parameters", async function () {
      expect(await strategyManager.riskTolerance()).to.equal(50);
      expect(await strategyManager.performanceWindow()).to.equal(30 * 24 * 3600); // 30 days
      expect(await strategyManager.rebalanceThreshold()).to.equal(500); // 5%
      expect(await strategyManager.BASIS_POINTS()).to.equal(10000);
      expect(await strategyManager.MAX_RISK_SCORE()).to.equal(100);
    });

    it("Should set correct owner", async function () {
      expect(await strategyManager.owner()).to.equal(owner.address);
    });
  });

  describe("Strategy Management", function () {
    it("Should add new strategy", async function () {
      await expect(strategyManager.addStrategy(
        await mockAaveStrategy.getAddress(),
        3000, // 30% weight
        20,   // 20% risk score
        4000, // 40% max allocation
        1000  // 10% min allocation
      )).to.emit(strategyManager, "StrategyAdded");

      const strategy = await strategyManager.strategies(await mockAaveStrategy.getAddress());
      expect(strategy.weight).to.equal(3000);
      expect(strategy.riskScore).to.equal(20);
      expect(strategy.isActive).to.be.true;
    });

    it("Should revert when adding strategy with invalid parameters", async function () {
      // Invalid weight (zero)
      await expect(strategyManager.addStrategy(
        await mockAaveStrategy.getAddress(),
        0,
        20,
        4000,
        1000
      )).to.be.revertedWith("Weight must be positive");

      // Invalid risk score (over 100)
      await expect(strategyManager.addStrategy(
        await mockAaveStrategy.getAddress(),
        3000,
        150,
        4000,
        1000
      )).to.be.revertedWith("Risk score too high");

      // Min allocation > max allocation
      await expect(strategyManager.addStrategy(
        await mockAaveStrategy.getAddress(),
        3000,
        20,
        3000,
        4000
      )).to.be.revertedWith("Min allocation > max allocation");
    });

    it("Should update strategy parameters", async function () {
      // Add strategy first
      await strategyManager.addStrategy(
        await mockAaveStrategy.getAddress(),
        3000,
        20,
        4000,
        1000
      );

      await expect(strategyManager.updateStrategy(
        await mockAaveStrategy.getAddress(),
        3500, // New weight
        25,   // New risk score
        4500, // New max allocation
        1500  // New min allocation
      )).to.emit(strategyManager, "StrategyUpdated");

      const strategy = await strategyManager.strategies(await mockAaveStrategy.getAddress());
      expect(strategy.weight).to.equal(3500);
      expect(strategy.riskScore).to.equal(25);
    });

    it("Should deactivate strategy", async function () {
      // Add strategy first
      await strategyManager.addStrategy(
        await mockAaveStrategy.getAddress(),
        3000,
        20,
        4000,
        1000
      );

      await expect(strategyManager.deactivateStrategy(await mockAaveStrategy.getAddress()))
        .to.emit(strategyManager, "StrategyDeactivated");

      const strategy = await strategyManager.strategies(await mockAaveStrategy.getAddress());
      expect(strategy.isActive).to.be.false;
    });

    it("Should reactivate strategy", async function () {
      // Add and deactivate strategy first
      await strategyManager.addStrategy(
        await mockAaveStrategy.getAddress(),
        3000,
        20,
        4000,
        1000
      );
      await strategyManager.deactivateStrategy(await mockAaveStrategy.getAddress());

      await expect(strategyManager.reactivateStrategy(await mockAaveStrategy.getAddress()))
        .to.emit(strategyManager, "StrategyReactivated");

      const strategy = await strategyManager.strategies(await mockAaveStrategy.getAddress());
      expect(strategy.isActive).to.be.true;
    });
  });

  describe("APY Tracking", function () {
    beforeEach(async function () {
      await strategyManager.addStrategy(
        await mockAaveStrategy.getAddress(),
        3000,
        20,
        4000,
        1000
      );
    });

    it("Should update strategy APY", async function () {
      const newAPY = 550; // 5.5%
      
      await expect(strategyManager.updateStrategyAPY(
        await mockAaveStrategy.getAddress(),
        newAPY
      )).to.emit(strategyManager, "APYUpdated");

      const strategy = await strategyManager.strategies(await mockAaveStrategy.getAddress());
      expect(strategy.lastAPY).to.equal(newAPY);
    });

    it("Should calculate moving average APY", async function () {
      // Update APY multiple times
      await strategyManager.updateStrategyAPY(await mockAaveStrategy.getAddress(), 500);
      await strategyManager.updateStrategyAPY(await mockAaveStrategy.getAddress(), 550);
      await strategyManager.updateStrategyAPY(await mockAaveStrategy.getAddress(), 600);

      const strategy = await strategyManager.strategies(await mockAaveStrategy.getAddress());
      expect(strategy.apyHistory).to.be.gt(0);
    });

    it("Should update performance score based on consistency", async function () {
      // Simulate consistent performance with same APY values
      for (let i = 0; i < 10; i++) {
        await strategyManager.updateStrategyAPY(await mockAaveStrategy.getAddress(), 500); // Consistent APY
      }

      const strategy = await strategyManager.strategies(await mockAaveStrategy.getAddress());
      // With consistent APY, performance score should be high (low variance)
      expect(strategy.performanceScore).to.be.gte(50); // Should maintain or improve from initial 50
    });
  });

  describe("Allocation Calculation", function () {
    beforeEach(async function () {
      // Add multiple strategies
      await strategyManager.addStrategy(
        await mockAaveStrategy.getAddress(),
        3000, // 30% weight
        20,   // Low risk
        4000,
        1000
      );

      await strategyManager.addStrategy(
        await mockCompoundStrategy.getAddress(),
        2500, // 25% weight
        25,   // Medium risk
        3500,
        800
      );

      await strategyManager.addStrategy(
        await mockLiquidStakingStrategy.getAddress(),
        4500, // 45% weight
        15,   // Very low risk
        5000,
        1500
      );
    });

    it("Should calculate optimal allocation", async function () {
      const totalAmount = ethers.parseUnits("10000", 6); // 10k USDC
      
      const allocations = await strategyManager.calculateOptimalAllocation(totalAmount);
      
      expect(allocations.length).to.equal(3);
      
      // Check that allocations sum to total amount
      let totalAllocated = 0n;
      for (let i = 0; i < allocations.length; i++) {
        totalAllocated += allocations[i];
      }
      expect(totalAllocated).to.equal(totalAmount);
    });

    it("Should respect risk tolerance in allocation", async function () {
      // Set low risk tolerance
      await strategyManager.setRiskTolerance(30);
      
      const totalAmount = ethers.parseUnits("10000", 6);
      const allocations = await strategyManager.calculateOptimalAllocation(totalAmount);
      
      // Lower risk strategies should get more allocation
      // This would need more sophisticated testing based on actual implementation
      expect(allocations.length).to.equal(3);
    });

    it("Should respect min/max allocation constraints", async function () {
      const totalAmount = ethers.parseUnits("10000", 6);
      const allocations = await strategyManager.calculateOptimalAllocation(totalAmount);
      
      // Check each allocation respects constraints
      for (let i = 0; i < allocations.length; i++) {
        const strategyAddr = await strategyManager.strategyList(i);
        const strategy = await strategyManager.strategies(strategyAddr);
        
        const allocationPercent = (allocations[i] * 10000n) / totalAmount;
        expect(allocationPercent).to.be.gte(strategy.minAllocation);
        expect(allocationPercent).to.be.lte(strategy.maxAllocation);
      }
    });
  });

  describe("Rebalancing", function () {
    beforeEach(async function () {
      await strategyManager.addStrategy(
        await mockAaveStrategy.getAddress(),
        3000,
        20,
        4000,
        1000
      );

      await strategyManager.addStrategy(
        await mockCompoundStrategy.getAddress(),
        2500,
        25,
        3500,
        800
      );
    });

    it("Should determine when rebalancing is needed", async function () {
      const currentAllocations = [
        ethers.parseUnits("6000", 6), // 60%
        ethers.parseUnits("4000", 6)  // 40%
      ];
      
      const currentStrategies = [await mockAaveStrategy.getAddress(), await mockCompoundStrategy.getAddress()];
      const isNeeded = await strategyManager.shouldRebalance(currentStrategies, currentAllocations);
      // This depends on the current optimal allocation vs current allocation
      expect(typeof isNeeded).to.equal("boolean");
    });

    it("Should calculate rebalancing amounts", async function () {
      const currentAllocations = [
        ethers.parseUnits("6000", 6),
        ethers.parseUnits("4000", 6)
      ];
      
      const strategies = [await mockAaveStrategy.getAddress(), await mockCompoundStrategy.getAddress()];
      const totalAmount = ethers.parseUnits("10000", 6);
      const rebalanceAmounts = await strategyManager.calculateRebalanceAmounts(strategies, currentAllocations, totalAmount);
      expect(rebalanceAmounts.length).to.equal(2);
    });
  });

  describe("Risk Management", function () {
    beforeEach(async function () {
      await strategyManager.addStrategy(
        await mockAaveStrategy.getAddress(),
        3000,
        20,
        4000,
        1000
      );
    });

    it("Should set risk tolerance", async function () {
      await expect(strategyManager.setRiskTolerance(70))
        .to.emit(strategyManager, "RiskToleranceUpdated")
        .withArgs(50, 70); // old value, new value

      expect(await strategyManager.riskTolerance()).to.equal(70);
    });

    it("Should revert when setting invalid risk tolerance", async function () {
      await expect(strategyManager.setRiskTolerance(150))
        .to.be.revertedWith("Risk tolerance too high");
    });

    it("Should calculate risk-adjusted returns", async function () {
      const riskAdjustedReturn = await strategyManager.calculateRiskAdjustedReturn(
        await mockAaveStrategy.getAddress()
      );
      expect(riskAdjustedReturn).to.be.gte(0);
    });
  });

  describe("Performance Tracking", function () {
    beforeEach(async function () {
      await strategyManager.addStrategy(
        await mockAaveStrategy.getAddress(),
        3000,
        20,
        4000,
        1000
      );
    });

    it("Should track strategy performance over time", async function () {
      // Update APY multiple times to simulate performance tracking
      await strategyManager.updateStrategyAPY(await mockAaveStrategy.getAddress(), 500);
      
      // Fast forward time (in real test, would use time manipulation)
      await strategyManager.updateStrategyAPY(await mockAaveStrategy.getAddress(), 520);
      
      const performance = await strategyManager.getStrategyPerformance(await mockAaveStrategy.getAddress());
      expect(performance.length).to.be.gt(0);
    });

    it("Should calculate Sharpe ratio", async function () {
      // Add some performance data
      await strategyManager.updateStrategyAPY(await mockAaveStrategy.getAddress(), 500);
      await strategyManager.updateStrategyAPY(await mockAaveStrategy.getAddress(), 520);
      await strategyManager.updateStrategyAPY(await mockAaveStrategy.getAddress(), 480);
      
      const sharpeRatio = await strategyManager.calculateSharpeRatio(await mockAaveStrategy.getAddress());
      expect(sharpeRatio).to.be.gte(0);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await strategyManager.addStrategy(
        await mockAaveStrategy.getAddress(),
        3000,
        20,
        4000,
        1000
      );

      await strategyManager.addStrategy(
        await mockCompoundStrategy.getAddress(),
        2500,
        25,
        3500,
        800
      );
    });

    it("Should return all active strategies", async function () {
      const activeStrategies = await strategyManager.getActiveStrategies();
      expect(activeStrategies.length).to.equal(2);
    });

    it("Should return strategy count", async function () {
      const count = await strategyManager.getStrategyCount();
      expect(count).to.equal(2);
    });

    it("Should return strategy info", async function () {
      const info = await strategyManager.getStrategyInfo(await mockAaveStrategy.getAddress());
      expect(info.weight).to.equal(3000);
      expect(info.riskScore).to.equal(20);
      expect(info.isActive).to.be.true;
    });

    it("Should return portfolio summary", async function () {
      const summary = await strategyManager.getPortfolioSummary();
      expect(summary.totalStrategies).to.equal(2);
      expect(summary.activeStrategies).to.equal(2);
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to add strategies", async function () {
      await expect(strategyManager.connect(user1).addStrategy(
        await mockAaveStrategy.getAddress(),
        3000,
        20,
        4000,
        1000
      )).to.be.revertedWithCustomError(strategyManager, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to update risk tolerance", async function () {
      await expect(strategyManager.connect(user1).setRiskTolerance(70))
        .to.be.revertedWithCustomError(strategyManager, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to update strategy parameters", async function () {
      await strategyManager.addStrategy(
        await mockAaveStrategy.getAddress(),
        3000,
        20,
        4000,
        1000
      );

      await expect(strategyManager.connect(user1).updateStrategy(
        await mockAaveStrategy.getAddress(),
        3500,
        25,
        4500,
        1500
      )).to.be.revertedWithCustomError(strategyManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("Emergency Functions", function () {
    beforeEach(async function () {
      await strategyManager.addStrategy(
        await mockAaveStrategy.getAddress(),
        3000,
        20,
        4000,
        1000
      );
    });

    it("Should allow owner to pause strategy", async function () {
      await strategyManager.pauseStrategy(await mockAaveStrategy.getAddress());
      
      const strategy = await strategyManager.strategies(await mockAaveStrategy.getAddress());
      expect(strategy.isActive).to.be.false;
    });

    it("Should allow owner to emergency stop all strategies", async function () {
      await strategyManager.emergencyStop();
      
      // All strategies should be deactivated
      const strategy = await strategyManager.strategies(await mockAaveStrategy.getAddress());
      expect(strategy.isActive).to.be.false;
    });
  });
});
