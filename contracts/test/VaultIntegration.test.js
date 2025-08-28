const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault Integration with Multiple Strategies", function () {
  let vault;
  let aaveStrategy;
  let compoundStrategy;
  let strategyManager;
  let mockUSDC;
  let mockAavePool;
  let mockComet;
  let mockCometRewards;
  let owner;
  let user1;
  let user2;

  const INITIAL_SUPPLY = ethers.utils.parseUnits("10000000", 6); // 10M USDC
  const DEPOSIT_AMOUNT = ethers.utils.parseUnits("1000", 6); // 1000 USDC
  const MIN_DEPOSIT = ethers.utils.parseUnits("4", 6); // 4 USDC

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockUSDC.deployed();

    // Deploy mock Aave Pool
    const MockAavePool = await ethers.getContractFactory("MockAavePool");
    mockAavePool = await MockAavePool.deploy(mockUSDC.address);
    await mockAavePool.deployed();

    // Deploy mock Compound Comet
    const MockComet = await ethers.getContractFactory("MockComet");
    mockComet = await MockComet.deploy(mockUSDC.address);
    await mockComet.deployed();

    // Deploy mock CometRewards
    const MockCometRewards = await ethers.getContractFactory("MockCometRewards");
    mockCometRewards = await MockCometRewards.deploy();
    await mockCometRewards.deployed();

    // Deploy AbunfiVault
    const AbunfiVault = await ethers.getContractFactory("AbunfiVault");
    vault = await AbunfiVault.deploy(mockUSDC.address);
    await vault.deployed();

    // Deploy AaveStrategy
    const AaveStrategy = await ethers.getContractFactory("AaveStrategy");
    aaveStrategy = await AaveStrategy.deploy(
      mockUSDC.address,
      mockAavePool.address,
      mockAavePool.address, // Using same address for data provider in mock
      vault.address
    );
    await aaveStrategy.deployed();

    // Deploy CompoundStrategy
    const CompoundStrategy = await ethers.getContractFactory("CompoundStrategy");
    compoundStrategy = await CompoundStrategy.deploy(
      mockUSDC.address,
      mockComet.address,
      mockCometRewards.address,
      vault.address
    );
    await compoundStrategy.deployed();

    // Deploy StrategyManager
    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    strategyManager = await StrategyManager.deploy();
    await strategyManager.deployed();

    // Setup initial balances
    await mockUSDC.mint(user1.address, INITIAL_SUPPLY);
    await mockUSDC.mint(user2.address, INITIAL_SUPPLY);
    await mockUSDC.connect(user1).approve(vault.address, INITIAL_SUPPLY);
    await mockUSDC.connect(user2).approve(vault.address, INITIAL_SUPPLY);
  });

  describe("Strategy Management", function () {
    it("Should add strategies to vault", async function () {
      await vault.addStrategy(aaveStrategy.address, 60); // 60% weight
      await vault.addStrategy(compoundStrategy.address, 40); // 40% weight

      expect(await vault.isActiveStrategy(aaveStrategy.address)).to.be.true;
      expect(await vault.isActiveStrategy(compoundStrategy.address)).to.be.true;
    });

    it("Should get all strategies info", async function () {
      await vault.addStrategy(aaveStrategy.address, 60);
      await vault.addStrategy(compoundStrategy.address, 40);

      const strategiesInfo = await vault.getAllStrategiesInfo();
      expect(strategiesInfo.addresses.length).to.equal(2);
      expect(strategiesInfo.names.length).to.equal(2);
      expect(strategiesInfo.weights.length).to.equal(2);
    });

    it("Should update strategy weights", async function () {
      await vault.addStrategy(aaveStrategy.address, 60);
      
      await vault.updateStrategyWeight(aaveStrategy.address, 70);
      
      const info = await vault.getStrategyInfo(aaveStrategy.address);
      expect(info.weight).to.equal(70);
    });

    it("Should remove strategies", async function () {
      await vault.addStrategy(aaveStrategy.address, 60);
      
      await vault.removeStrategy(aaveStrategy.address);
      
      expect(await vault.isActiveStrategy(aaveStrategy.address)).to.be.false;
    });
  });

  describe("Multi-Strategy Deposits and Withdrawals", function () {
    beforeEach(async function () {
      await vault.addStrategy(aaveStrategy.address, 60);
      await vault.addStrategy(compoundStrategy.address, 40);
    });

    it("Should deposit and allocate to strategies", async function () {
      await vault.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      expect(await vault.totalAssets()).to.be.gte(DEPOSIT_AMOUNT);
      expect(await vault.balanceOf(user1.address)).to.be.gt(0);
    });

    it("Should allocate funds to strategies based on weights", async function () {
      await vault.connect(user1).deposit(DEPOSIT_AMOUNT);
      await vault.allocateToStrategies();

      // Check that funds were allocated
      const aaveBalance = await aaveStrategy.totalAssets();
      const compoundBalance = await compoundStrategy.totalAssets();
      
      expect(aaveBalance.add(compoundBalance)).to.be.gt(0);
    });

    it("Should withdraw from multiple strategies when needed", async function () {
      await vault.connect(user1).deposit(DEPOSIT_AMOUNT);
      await vault.allocateToStrategies();

      const userShares = await vault.userShares(user1.address);
      const halfShares = userShares.div(2);

      await vault.connect(user1).withdraw(halfShares);
      
      expect(await vault.userShares(user1.address)).to.equal(userShares.sub(halfShares));
    });
  });

  describe("Rebalancing", function () {
    beforeEach(async function () {
      await vault.addStrategy(aaveStrategy.address, 60);
      await vault.addStrategy(compoundStrategy.address, 40);
      await vault.connect(user1).deposit(DEPOSIT_AMOUNT);
      await vault.allocateToStrategies();
    });

    it("Should rebalance strategies based on performance", async function () {
      // Mock different APYs
      await mockAavePool.setLiquidityRate(ethers.utils.parseUnits("0.08", 27)); // 8% APY
      await mockComet.setSupplyRate(ethers.utils.parseUnits("0.10", 18).div(365 * 24 * 3600)); // 10% APY

      await vault.rebalance();
      
      // Should emit Rebalanced event
      await expect(vault.rebalance()).to.emit(vault, "Rebalanced");
    });

    it("Should update reserve ratio", async function () {
      const newRatio = 1500; // 15%
      
      await vault.updateReserveRatio(newRatio);
      
      expect(await vault.reserveRatio()).to.equal(newRatio);
    });
  });

  describe("Harvest from Multiple Strategies", function () {
    beforeEach(async function () {
      await vault.addStrategy(aaveStrategy.address, 60);
      await vault.addStrategy(compoundStrategy.address, 40);
      await vault.connect(user1).deposit(DEPOSIT_AMOUNT);
      await vault.allocateToStrategies();
    });

    it("Should harvest yield from all strategies", async function () {
      // Simulate yield generation
      const aaveYield = ethers.utils.parseUnits("50", 6);
      const compoundYield = ethers.utils.parseUnits("30", 6);
      
      await mockAavePool.addYield(aaveStrategy.address, aaveYield);
      await mockComet.setBalance(compoundStrategy.address, 
        (await compoundStrategy.totalAssets()).add(compoundYield));

      await expect(vault.harvest())
        .to.emit(vault, "Harvest");
    });
  });

  describe("Strategy Manager Integration", function () {
    beforeEach(async function () {
      await strategyManager.addStrategy(
        aaveStrategy.address,
        60, // weight
        25, // risk score
        7000, // max allocation (70%)
        1000  // min allocation (10%)
      );

      await strategyManager.addStrategy(
        compoundStrategy.address,
        40, // weight
        30, // risk score
        6000, // max allocation (60%)
        1000  // min allocation (10%)
      );
    });

    it("Should calculate optimal allocations", async function () {
      const totalAmount = ethers.utils.parseUnits("10000", 6);
      
      const [strategies, allocations] = await strategyManager.calculateOptimalAllocations(totalAmount);
      
      expect(strategies.length).to.equal(2);
      expect(allocations.length).to.equal(2);
      expect(allocations[0].add(allocations[1])).to.be.lte(totalAmount);
    });

    it("Should update APY data", async function () {
      await strategyManager.updateAPYData();
      
      const aaveInfo = await strategyManager.strategies(aaveStrategy.address);
      expect(aaveInfo.lastAPY).to.be.gt(0);
    });

    it("Should check if rebalancing is needed", async function () {
      const strategies = [aaveStrategy.address, compoundStrategy.address];
      const allocations = [
        ethers.utils.parseUnits("6000", 6),
        ethers.utils.parseUnits("4000", 6)
      ];
      
      const shouldRebalance = await strategyManager.shouldRebalance(strategies, allocations);
      expect(typeof shouldRebalance).to.equal("boolean");
    });

    it("Should update risk tolerance", async function () {
      const newRiskTolerance = 70;
      
      await strategyManager.setRiskTolerance(newRiskTolerance);
      
      expect(await strategyManager.riskTolerance()).to.equal(newRiskTolerance);
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should handle zero deposits gracefully", async function () {
      await expect(vault.connect(user1).deposit(0))
        .to.be.revertedWith("Cannot deposit 0");
    });

    it("Should handle deposits below minimum", async function () {
      const belowMin = MIN_DEPOSIT.sub(1);
      
      await expect(vault.connect(user1).deposit(belowMin))
        .to.be.revertedWith("Amount below minimum");
    });

    it("Should handle withdrawals with insufficient shares", async function () {
      await vault.connect(user1).deposit(DEPOSIT_AMOUNT);
      const userShares = await vault.userShares(user1.address);
      
      await expect(vault.connect(user1).withdraw(userShares.add(1)))
        .to.be.revertedWith("Insufficient shares");
    });

    it("Should handle strategy failures gracefully", async function () {
      await vault.addStrategy(aaveStrategy.address, 100);
      await vault.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Even if strategy fails, vault should continue operating
      expect(await vault.totalAssets()).to.be.gte(DEPOSIT_AMOUNT);
    });
  });

  describe("Gas Optimization", function () {
    it("Should efficiently handle multiple strategy operations", async function () {
      await vault.addStrategy(aaveStrategy.address, 50);
      await vault.addStrategy(compoundStrategy.address, 50);
      
      const tx = await vault.connect(user1).deposit(DEPOSIT_AMOUNT);
      const receipt = await tx.wait();
      
      // Gas usage should be reasonable
      expect(receipt.gasUsed).to.be.lt(500000);
    });
  });
});
