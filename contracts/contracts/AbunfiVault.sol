// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IAbunfiStrategy.sol";

/**
 * @title AbunfiVault
 * @dev Main vault contract for Abunfi micro-savings platform
 * Manages user deposits and allocates funds to yield-generating strategies
 */
contract AbunfiVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // State variables
    IERC20 public immutable asset; // USDC token
    mapping(address => uint256) public userDeposits;
    mapping(address => uint256) public userShares;
    mapping(address => uint256) public lastDepositTime;
    
    uint256 public totalDeposits;
    uint256 public totalShares;
    uint256 public constant MINIMUM_DEPOSIT = 4e6; // ~$4 USDC (6 decimals)
    uint256 public constant SHARES_MULTIPLIER = 1e18;
    
    // Strategy management
    IAbunfiStrategy[] public strategies;
    mapping(address => bool) public isActiveStrategy;
    uint256 public totalAllocated;
    
    // Events
    event Deposit(address indexed user, uint256 amount, uint256 shares);
    event Withdraw(address indexed user, uint256 amount, uint256 shares);
    event StrategyAdded(address indexed strategy);
    event StrategyRemoved(address indexed strategy);
    event Harvest(uint256 totalYield);

    constructor(address _asset) Ownable(msg.sender) {
        asset = IERC20(_asset);
    }

    /**
     * @dev Deposit USDC to start earning yield
     * @param amount Amount of USDC to deposit
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount >= MINIMUM_DEPOSIT, "Amount below minimum");
        require(amount > 0, "Cannot deposit 0");

        // Calculate shares to mint
        uint256 shares = totalShares == 0 ? 
            amount * SHARES_MULTIPLIER / 1e6 : 
            amount * totalShares / totalAssets();

        // Update user state
        userDeposits[msg.sender] += amount;
        userShares[msg.sender] += shares;
        lastDepositTime[msg.sender] = block.timestamp;
        
        // Update global state
        totalDeposits += amount;
        totalShares += shares;

        // Transfer tokens
        asset.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposit(msg.sender, amount, shares);
    }

    /**
     * @dev Withdraw USDC and earned yield
     * @param shares Number of shares to redeem
     */
    function withdraw(uint256 shares) external nonReentrant {
        require(shares > 0, "Cannot withdraw 0 shares");
        require(userShares[msg.sender] >= shares, "Insufficient shares");

        // Calculate withdrawal amount
        uint256 amount = shares * totalAssets() / totalShares;
        
        // Update user state
        userShares[msg.sender] -= shares;
        if (userShares[msg.sender] == 0) {
            userDeposits[msg.sender] = 0;
        } else {
            userDeposits[msg.sender] = userDeposits[msg.sender] * userShares[msg.sender] / (userShares[msg.sender] + shares);
        }
        
        // Update global state
        totalShares -= shares;
        if (amount > totalDeposits) {
            totalDeposits = 0;
        } else {
            totalDeposits -= amount;
        }

        // Ensure we have enough liquidity
        _ensureLiquidity(amount);

        // Transfer tokens
        asset.safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, amount, shares);
    }

    /**
     * @dev Get total assets under management (including deployed to strategies)
     */
    function totalAssets() public view returns (uint256) {
        uint256 idle = asset.balanceOf(address(this));
        uint256 deployed = 0;
        
        for (uint256 i = 0; i < strategies.length; i++) {
            if (isActiveStrategy[address(strategies[i])]) {
                deployed += strategies[i].totalAssets();
            }
        }
        
        return idle + deployed;
    }

    /**
     * @dev Get user's current balance including yield
     */
    function balanceOf(address user) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return userShares[user] * totalAssets() / totalShares;
    }

    /**
     * @dev Get user's earned yield
     */
    function earnedYield(address user) external view returns (uint256) {
        uint256 currentBalance = this.balanceOf(user);
        return currentBalance > userDeposits[user] ? currentBalance - userDeposits[user] : 0;
    }

    // Strategy management functions (onlyOwner)
    function addStrategy(address strategy) external onlyOwner {
        require(strategy != address(0), "Invalid strategy");
        require(!isActiveStrategy[strategy], "Strategy already active");
        
        strategies.push(IAbunfiStrategy(strategy));
        isActiveStrategy[strategy] = true;
        
        emit StrategyAdded(strategy);
    }

    function removeStrategy(address strategy) external onlyOwner {
        require(isActiveStrategy[strategy], "Strategy not active");
        
        // Withdraw all funds from strategy
        IAbunfiStrategy(strategy).withdrawAll();
        isActiveStrategy[strategy] = false;
        
        emit StrategyRemoved(strategy);
    }

    /**
     * @dev Allocate idle funds to strategies
     */
    function allocateToStrategies() external onlyOwner {
        uint256 idle = asset.balanceOf(address(this));
        uint256 reserve = totalAssets() / 10; // Keep 10% as reserve
        
        if (idle > reserve) {
            uint256 toAllocate = idle - reserve;
            
            // Simple allocation: distribute equally among active strategies
            uint256 activeStrategies = 0;
            for (uint256 i = 0; i < strategies.length; i++) {
                if (isActiveStrategy[address(strategies[i])]) {
                    activeStrategies++;
                }
            }
            
            if (activeStrategies > 0) {
                uint256 perStrategy = toAllocate / activeStrategies;
                
                for (uint256 i = 0; i < strategies.length; i++) {
                    if (isActiveStrategy[address(strategies[i])]) {
                        asset.safeTransfer(address(strategies[i]), perStrategy);
                        strategies[i].deposit(perStrategy);
                    }
                }
            }
        }
    }

    /**
     * @dev Harvest yield from all strategies
     */
    function harvest() external onlyOwner {
        uint256 totalYield = 0;
        
        for (uint256 i = 0; i < strategies.length; i++) {
            if (isActiveStrategy[address(strategies[i])]) {
                totalYield += strategies[i].harvest();
            }
        }
        
        emit Harvest(totalYield);
    }

    /**
     * @dev Ensure sufficient liquidity for withdrawal
     */
    function _ensureLiquidity(uint256 amount) internal {
        uint256 idle = asset.balanceOf(address(this));
        
        if (idle < amount) {
            uint256 needed = amount - idle;
            
            // Withdraw from strategies
            for (uint256 i = 0; i < strategies.length && needed > 0; i++) {
                if (isActiveStrategy[address(strategies[i])]) {
                    uint256 available = strategies[i].totalAssets();
                    uint256 toWithdraw = needed > available ? available : needed;
                    
                    if (toWithdraw > 0) {
                        strategies[i].withdraw(toWithdraw);
                        needed -= toWithdraw;
                    }
                }
            }
        }
    }

    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = asset.balanceOf(address(this));
        asset.safeTransfer(owner(), balance);
    }
}
