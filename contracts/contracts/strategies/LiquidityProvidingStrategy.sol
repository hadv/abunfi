// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IAbunfiStrategy.sol";

/**
 * @title LiquidityProvidingStrategy
 * @dev Cung cấp thanh khoản cho các cặp stablecoin trên AMM như Curve, Uniswap V3
 * Lợi nhuận đến từ phí giao dịch và rewards từ liquidity mining
 */
contract LiquidityProvidingStrategy is IAbunfiStrategy, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct PoolInfo {
        address poolAddress;      // Địa chỉ pool (Curve, Uniswap V3, etc.)
        address lpToken;          // LP token address
        address[] tokens;         // Tokens trong pool
        uint256[] weights;        // Trọng số của từng token
        uint256 totalDeposited;   // Tổng số tiền đã deposit
        uint256 feeAPY;          // APY từ phí giao dịch
        uint256 rewardAPY;       // APY từ rewards
        bool isActive;
        PoolType poolType;
    }

    enum PoolType {
        CURVE_STABLE,    // Curve stable pools (USDC/USDT/DAI)
        UNISWAP_V3,      // Uniswap V3 concentrated liquidity
        BALANCER,        // Balancer weighted pools
        SUSHISWAP        // SushiSwap pools
    }

    // State variables
    mapping(uint256 => PoolInfo) public pools;
    mapping(address => uint256) public tokenToPoolId;
    uint256 public poolCount;
    uint256 public totalAssets;
    uint256 public lastUpdateTime;
    
    // Configuration
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public slippageTolerance = 50; // 0.5%
    uint256 public rebalanceThreshold = 200; // 2%
    
    // External contract interfaces
    mapping(address => bool) public supportedPools;
    mapping(PoolType => address) public poolFactories;
    
    // Events
    event PoolAdded(uint256 indexed poolId, address indexed poolAddress, PoolType poolType);
    event LiquidityAdded(uint256 indexed poolId, uint256 amount, uint256 lpTokens);
    event LiquidityRemoved(uint256 indexed poolId, uint256 lpTokens, uint256 amount);
    event FeesCollected(uint256 indexed poolId, uint256 amount);
    event RewardsHarvested(uint256 indexed poolId, address rewardToken, uint256 amount);
    event PoolRebalanced(uint256 indexed poolId, uint256[] newAllocations);

    constructor() {
        lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Thêm pool mới để cung cấp thanh khoản
     */
    function addPool(
        address _poolAddress,
        address _lpToken,
        address[] memory _tokens,
        uint256[] memory _weights,
        PoolType _poolType
    ) external {
        require(_poolAddress != address(0), "Invalid pool address");
        require(_lpToken != address(0), "Invalid LP token address");
        require(_tokens.length > 1, "Need at least 2 tokens");
        require(_tokens.length == _weights.length, "Tokens and weights length mismatch");
        
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < _weights.length; i++) {
            totalWeight += _weights[i];
        }
        require(totalWeight == BASIS_POINTS, "Weights must sum to 100%");

        uint256 poolId = poolCount++;
        pools[poolId] = PoolInfo({
            poolAddress: _poolAddress,
            lpToken: _lpToken,
            tokens: _tokens,
            weights: _weights,
            totalDeposited: 0,
            feeAPY: 0,
            rewardAPY: 0,
            isActive: true,
            poolType: _poolType
        });

        supportedPools[_poolAddress] = true;
        
        for (uint256 i = 0; i < _tokens.length; i++) {
            tokenToPoolId[_tokens[i]] = poolId;
        }

        emit PoolAdded(poolId, _poolAddress, _poolType);
    }

    /**
     * @dev Deposit assets vào strategy
     */
    function deposit(uint256 amount) external override nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be positive");
        
        // Tìm pool tối ưu để deposit
        uint256 bestPoolId = _findOptimalPool(amount);
        require(pools[bestPoolId].isActive, "Pool not active");
        
        // Thực hiện deposit vào pool
        uint256 lpTokens = _depositToPool(bestPoolId, amount);
        
        pools[bestPoolId].totalDeposited += amount;
        totalAssets += amount;
        
        emit LiquidityAdded(bestPoolId, amount, lpTokens);
        return lpTokens;
    }

    /**
     * @dev Withdraw assets từ strategy
     */
    function withdraw(uint256 amount) external override nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be positive");
        require(amount <= totalAssets, "Insufficient balance");
        
        uint256 totalWithdrawn = 0;
        
        // Withdraw từ các pools theo tỷ lệ
        for (uint256 i = 0; i < poolCount; i++) {
            if (!pools[i].isActive || pools[i].totalDeposited == 0) continue;
            
            uint256 poolShare = (pools[i].totalDeposited * BASIS_POINTS) / totalAssets;
            uint256 withdrawFromPool = (amount * poolShare) / BASIS_POINTS;
            
            if (withdrawFromPool > 0) {
                uint256 withdrawn = _withdrawFromPool(i, withdrawFromPool);
                totalWithdrawn += withdrawn;
                pools[i].totalDeposited -= withdrawn;
            }
        }
        
        totalAssets -= totalWithdrawn;
        return totalWithdrawn;
    }

    /**
     * @dev Harvest rewards và fees từ tất cả pools
     */
    function harvest() external override nonReentrant returns (uint256) {
        uint256 totalHarvested = 0;
        
        for (uint256 i = 0; i < poolCount; i++) {
            if (!pools[i].isActive) continue;
            
            // Collect fees
            uint256 fees = _collectFees(i);
            if (fees > 0) {
                totalHarvested += fees;
                emit FeesCollected(i, fees);
            }
            
            // Harvest rewards
            uint256 rewards = _harvestRewards(i);
            if (rewards > 0) {
                totalHarvested += rewards;
                emit RewardsHarvested(i, address(0), rewards); // Simplified for now
            }
        }
        
        return totalHarvested;
    }

    /**
     * @dev Rebalance liquidity giữa các pools
     */
    function rebalance() external nonReentrant {
        require(block.timestamp >= lastUpdateTime + 1 hours, "Too frequent rebalancing");
        
        // Tính toán allocation tối ưu
        uint256[] memory optimalAllocations = _calculateOptimalAllocations();
        
        // Thực hiện rebalance
        for (uint256 i = 0; i < poolCount; i++) {
            if (!pools[i].isActive) continue;
            
            uint256 currentAllocation = (pools[i].totalDeposited * BASIS_POINTS) / totalAssets;
            uint256 targetAllocation = optimalAllocations[i];
            
            if (_shouldRebalancePool(currentAllocation, targetAllocation)) {
                _rebalancePool(i, targetAllocation);
                emit PoolRebalanced(i, optimalAllocations);
            }
        }
        
        lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Tính APY hiện tại của strategy
     */
    function getAPY() external view override returns (uint256) {
        if (totalAssets == 0) return 0;
        
        uint256 totalAPY = 0;
        uint256 totalWeight = 0;
        
        for (uint256 i = 0; i < poolCount; i++) {
            if (!pools[i].isActive || pools[i].totalDeposited == 0) continue;
            
            uint256 poolAPY = pools[i].feeAPY + pools[i].rewardAPY;
            uint256 poolWeight = (pools[i].totalDeposited * BASIS_POINTS) / totalAssets;
            
            totalAPY += poolAPY * poolWeight;
            totalWeight += poolWeight;
        }
        
        return totalWeight > 0 ? totalAPY / totalWeight : 0;
    }

    /**
     * @dev Lấy tổng assets được quản lý
     */
    function getTotalAssets() external view override returns (uint256) {
        return totalAssets;
    }

    /**
     * @dev Kiểm tra strategy có healthy không
     */
    function isHealthy() external view override returns (bool) {
        // Kiểm tra các pools có hoạt động bình thường
        for (uint256 i = 0; i < poolCount; i++) {
            if (pools[i].isActive && pools[i].totalDeposited > 0) {
                // Kiểm tra pool có bị imbalance quá mức không
                if (!_isPoolHealthy(i)) {
                    return false;
                }
            }
        }
        return true;
    }

    // Internal functions
    function _findOptimalPool(uint256 amount) internal view returns (uint256) {
        uint256 bestPoolId = 0;
        uint256 bestAPY = 0;
        
        for (uint256 i = 0; i < poolCount; i++) {
            if (!pools[i].isActive) continue;
            
            uint256 poolAPY = pools[i].feeAPY + pools[i].rewardAPY;
            if (poolAPY > bestAPY) {
                bestAPY = poolAPY;
                bestPoolId = i;
            }
        }
        
        return bestPoolId;
    }

    function _depositToPool(uint256 poolId, uint256 amount) internal returns (uint256) {
        // Implementation depends on pool type (Curve, Uniswap V3, etc.)
        // This is a simplified version
        PoolInfo storage pool = pools[poolId];
        
        // For now, return a mock LP token amount
        // In real implementation, this would interact with the actual pool contracts
        return amount * 95 / 100; // Assume 5% slippage for simplicity
    }

    function _withdrawFromPool(uint256 poolId, uint256 amount) internal returns (uint256) {
        // Implementation depends on pool type
        // This is a simplified version
        return amount * 95 / 100; // Assume 5% slippage for simplicity
    }

    function _collectFees(uint256 poolId) internal returns (uint256) {
        // Collect trading fees from the pool
        // Implementation depends on pool type
        return 0; // Simplified
    }

    function _harvestRewards(uint256 poolId) internal returns (uint256) {
        // Harvest liquidity mining rewards
        // Implementation depends on pool type
        return 0; // Simplified
    }

    function _calculateOptimalAllocations() internal view returns (uint256[] memory) {
        uint256[] memory allocations = new uint256[](poolCount);
        
        // Simple allocation based on APY
        uint256 totalAPY = 0;
        for (uint256 i = 0; i < poolCount; i++) {
            if (pools[i].isActive) {
                totalAPY += pools[i].feeAPY + pools[i].rewardAPY;
            }
        }
        
        if (totalAPY > 0) {
            for (uint256 i = 0; i < poolCount; i++) {
                if (pools[i].isActive) {
                    uint256 poolAPY = pools[i].feeAPY + pools[i].rewardAPY;
                    allocations[i] = (poolAPY * BASIS_POINTS) / totalAPY;
                }
            }
        }
        
        return allocations;
    }

    function _shouldRebalancePool(uint256 current, uint256 target) internal view returns (bool) {
        uint256 deviation = current > target ? current - target : target - current;
        return deviation > rebalanceThreshold;
    }

    function _rebalancePool(uint256 poolId, uint256 targetAllocation) internal {
        // Implement pool rebalancing logic
        // This would involve withdrawing/depositing to achieve target allocation
    }

    function _isPoolHealthy(uint256 poolId) internal view returns (bool) {
        // Check if pool is healthy (not imbalanced, no exploits, etc.)
        return true; // Simplified
    }

    // Admin functions
    function updatePoolAPY(uint256 poolId, uint256 feeAPY, uint256 rewardAPY) external {
        require(poolId < poolCount, "Invalid pool ID");
        pools[poolId].feeAPY = feeAPY;
        pools[poolId].rewardAPY = rewardAPY;
    }

    function setSlippageTolerance(uint256 _slippage) external {
        require(_slippage <= 1000, "Slippage too high"); // Max 10%
        slippageTolerance = _slippage;
    }

    function setRebalanceThreshold(uint256 _threshold) external {
        require(_threshold <= 1000, "Threshold too high"); // Max 10%
        rebalanceThreshold = _threshold;
    }
}
