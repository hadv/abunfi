const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Basic Setup Test", function () {
  let mockUSDC;
  let vault;
  let owner;
  let user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("Mock USDC", "USDC", 6);
    await mockUSDC.waitForDeployment();

    // Deploy vault
    const AbunfiVault = await ethers.getContractFactory("AbunfiVault");
    vault = await AbunfiVault.deploy(await mockUSDC.getAddress());
    await vault.waitForDeployment();

    // Mint USDC to user
    await mockUSDC.mint(user1.address, ethers.parseUnits("1000", 6));
  });

  describe("Mock USDC", function () {
    it("Should deploy successfully", async function () {
      expect(await mockUSDC.name()).to.equal("Mock USDC");
      expect(await mockUSDC.symbol()).to.equal("USDC");
      expect(await mockUSDC.decimals()).to.equal(6);
    });

    it("Should mint tokens correctly", async function () {
      const balance = await mockUSDC.balanceOf(user1.address);
      expect(balance).to.equal(ethers.parseUnits("1000", 6));
    });
  });

  describe("AbunfiVault", function () {
    it("Should deploy successfully", async function () {
      expect(await vault.asset()).to.equal(await mockUSDC.getAddress());
      expect(await vault.MINIMUM_DEPOSIT()).to.equal(ethers.parseUnits("4", 6));
    });

    it("Should allow deposits above minimum", async function () {
      const depositAmount = ethers.parseUnits("10", 6);
      
      await mockUSDC.connect(user1).approve(await vault.getAddress(), depositAmount);
      await expect(vault.connect(user1).deposit(depositAmount))
        .to.emit(vault, "Deposit");
    });

    it("Should reject deposits below minimum", async function () {
      const depositAmount = ethers.parseUnits("3", 6);
      
      await mockUSDC.connect(user1).approve(await vault.getAddress(), depositAmount);
      await expect(vault.connect(user1).deposit(depositAmount))
        .to.be.revertedWith("Amount below minimum");
    });
  });

  describe("Mock Contracts", function () {
    it("Should deploy mock Aave contracts", async function () {
      const MockAavePool = await ethers.getContractFactory("MockAavePool");
      const mockAavePool = await MockAavePool.deploy(await mockUSDC.getAddress());
      await mockAavePool.waitForDeployment();
      
      expect(await mockAavePool.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should deploy mock Compound contracts", async function () {
      const MockComet = await ethers.getContractFactory("MockComet");
      const mockComet = await MockComet.deploy(await mockUSDC.getAddress());
      await mockComet.waitForDeployment();
      
      expect(await mockComet.getAddress()).to.not.equal(ethers.ZeroAddress);
    });
  });
});
