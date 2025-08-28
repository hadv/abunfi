const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Simple Test", function () {
  it("Should deploy MockERC20 successfully", async function () {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy("Test Token", "TEST", 18);
    await mockToken.waitForDeployment();
    
    expect(await mockToken.name()).to.equal("Test Token");
    expect(await mockToken.symbol()).to.equal("TEST");
    expect(await mockToken.decimals()).to.equal(18);
  });

  it("Should deploy AbunfiVault successfully", async function () {
    // Deploy mock USDC first
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockUSDC = await MockERC20.deploy("Mock USDC", "USDC", 6);
    await mockUSDC.waitForDeployment();
    
    // Deploy vault
    const AbunfiVault = await ethers.getContractFactory("AbunfiVault");
    const vault = await AbunfiVault.deploy(await mockUSDC.getAddress());
    await vault.waitForDeployment();
    
    expect(await vault.asset()).to.equal(await mockUSDC.getAddress());
  });

  it("Should deploy MockStrategy successfully", async function () {
    // Deploy mock USDC first
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockUSDC = await MockERC20.deploy("Mock USDC", "USDC", 6);
    await mockUSDC.waitForDeployment();
    
    // Deploy mock strategy
    const MockStrategy = await ethers.getContractFactory("MockStrategy");
    const strategy = await MockStrategy.deploy(
      await mockUSDC.getAddress(),
      "Test Strategy",
      500 // 5% APY
    );
    await strategy.waitForDeployment();
    
    expect(await strategy.name()).to.equal("Test Strategy");
    expect(await strategy.asset()).to.equal(await mockUSDC.getAddress());
    expect(await strategy.getAPY()).to.equal(500);
  });
});
