const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CompoundStrategy", function () {
  let compoundStrategy;
  let mockComet;
  let mockCometRewards;
  let mockUSDC;
  let vault;
  let owner;
  let user1;
  let user2;

  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 6); // 1M USDC
  const DEPOSIT_AMOUNT = ethers.parseUnits("1000", 6); // 1000 USDC

  beforeEach(async function () {
    [owner, vault, user1, user2] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();

    // Deploy mock Comet
    const MockComet = await ethers.getContractFactory("MockComet");
    mockComet = await MockComet.deploy(await mockUSDC.getAddress());
    await mockComet.waitForDeployment();

    // Deploy mock CometRewards
    const MockCometRewards = await ethers.getContractFactory("MockCometRewards");
    mockCometRewards = await MockCometRewards.deploy();
    await mockCometRewards.waitForDeployment();

    // Deploy CompoundStrategy
    const CompoundStrategy = await ethers.getContractFactory("CompoundStrategy");
    compoundStrategy = await CompoundStrategy.deploy(
      await mockUSDC.getAddress(),
      await mockComet.getAddress(),
      await mockCometRewards.getAddress(),
      vault.address
    );
    await compoundStrategy.waitForDeployment();

    // Setup initial balances
    await mockUSDC.mint(vault.address, INITIAL_SUPPLY);
    await mockUSDC.connect(vault).approve(await compoundStrategy.getAddress(), INITIAL_SUPPLY);
  });

  describe("Deployment", function () {
    it("Should set the correct asset", async function () {
      expect(await compoundStrategy.asset()).to.equal(await mockUSDC.getAddress());
    });

    it("Should set the correct vault", async function () {
      expect(await compoundStrategy.vault()).to.equal(vault.address);
    });

    it("Should set the correct comet", async function () {
      expect(await compoundStrategy.comet()).to.equal(await mockComet.getAddress());
    });

    it("Should have correct name", async function () {
      expect(await compoundStrategy.name()).to.equal("Compound V3 USDC Lending Strategy");
    });
  });

  describe("Deposits", function () {
    it("Should allow vault to deposit", async function () {
      // Mint tokens to owner first, then transfer to strategy
      await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
      await mockUSDC.transfer(await compoundStrategy.getAddress(), DEPOSIT_AMOUNT);

      await expect(compoundStrategy.connect(vault).deposit(DEPOSIT_AMOUNT))
        .to.emit(compoundStrategy, "Deposited")
        .withArgs(DEPOSIT_AMOUNT);

      expect(await compoundStrategy.totalDeposited()).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should revert if non-vault tries to deposit", async function () {
      await expect(compoundStrategy.connect(user1).deposit(DEPOSIT_AMOUNT))
        .to.be.revertedWith("Only vault can call");
    });

    it("Should revert if deposit amount is zero", async function () {
      await expect(compoundStrategy.connect(vault).deposit(0))
        .to.be.revertedWith("Cannot deposit 0");
    });

    it("Should update total assets after deposit", async function () {
      // Mint tokens to owner first, then transfer to strategy
      await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
      await mockUSDC.transfer(await compoundStrategy.getAddress(), DEPOSIT_AMOUNT);
      await compoundStrategy.connect(vault).deposit(DEPOSIT_AMOUNT);
      expect(await compoundStrategy.totalAssets()).to.be.gt(0);
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      // Mint tokens to owner first, then transfer to strategy
      await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
      await mockUSDC.transfer(await compoundStrategy.getAddress(), DEPOSIT_AMOUNT);
      await compoundStrategy.connect(vault).deposit(DEPOSIT_AMOUNT);
    });

    it("Should allow vault to withdraw", async function () {
      const withdrawAmount = ethers.parseUnits("500", 6);
      
      await expect(compoundStrategy.connect(vault).withdraw(withdrawAmount))
        .to.emit(compoundStrategy, "Withdrawn")
        .withArgs(withdrawAmount);
    });

    it("Should revert if non-vault tries to withdraw", async function () {
      const withdrawAmount = ethers.parseUnits("500", 6);
      
      await expect(compoundStrategy.connect(user1).withdraw(withdrawAmount))
        .to.be.revertedWith("Only vault can call");
    });

    it("Should revert if withdraw amount is zero", async function () {
      await expect(compoundStrategy.connect(vault).withdraw(0))
        .to.be.revertedWith("Cannot withdraw 0");
    });

    it("Should allow withdrawing all assets", async function () {
      await expect(compoundStrategy.connect(vault).withdrawAll())
        .to.emit(compoundStrategy, "Withdrawn");

      expect(await compoundStrategy.totalDeposited()).to.equal(0);
    });
  });

  describe("Harvest", function () {
    beforeEach(async function () {
      // Mint tokens to owner first, then transfer to strategy
      await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
      await mockUSDC.transfer(await compoundStrategy.getAddress(), DEPOSIT_AMOUNT);
      await compoundStrategy.connect(vault).deposit(DEPOSIT_AMOUNT);
    });

    it("Should allow vault to harvest", async function () {
      // Simulate some yield by increasing comet balance
      await mockComet.setBalance(await compoundStrategy.getAddress(), DEPOSIT_AMOUNT + ethers.parseUnits("50", 6));
      
      await expect(compoundStrategy.connect(vault).harvest())
        .to.emit(compoundStrategy, "Harvested");
    });

    it("Should return correct yield amount", async function () {
      const yieldAmount = ethers.parseUnits("50", 6);
      await mockComet.setBalance(await compoundStrategy.getAddress(), DEPOSIT_AMOUNT + yieldAmount);
      
      const harvestResult = await compoundStrategy.connect(vault).harvest.staticCall();
      expect(harvestResult).to.equal(yieldAmount);
    });

    it("Should update totalDeposited after harvest", async function () {
      const yieldAmount = ethers.parseUnits("50", 6);
      const newBalance = DEPOSIT_AMOUNT + yieldAmount;
      await mockComet.setBalance(await compoundStrategy.getAddress(), newBalance);
      
      await compoundStrategy.connect(vault).harvest();
      expect(await compoundStrategy.totalDeposited()).to.equal(newBalance);
    });
  });

  describe("APY Calculation", function () {
    it("Should return correct APY", async function () {
      // Mock supply rate (example: 5% APY)
      const supplyRate = ethers.parseUnits("0.05", 18) / 365n * 24n * 3600n; // 5% per year in per-second rate
      await mockComet.setSupplyRate(supplyRate);
      
      const apy = await compoundStrategy.getAPY();
      expect(apy).to.be.gt(0);
    });

    it("Should return current supply rate", async function () {
      const supplyRate = ethers.parseUnits("0.05", 18) / 365n * 24n * 3600n;
      await mockComet.setSupplyRate(supplyRate);
      
      const currentRate = await compoundStrategy.getCurrentSupplyRate();
      expect(currentRate).to.equal(supplyRate);
    });
  });

  describe("Rewards", function () {
    it("Should return pending rewards", async function () {
      const rewardAmount = ethers.parseUnits("10", 18); // 10 COMP
      await mockCometRewards.setRewardOwed(await mockComet.getAddress(), await compoundStrategy.getAddress(), rewardAmount);
      
      const pendingRewards = await compoundStrategy.getPendingRewards();
      expect(pendingRewards).to.equal(rewardAmount);
    });

    it("Should allow owner to claim rewards", async function () {
      const rewardAmount = ethers.parseUnits("10", 18);
      await mockCometRewards.setRewardOwed(await mockComet.getAddress(), await compoundStrategy.getAddress(), rewardAmount);
      
      await expect(compoundStrategy.claimRewards())
        .to.emit(compoundStrategy, "RewardsClaimed")
        .withArgs(rewardAmount);
    });

    it("Should revert if non-owner tries to claim rewards", async function () {
      await expect(compoundStrategy.connect(user1).claimRewards())
        .to.be.revertedWithCustomError(compoundStrategy, "OwnableUnauthorizedAccount");
    });
  });

  describe("Utilization", function () {
    it("Should return market utilization", async function () {
      const utilization = 8000; // 80%
      await mockComet.setUtilization(utilization);
      
      const currentUtilization = await compoundStrategy.getUtilization();
      expect(currentUtilization).to.equal(utilization);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to emergency withdraw tokens", async function () {
      const emergencyAmount = ethers.parseUnits("100", 6);
      await mockUSDC.mint(await compoundStrategy.getAddress(), emergencyAmount);
      
      const ownerBalanceBefore = await mockUSDC.balanceOf(owner.address);
      await compoundStrategy.emergencyWithdraw(await mockUSDC.getAddress(), emergencyAmount);
      const ownerBalanceAfter = await mockUSDC.balanceOf(owner.address);
      
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(emergencyAmount);
    });

    it("Should revert if non-owner tries emergency withdraw", async function () {
      const emergencyAmount = ethers.parseUnits("100", 6);
      
      await expect(compoundStrategy.connect(user1).emergencyWithdraw(await mockUSDC.getAddress(), emergencyAmount))
        .to.be.revertedWithCustomError(compoundStrategy, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Mint tokens to owner first, then transfer to strategy
      await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
      await mockUSDC.transfer(await compoundStrategy.getAddress(), DEPOSIT_AMOUNT);
      await compoundStrategy.connect(vault).deposit(DEPOSIT_AMOUNT);
    });

    it("Should return correct accrued yield", async function () {
      const yieldAmount = ethers.parseUnits("25", 6);
      await mockComet.setBalance(await compoundStrategy.getAddress(), DEPOSIT_AMOUNT + yieldAmount);
      
      const accruedYield = await compoundStrategy.getAccruedYield();
      expect(accruedYield).to.equal(yieldAmount);
    });

    it("Should return zero accrued yield when no yield", async function () {
      const accruedYield = await compoundStrategy.getAccruedYield();
      expect(accruedYield).to.equal(0);
    });
  });
});
