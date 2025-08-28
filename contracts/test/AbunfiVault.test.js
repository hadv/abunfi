const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AbunfiVault", function () {
  let vault;
  let mockUSDC;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("Mock USDC", "USDC", 6);
    await mockUSDC.waitForDeployment();

    // Deploy vault
    const AbunfiVault = await ethers.getContractFactory("AbunfiVault");
    vault = await AbunfiVault.deploy(await mockUSDC.getAddress());
    await vault.waitForDeployment();

    // Mint USDC to users
    await mockUSDC.mint(user1.address, ethers.parseUnits("1000", 6));
    await mockUSDC.mint(user2.address, ethers.parseUnits("1000", 6));
  });

  describe("Deployment", function () {
    it("Should set the correct asset", async function () {
      expect(await vault.asset()).to.equal(await mockUSDC.getAddress());
    });

    it("Should set the correct minimum deposit", async function () {
      expect(await vault.MINIMUM_DEPOSIT()).to.equal(ethers.parseUnits("4", 6));
    });
  });

  describe("Deposits", function () {
    it("Should allow deposits above minimum", async function () {
      const depositAmount = ethers.parseUnits("10", 6);
      
      await mockUSDC.connect(user1).approve(await vault.getAddress(), depositAmount);
      await expect(vault.connect(user1).deposit(depositAmount))
        .to.emit(vault, "Deposit")
        .withArgs(user1.address, depositAmount, depositAmount * BigInt(1e12));
    });

    it("Should reject deposits below minimum", async function () {
      const depositAmount = ethers.parseUnits("3", 6);
      
      await mockUSDC.connect(user1).approve(await vault.getAddress(), depositAmount);
      await expect(vault.connect(user1).deposit(depositAmount))
        .to.be.revertedWith("Amount below minimum");
    });

    it("Should update user balances correctly", async function () {
      const depositAmount = ethers.parseUnits("10", 6);
      
      await mockUSDC.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount);

      expect(await vault.userDeposits(user1.address)).to.equal(depositAmount);
      expect(await vault.balanceOf(user1.address)).to.equal(depositAmount);
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseUnits("100", 6);
      await mockUSDC.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount);
    });

    it("Should allow withdrawals", async function () {
      const userShares = await vault.userShares(user1.address);
      const withdrawShares = userShares / BigInt(2); // Withdraw half

      await expect(vault.connect(user1).withdraw(withdrawShares))
        .to.emit(vault, "Withdraw");
    });

    it("Should reject withdrawals exceeding balance", async function () {
      const userShares = await vault.userShares(user1.address);
      const excessiveShares = userShares + BigInt(1);

      await expect(vault.connect(user1).withdraw(excessiveShares))
        .to.be.revertedWith("Insufficient shares");
    });
  });

  describe("Multiple users", function () {
    it("Should handle multiple users correctly", async function () {
      const deposit1 = ethers.parseUnits("50", 6);
      const deposit2 = ethers.parseUnits("100", 6);

      // User 1 deposits
      await mockUSDC.connect(user1).approve(await vault.getAddress(), deposit1);
      await vault.connect(user1).deposit(deposit1);

      // User 2 deposits
      await mockUSDC.connect(user2).approve(await vault.getAddress(), deposit2);
      await vault.connect(user2).deposit(deposit2);

      expect(await vault.totalDeposits()).to.equal(deposit1 + deposit2);
      expect(await vault.balanceOf(user1.address)).to.equal(deposit1);
      expect(await vault.balanceOf(user2.address)).to.equal(deposit2);
    });
  });

  describe("Access control", function () {
    it("Should only allow owner to add strategies", async function () {
      const mockStrategy = ethers.ZeroAddress;
      
      await expect(vault.connect(user1).addStrategy(mockStrategy))
        .to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to pause", async function () {
      await expect(vault.connect(user1).pause())
        .to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });
  });
});

// Mock ERC20 contract for testing
const MockERC20Source = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
`;
