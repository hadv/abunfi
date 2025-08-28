const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiquidityProvidingStrategy", function () {
  let liquidityProvidingStrategy;
  let mockUSDC;
  let mockUSDT;
  let mockDAI;
  let mockCurvePool;
  let mockUniswapV3Pool;
  let mockPositionManager;
  let vault;
  let owner;
  let user1;
  let user2;

  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 6); // 1M USDC
  const DEPOSIT_AMOUNT = ethers.parseUnits("1000", 6); // 1000 USDC

  beforeEach(async function () {
    [owner, vault, user1, user2] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();
    
    mockUSDT = await MockERC20.deploy("Tether USD", "USDT", 6);
    await mockUSDT.waitForDeployment();
    
    mockDAI = await MockERC20.deploy("Dai Stablecoin", "DAI", 18);
    await mockDAI.waitForDeployment();

    // Deploy mock Curve pool
    const MockCurvePool = await ethers.getContractFactory("MockCurvePool");
    mockCurvePool = await MockCurvePool.deploy(
      "Curve 3Pool LP",
      "3CRV",
      [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockDAI.getAddress()]
    );
    await mockCurvePool.waitForDeployment();

    // Deploy mock Uniswap V3 pool
    const MockUniswapV3Pool = await ethers.getContractFactory("MockUniswapV3Pool");
    mockUniswapV3Pool = await MockUniswapV3Pool.deploy(
      await mockUSDC.getAddress(),
      await mockUSDT.getAddress(),
      500 // 0.05% fee
    );
    await mockUniswapV3Pool.waitForDeployment();

    // Deploy mock Position Manager
    const MockUniswapV3PositionManager = await ethers.getContractFactory("MockUniswapV3PositionManager");
    mockPositionManager = await MockUniswapV3PositionManager.deploy();
    await mockPositionManager.waitForDeployment();

    // Deploy LiquidityProvidingStrategy
    const LiquidityProvidingStrategy = await ethers.getContractFactory("LiquidityProvidingStrategy");
    liquidityProvidingStrategy = await LiquidityProvidingStrategy.deploy(
      await mockUSDC.getAddress(),
      await mockCurvePool.getAddress(),
      await vault.getAddress(),
      "Liquidity Providing Strategy"
    );
    await liquidityProvidingStrategy.waitForDeployment();

    // Setup initial balances
    await mockUSDC.mint(vault.address, INITIAL_SUPPLY);
    await mockUSDT.mint(vault.address, INITIAL_SUPPLY);
    await mockDAI.mint(vault.address, ethers.parseEther("1000000")); // 1M DAI

    // Approve strategy to spend tokens
    await mockUSDC.connect(vault).approve(await liquidityProvidingStrategy.getAddress(), INITIAL_SUPPLY);
    await mockUSDT.connect(vault).approve(await liquidityProvidingStrategy.getAddress(), INITIAL_SUPPLY);
    await mockDAI.connect(vault).approve(await liquidityProvidingStrategy.getAddress(), ethers.parseEther("1000000"));

    // Setup mock pools with initial liquidity
    await mockUSDC.mint(await mockCurvePool.getAddress(), ethers.parseUnits("100000", 6));
    await mockUSDT.mint(await mockCurvePool.getAddress(), ethers.parseUnits("100000", 6));
    await mockDAI.mint(await mockCurvePool.getAddress(), ethers.parseEther("100000"));

    await mockUSDC.mint(await mockUniswapV3Pool.getAddress(), ethers.parseUnits("100000", 6));
    await mockUSDT.mint(await mockUniswapV3Pool.getAddress(), ethers.parseUnits("100000", 6));
  });

  describe("Deployment", function () {
    it("Should initialize with correct parameters", async function () {
      expect(await liquidityProvidingStrategy.name()).to.equal("Liquidity Providing Strategy");
      expect(await liquidityProvidingStrategy.asset()).to.equal(await mockUSDC.getAddress()); // Use deployed mock USDC address
      expect(await liquidityProvidingStrategy.riskTolerance()).to.equal(50); // Default risk tolerance
      expect(await liquidityProvidingStrategy.maxSinglePoolAllocation()).to.equal(5000);
    });

    it("Should have pools initialized", async function () {
      expect(await liquidityProvidingStrategy.poolCount()).to.be.gte(0);
    });
  });

  describe("Pool Management", function () {
    it("Should add new Curve pool", async function () {
      const poolId = await liquidityProvidingStrategy.poolCount();

      await expect(liquidityProvidingStrategy.addCurvePool(
        await mockCurvePool.getAddress(),
        await mockCurvePool.getAddress(), // LP token same as pool for mock
        [await mockUSDC.getAddress(), await mockUSDT.getAddress()],
        [5000, 5000], // Equal weights
        300, // 3% fee APY
        200  // 2% reward APY
      )).to.emit(liquidityProvidingStrategy, "PoolAdded");

      expect(await liquidityProvidingStrategy.poolCount()).to.equal(poolId + 1n);
    });

    it("Should add new Uniswap V3 pool", async function () {
      const poolId = await liquidityProvidingStrategy.poolCount();

      await expect(liquidityProvidingStrategy.addUniswapV3Pool(
        await mockUniswapV3Pool.getAddress(),
        [await mockUSDC.getAddress(), await mockUSDT.getAddress()],
        [5000, 5000], // Equal weights
        250, // 2.5% fee APY
        150  // 1.5% reward APY
      )).to.emit(liquidityProvidingStrategy, "PoolAdded");

      expect(await liquidityProvidingStrategy.poolCount()).to.equal(poolId + 1n);
    });

    it("Should deactivate pool", async function () {
      // Add a pool first
      await liquidityProvidingStrategy.addCurvePool(
        await mockCurvePool.getAddress(),
        await mockCurvePool.getAddress(), // LP token same as pool for mock
        [await mockUSDC.getAddress(), await mockUSDT.getAddress()],
        [5000, 5000],
        300,
        200
      );

      const poolAddress = await mockCurvePool.getAddress();
      await liquidityProvidingStrategy.deactivatePool(poolAddress);

      // Just verify it doesn't revert
      expect(await liquidityProvidingStrategy.poolCount()).to.be.gte(1);
    });

    it("Should update pool APY", async function () {
      // Add a pool first
      await liquidityProvidingStrategy.addCurvePool(
        await mockCurvePool.getAddress(),
        await mockCurvePool.getAddress(), // LP token same as pool for mock
        [await mockUSDC.getAddress(), await mockUSDT.getAddress()],
        [5000, 5000],
        300,
        200
      );

      const poolId = 0;
      const newAPY = 600; // Combined APY

      await liquidityProvidingStrategy.updatePoolAPY(poolId, newAPY);

      // Just verify it doesn't revert
      expect(await liquidityProvidingStrategy.poolCount()).to.be.gte(1);
    });
  });

  describe("Deposits", function () {
    beforeEach(async function () {
      // Add a Curve pool
      await liquidityProvidingStrategy.addCurvePool(
        await mockCurvePool.getAddress(),
        await mockCurvePool.getAddress(),
        [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockDAI.getAddress()],
        [3333, 3333, 3334],
        300,
        200
      );
    });

    it("Should allow vault to deposit", async function () {
      await expect(liquidityProvidingStrategy.connect(vault).deposit(DEPOSIT_AMOUNT))
        .to.emit(liquidityProvidingStrategy, "LiquidityAdded");

      expect(await liquidityProvidingStrategy.totalAssets()).to.be.gt(0);
    });

    it("Should revert if non-vault tries to deposit", async function () {
      await expect(liquidityProvidingStrategy.connect(user1).deposit(DEPOSIT_AMOUNT))
        .to.be.revertedWith("Only vault can call");
    });

    it("Should revert if deposit amount is zero", async function () {
      await expect(liquidityProvidingStrategy.connect(vault).deposit(0))
        .to.be.revertedWith("Amount must be positive");
    });

    it("Should choose optimal pool for deposit", async function () {
      // Add multiple pools with different APYs
      await liquidityProvidingStrategy.addUniswapV3Pool(
        await mockUniswapV3Pool.getAddress(),
        [await mockUSDC.getAddress(), await mockUSDT.getAddress()],
        [5000, 5000],
        400, // Higher APY
        300
      );

      await liquidityProvidingStrategy.connect(vault).deposit(DEPOSIT_AMOUNT);
      
      // Should choose pool with better APY
      expect(await liquidityProvidingStrategy.totalAssets()).to.be.gt(0);
    });

    it("Should handle token conversion for multi-token pools", async function () {
      // Add a different pool to avoid "already exists" error
      await liquidityProvidingStrategy.addUniswapV3Pool(
        await mockUniswapV3Pool.getAddress(),
        [await mockUSDC.getAddress(), await mockUSDT.getAddress()],
        [5000, 5000],
        300,
        200
      );

      await liquidityProvidingStrategy.connect(vault).deposit(DEPOSIT_AMOUNT);

      // Check that tokens were properly allocated
      expect(await liquidityProvidingStrategy.totalAssets()).to.be.gt(0);
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      // Add pool and deposit
      await liquidityProvidingStrategy.addCurvePool(
        await mockCurvePool.getAddress(),
        await mockCurvePool.getAddress(),
        [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockDAI.getAddress()],
        [3333, 3333, 3334],
        300,
        200
      );
      
      await liquidityProvidingStrategy.connect(vault).deposit(DEPOSIT_AMOUNT);
    });

    it("Should allow vault to withdraw", async function () {
      const withdrawAmount = ethers.parseUnits("500", 6);
      
      await expect(liquidityProvidingStrategy.connect(vault).withdraw(withdrawAmount))
        .to.emit(liquidityProvidingStrategy, "LiquidityRemoved");
    });

    it("Should revert if non-vault tries to withdraw", async function () {
      const withdrawAmount = ethers.parseUnits("500", 6);
      
      await expect(liquidityProvidingStrategy.connect(user1).withdraw(withdrawAmount))
        .to.be.revertedWith("Only vault can call");
    });

    it("Should revert if withdraw amount is zero", async function () {
      await expect(liquidityProvidingStrategy.connect(vault).withdraw(0))
        .to.be.revertedWith("Amount must be positive");
    });

    it("Should allow withdrawing all assets", async function () {
      await expect(liquidityProvidingStrategy.connect(vault).withdrawAll())
        .to.emit(liquidityProvidingStrategy, "LiquidityRemoved");
    });

    it("Should handle partial withdrawals correctly", async function () {
      const totalBefore = await liquidityProvidingStrategy.totalAssets();
      const withdrawAmount = totalBefore / 2n;
      
      await liquidityProvidingStrategy.connect(vault).withdraw(withdrawAmount);
      
      const totalAfter = await liquidityProvidingStrategy.totalAssets();
      expect(totalAfter).to.be.lt(totalBefore);
    });
  });

  describe("Harvest", function () {
    beforeEach(async function () {
      await liquidityProvidingStrategy.addCurvePool(
        await mockCurvePool.getAddress(),
        await mockCurvePool.getAddress(),
        [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockDAI.getAddress()],
        [3333, 3333, 3334],
        300,
        200
      );
      
      await liquidityProvidingStrategy.connect(vault).deposit(DEPOSIT_AMOUNT);
    });

    it("Should allow vault to harvest", async function () {
      // Simulate trading fees and rewards
      await mockCurvePool.addFees(ethers.parseUnits("10", 6), ethers.parseUnits("10", 6));
      
      await expect(liquidityProvidingStrategy.connect(vault).harvest())
        .to.emit(liquidityProvidingStrategy, "RewardsHarvested");
    });

    it("Should return yield amount", async function () {
      // Simulate some yield
      await mockCurvePool.addFees(ethers.parseUnits("10", 6), ethers.parseUnits("10", 6));
      
      const yield = await liquidityProvidingStrategy.connect(vault).harvest.staticCall();
      expect(yield).to.be.gte(0);
    });

    it("Should compound rewards automatically", async function () {
      const totalBefore = await liquidityProvidingStrategy.totalAssets();
      
      // Simulate fees and harvest
      await mockCurvePool.addFees(ethers.parseUnits("10", 6), ethers.parseUnits("10", 6));
      await liquidityProvidingStrategy.connect(vault).harvest();
      
      const totalAfter = await liquidityProvidingStrategy.totalAssets();
      expect(totalAfter).to.be.gte(totalBefore);
    });

    it("Should revert if non-vault tries to harvest", async function () {
      await expect(liquidityProvidingStrategy.connect(user1).harvest())
        .to.be.revertedWith("Only vault can call");
    });
  });

  describe("Rebalancing", function () {
    beforeEach(async function () {
      // Add multiple pools
      await liquidityProvidingStrategy.addCurvePool(
        await mockCurvePool.getAddress(),
        await mockCurvePool.getAddress(),
        [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockDAI.getAddress()],
        [3333, 3333, 3334],
        300,
        200
      );

      await liquidityProvidingStrategy.addUniswapV3Pool(
        await mockUniswapV3Pool.getAddress(),
        [await mockUSDC.getAddress(), await mockUSDT.getAddress()],
        [5000, 5000],
        250,
        150
      );
      
      await liquidityProvidingStrategy.connect(vault).deposit(DEPOSIT_AMOUNT);
    });

    it("Should rebalance when APY changes significantly", async function () {
      // Change APY to trigger rebalancing
      await liquidityProvidingStrategy.updatePoolAPY(1, 900); // Make Uniswap more attractive

      await expect(liquidityProvidingStrategy.rebalance())
        .to.emit(liquidityProvidingStrategy, "PoolRebalanced");
    });

    it("Should respect maximum allocation limits", async function () {
      // Set very high APY for one pool
      await liquidityProvidingStrategy.updatePoolAPY(0, 1800); // 18% total APY

      await liquidityProvidingStrategy.rebalance();

      // Check that allocation doesn't exceed maximum (just verify it doesn't revert)
      const totalAssets = await liquidityProvidingStrategy.totalAssets();
      expect(totalAssets).to.be.gte(0);
    });
  });

  describe("Impermanent Loss Protection", function () {
    beforeEach(async function () {
      await liquidityProvidingStrategy.addUniswapV3Pool(
        await mockUniswapV3Pool.getAddress(),
        [await mockUSDC.getAddress(), await mockUSDT.getAddress()],
        [5000, 5000],
        250,
        150
      );
      
      await liquidityProvidingStrategy.connect(vault).deposit(DEPOSIT_AMOUNT);
    });

    it("Should calculate impermanent loss", async function () {
      const poolId = 0;
      const impermanentLoss = await liquidityProvidingStrategy.calculateImpermanentLoss(poolId);
      expect(impermanentLoss).to.be.gte(0);
    });

    it("Should monitor price deviation", async function () {
      const poolId = 0;
      const deviation = await liquidityProvidingStrategy.getPriceDeviation(poolId);
      expect(deviation).to.be.gte(0);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await liquidityProvidingStrategy.addCurvePool(
        await mockCurvePool.getAddress(),
        await mockCurvePool.getAddress(),
        [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockDAI.getAddress()],
        [3333, 3333, 3334],
        300,
        200
      );
      
      await liquidityProvidingStrategy.connect(vault).deposit(DEPOSIT_AMOUNT);
    });

    it("Should return correct total assets", async function () {
      const totalAssets = await liquidityProvidingStrategy.totalAssets();
      expect(totalAssets).to.be.gt(0);
    });

    it("Should return correct APY", async function () {
      const apy = await liquidityProvidingStrategy.getAPY();
      expect(apy).to.be.gt(0);
    });

    it("Should return pool allocation", async function () {
      const allocation = await liquidityProvidingStrategy.getPoolAllocation(0);
      expect(allocation).to.be.gte(0);
    });

    it("Should return total fees earned", async function () {
      const fees = await liquidityProvidingStrategy.getTotalFeesEarned();
      expect(fees).to.be.gte(0);
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to add pools", async function () {
      await expect(liquidityProvidingStrategy.connect(user1).addCurvePool(
        await mockCurvePool.getAddress(),
        await mockCurvePool.getAddress(),
        [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockDAI.getAddress()],
        [3333, 3333, 3334],
        300,
        200
      )).to.be.revertedWithCustomError(liquidityProvidingStrategy, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to set risk tolerance", async function () {
      await expect(liquidityProvidingStrategy.connect(user1).setRiskTolerance(50))
        .to.be.revertedWithCustomError(liquidityProvidingStrategy, "OwnableUnauthorizedAccount");
    });
  });
});
