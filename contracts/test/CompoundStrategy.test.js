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

  const INITIAL_SUPPLY = ethers.utils.parseUnits("1000000", 6); // 1M USDC
  const DEPOSIT_AMOUNT = ethers.utils.parseUnits("1000", 6); // 1000 USDC

  beforeEach(async function () {
    [owner, vault, user1, user2] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockUSDC.deployed();

    // Deploy mock Comet
    const MockComet = await ethers.getContractFactory("MockComet");
    mockComet = await MockComet.deploy(mockUSDC.address);
    await mockComet.deployed();

    // Deploy mock CometRewards
    const MockCometRewards = await ethers.getContractFactory("MockCometRewards");
    mockCometRewards = await MockCometRewards.deploy();
    await mockCometRewards.deployed();

    // Deploy CompoundStrategy
    const CompoundStrategy = await ethers.getContractFactory("CompoundStrategy");
    compoundStrategy = await CompoundStrategy.deploy(
      mockUSDC.address,
      mockComet.address,
      mockCometRewards.address,
      vault.address
    );
    await compoundStrategy.deployed();

    // Setup initial balances
    await mockUSDC.mint(vault.address, INITIAL_SUPPLY);
    await mockUSDC.connect(vault).approve(compoundStrategy.address, INITIAL_SUPPLY);
  });

  describe("Deployment", function () {
    it("Should set the correct asset", async function () {
      expect(await compoundStrategy.asset()).to.equal(mockUSDC.address);
    });

    it("Should set the correct vault", async function () {
      expect(await compoundStrategy.vault()).to.equal(vault.address);
    });

    it("Should set the correct comet", async function () {
      expect(await compoundStrategy.comet()).to.equal(mockComet.address);
    });

    it("Should have correct name", async function () {
      expect(await compoundStrategy.name()).to.equal("Compound V3 USDC Lending Strategy");
    });
  });

  describe("Deposits", function () {
    it("Should allow vault to deposit", async function () {
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
      await compoundStrategy.connect(vault).deposit(DEPOSIT_AMOUNT);
      expect(await compoundStrategy.totalAssets()).to.be.gt(0);
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await compoundStrategy.connect(vault).deposit(DEPOSIT_AMOUNT);
    });

    it("Should allow vault to withdraw", async function () {
      const withdrawAmount = ethers.utils.parseUnits("500", 6);
      
      await expect(compoundStrategy.connect(vault).withdraw(withdrawAmount))
        .to.emit(compoundStrategy, "Withdrawn")
        .withArgs(withdrawAmount);
    });

    it("Should revert if non-vault tries to withdraw", async function () {
      const withdrawAmount = ethers.utils.parseUnits("500", 6);
      
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
      await compoundStrategy.connect(vault).deposit(DEPOSIT_AMOUNT);
    });

    it("Should allow vault to harvest", async function () {
      // Simulate some yield by increasing comet balance
      await mockComet.setBalance(compoundStrategy.address, DEPOSIT_AMOUNT.add(ethers.utils.parseUnits("50", 6)));
      
      await expect(compoundStrategy.connect(vault).harvest())
        .to.emit(compoundStrategy, "Harvested");
    });

    it("Should return correct yield amount", async function () {
      const yieldAmount = ethers.utils.parseUnits("50", 6);
      await mockComet.setBalance(compoundStrategy.address, DEPOSIT_AMOUNT.add(yieldAmount));
      
      const harvestResult = await compoundStrategy.connect(vault).callStatic.harvest();
      expect(harvestResult).to.equal(yieldAmount);
    });

    it("Should update totalDeposited after harvest", async function () {
      const yieldAmount = ethers.utils.parseUnits("50", 6);
      const newBalance = DEPOSIT_AMOUNT.add(yieldAmount);
      await mockComet.setBalance(compoundStrategy.address, newBalance);
      
      await compoundStrategy.connect(vault).harvest();
      expect(await compoundStrategy.totalDeposited()).to.equal(newBalance);
    });
  });

  describe("APY Calculation", function () {
    it("Should return correct APY", async function () {
      // Mock supply rate (example: 5% APY)
      const supplyRate = ethers.utils.parseUnits("0.05", 18).div(365 * 24 * 3600); // 5% per year in per-second rate
      await mockComet.setSupplyRate(supplyRate);
      
      const apy = await compoundStrategy.getAPY();
      expect(apy).to.be.gt(0);
    });

    it("Should return current supply rate", async function () {
      const supplyRate = ethers.utils.parseUnits("0.05", 18).div(365 * 24 * 3600);
      await mockComet.setSupplyRate(supplyRate);
      
      const currentRate = await compoundStrategy.getCurrentSupplyRate();
      expect(currentRate).to.equal(supplyRate);
    });
  });

  describe("Rewards", function () {
    it("Should return pending rewards", async function () {
      const rewardAmount = ethers.utils.parseUnits("10", 18); // 10 COMP
      await mockCometRewards.setRewardOwed(mockComet.address, compoundStrategy.address, rewardAmount);
      
      const pendingRewards = await compoundStrategy.getPendingRewards();
      expect(pendingRewards).to.equal(rewardAmount);
    });

    it("Should allow owner to claim rewards", async function () {
      const rewardAmount = ethers.utils.parseUnits("10", 18);
      await mockCometRewards.setRewardOwed(mockComet.address, compoundStrategy.address, rewardAmount);
      
      await expect(compoundStrategy.claimRewards())
        .to.emit(compoundStrategy, "RewardsClaimed")
        .withArgs(rewardAmount);
    });

    it("Should revert if non-owner tries to claim rewards", async function () {
      await expect(compoundStrategy.connect(user1).claimRewards())
        .to.be.revertedWith("Ownable: caller is not the owner");
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
      const emergencyAmount = ethers.utils.parseUnits("100", 6);
      await mockUSDC.mint(compoundStrategy.address, emergencyAmount);
      
      const ownerBalanceBefore = await mockUSDC.balanceOf(owner.address);
      await compoundStrategy.emergencyWithdraw(mockUSDC.address, emergencyAmount);
      const ownerBalanceAfter = await mockUSDC.balanceOf(owner.address);
      
      expect(ownerBalanceAfter.sub(ownerBalanceBefore)).to.equal(emergencyAmount);
    });

    it("Should revert if non-owner tries emergency withdraw", async function () {
      const emergencyAmount = ethers.utils.parseUnits("100", 6);
      
      await expect(compoundStrategy.connect(user1).emergencyWithdraw(mockUSDC.address, emergencyAmount))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await compoundStrategy.connect(vault).deposit(DEPOSIT_AMOUNT);
    });

    it("Should return correct accrued yield", async function () {
      const yieldAmount = ethers.utils.parseUnits("25", 6);
      await mockComet.setBalance(compoundStrategy.address, DEPOSIT_AMOUNT.add(yieldAmount));
      
      const accruedYield = await compoundStrategy.getAccruedYield();
      expect(accruedYield).to.equal(yieldAmount);
    });

    it("Should return zero accrued yield when no yield", async function () {
      const accruedYield = await compoundStrategy.getAccruedYield();
      expect(accruedYield).to.equal(0);
    });
  });
});
