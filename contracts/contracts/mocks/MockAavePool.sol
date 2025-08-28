// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockAavePool
 * @dev Mock implementation of Aave V3 Pool for testing
 */
contract MockAavePool {
    IERC20 public asset;
    mapping(address => uint256) public balances;
    uint256 public liquidityRate = 80000000000000000000000000; // ~8% APY in ray format
    
    event Supply(address indexed asset, uint256 amount, address indexed onBehalfOf, uint16 referralCode);
    event Withdraw(address indexed asset, uint256 amount, address indexed to);
    
    constructor(address _asset) {
        asset = IERC20(_asset);
    }
    
    function supply(address _asset, uint256 amount, address onBehalfOf, uint16 referralCode) external {
        require(_asset == address(asset), "Invalid asset");
        asset.transferFrom(msg.sender, address(this), amount);
        balances[onBehalfOf] += amount;
        emit Supply(_asset, amount, onBehalfOf, referralCode);
    }
    
    function withdraw(address _asset, uint256 amount, address to) external returns (uint256) {
        require(_asset == address(asset), "Invalid asset");
        
        uint256 withdrawAmount = amount;
        if (amount == type(uint256).max) {
            withdrawAmount = balances[msg.sender];
        }
        
        require(balances[msg.sender] >= withdrawAmount, "Insufficient balance");
        
        balances[msg.sender] -= withdrawAmount;
        asset.transfer(to, withdrawAmount);
        
        emit Withdraw(_asset, withdrawAmount, to);
        return withdrawAmount;
    }
    
    function getReserveData(address _asset) external view returns (
        uint256 unbacked,
        uint256 accruedToTreasuryScaled,
        uint256 totalAToken,
        uint256 totalStableDebt,
        uint256 totalVariableDebt,
        uint256 _liquidityRate,
        uint256 variableBorrowRate,
        uint256 stableBorrowRate,
        uint256 averageStableBorrowRate,
        uint256 liquidityIndex,
        uint256 variableBorrowIndex,
        uint40 lastUpdateTimestamp
    ) {
        return (0, 0, 0, 0, 0, liquidityRate, 0, 0, 0, 0, 0, 0);
    }
    
    function getUserReserveData(address _asset, address user) external view returns (
        uint256 currentATokenBalance,
        uint256 currentStableDebt,
        uint256 currentVariableDebt,
        uint256 principalStableDebt,
        uint256 scaledVariableDebt,
        uint256 stableBorrowRate,
        uint256 _liquidityRate,
        uint40 stableRateLastUpdated,
        bool usageAsCollateralEnabled
    ) {
        return (balances[user], 0, 0, 0, 0, 0, liquidityRate, 0, false);
    }
    
    // Test helper functions
    function setBalance(address account, uint256 amount) external {
        balances[account] = amount;
    }
    
    function setLiquidityRate(uint256 _liquidityRate) external {
        liquidityRate = _liquidityRate;
    }
    
    function addYield(address account, uint256 yieldAmount) external {
        balances[account] += yieldAmount;
    }
    
    function getBalance(address account) external view returns (uint256) {
        return balances[account];
    }
}
