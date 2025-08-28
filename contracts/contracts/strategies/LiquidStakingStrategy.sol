// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IAbunfiStrategy.sol";

/**
 * @title LiquidStakingStrategy
 * @dev Sử dụng các tài sản liquid staking như stETH, rETH để kiếm lợi nhuận từ staking Ethereum
 * Đây là chiến lược nâng cao với rủi ro thấp-trung bình
 */
contract LiquidStakingStrategy is IAbunfiStrategy, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct StakingProvider {
        address stakingToken;     // stETH, rETH, cbETH, etc.
        address underlyingToken;  // ETH (WETH)
        uint256 stakingAPY;       // APY từ staking
        uint256 totalStaked;      // Tổng số đã stake
        uint256 exchangeRate;     // Tỷ giá staking token / ETH
        uint256 slashingRisk;     // Điểm rủi ro slashing (0-100)
        bool isActive;
        ProviderType providerType;
        uint256 lastUpdateTime;
    }

    enum ProviderType {
        LIDO,           // Lido stETH
        ROCKET_POOL,    // Rocket Pool rETH  
        COINBASE,       // Coinbase cbETH
        FRAX,           // Frax sfrxETH
        STAKEWISE       // StakeWise osETH
    }

    // State variables
    mapping(uint256 => StakingProvider) public providers;
    mapping(address => uint256) public tokenToProviderId;
    uint256 public providerCount;
    uint256 public totalAssets;
    uint256 public lastRebalanceTime;
    
    // Configuration
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_SLASHING_RISK = 100;
    uint256 public riskTolerance = 30; // Mức chấp nhận rủi ro thấp-trung bình
    uint256 public rebalanceInterval = 7 days;
    uint256 public maxSingleProviderAllocation = 4000; // 40% max per provider
    
    // External contract addresses
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    
    // Provider contract interfaces
    mapping(ProviderType => address) public providerContracts;
    mapping(ProviderType => bool) public supportedProviders;
    
    // Events
    event ProviderAdded(uint256 indexed providerId, address indexed stakingToken, ProviderType providerType);
    event Staked(uint256 indexed providerId, uint256 ethAmount, uint256 stakingTokens);
    event Unstaked(uint256 indexed providerId, uint256 stakingTokens, uint256 ethAmount);
    event RewardsHarvested(uint256 indexed providerId, uint256 amount);
    event ProviderRebalanced(uint256 indexed providerId, uint256 newAllocation);
    event ExchangeRateUpdated(uint256 indexed providerId, uint256 newRate);

    constructor() {
        lastRebalanceTime = block.timestamp;
        _initializeProviders();
    }

    /**
     * @dev Khởi tạo các liquid staking providers
     */
    function _initializeProviders() internal {
        // Lido stETH
        providerContracts[ProviderType.LIDO] = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
        supportedProviders[ProviderType.LIDO] = true;
        
        // Rocket Pool rETH  
        providerContracts[ProviderType.ROCKET_POOL] = 0xae78736Cd615f374D3085123A210448E74Fc6393;
        supportedProviders[ProviderType.ROCKET_POOL] = true;
        
        // Coinbase cbETH
        providerContracts[ProviderType.COINBASE] = 0xBe9895146f7AF43049ca1c1AE358B0541Ea49704;
        supportedProviders[ProviderType.COINBASE] = true;
    }

    /**
     * @dev Thêm staking provider mới
     */
    function addProvider(
        address _stakingToken,
        address _underlyingToken,
        uint256 _stakingAPY,
        uint256 _slashingRisk,
        ProviderType _providerType
    ) external {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_underlyingToken != address(0), "Invalid underlying token");
        require(_slashingRisk <= MAX_SLASHING_RISK, "Slashing risk too high");
        require(supportedProviders[_providerType], "Provider type not supported");

        uint256 providerId = providerCount++;
        providers[providerId] = StakingProvider({
            stakingToken: _stakingToken,
            underlyingToken: _underlyingToken,
            stakingAPY: _stakingAPY,
            totalStaked: 0,
            exchangeRate: 1e18, // 1:1 initial rate
            slashingRisk: _slashingRisk,
            isActive: true,
            providerType: _providerType,
            lastUpdateTime: block.timestamp
        });

        tokenToProviderId[_stakingToken] = providerId;

        emit ProviderAdded(providerId, _stakingToken, _providerType);
    }

    /**
     * @dev Deposit ETH vào strategy để stake
     */
    function deposit(uint256 amount) external override nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be positive");
        
        // Tìm provider tối ưu để stake
        uint256 bestProviderId = _findOptimalProvider(amount);
        require(providers[bestProviderId].isActive, "Provider not active");
        
        // Thực hiện staking
        uint256 stakingTokens = _stakeWithProvider(bestProviderId, amount);
        
        providers[bestProviderId].totalStaked += amount;
        totalAssets += amount;
        
        emit Staked(bestProviderId, amount, stakingTokens);
        return stakingTokens;
    }

    /**
     * @dev Withdraw ETH từ strategy
     */
    function withdraw(uint256 amount) external override nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be positive");
        require(amount <= totalAssets, "Insufficient balance");
        
        uint256 totalWithdrawn = 0;
        
        // Withdraw từ các providers theo tỷ lệ
        for (uint256 i = 0; i < providerCount; i++) {
            if (!providers[i].isActive || providers[i].totalStaked == 0) continue;
            
            uint256 providerShare = (providers[i].totalStaked * BASIS_POINTS) / totalAssets;
            uint256 withdrawFromProvider = (amount * providerShare) / BASIS_POINTS;
            
            if (withdrawFromProvider > 0) {
                uint256 withdrawn = _unstakeFromProvider(i, withdrawFromProvider);
                totalWithdrawn += withdrawn;
                providers[i].totalStaked -= withdrawFromProvider;
            }
        }
        
        totalAssets -= amount;
        return totalWithdrawn;
    }

    /**
     * @dev Harvest staking rewards
     */
    function harvest() external override nonReentrant returns (uint256) {
        uint256 totalHarvested = 0;
        
        for (uint256 i = 0; i < providerCount; i++) {
            if (!providers[i].isActive) continue;
            
            // Update exchange rate để tính rewards
            uint256 newExchangeRate = _getExchangeRate(i);
            uint256 oldExchangeRate = providers[i].exchangeRate;
            
            if (newExchangeRate > oldExchangeRate) {
                // Có rewards từ staking
                uint256 rewardRate = newExchangeRate - oldExchangeRate;
                uint256 rewards = (providers[i].totalStaked * rewardRate) / 1e18;
                
                totalHarvested += rewards;
                providers[i].exchangeRate = newExchangeRate;
                
                emit RewardsHarvested(i, rewards);
                emit ExchangeRateUpdated(i, newExchangeRate);
            }
        }
        
        // Cập nhật total assets với rewards
        totalAssets += totalHarvested;
        return totalHarvested;
    }

    /**
     * @dev Rebalance allocation giữa các providers
     */
    function rebalance() external nonReentrant {
        require(block.timestamp >= lastRebalanceTime + rebalanceInterval, "Too frequent rebalancing");
        
        // Tính toán allocation tối ưu
        uint256[] memory optimalAllocations = _calculateOptimalAllocations();
        
        // Thực hiện rebalance
        for (uint256 i = 0; i < providerCount; i++) {
            if (!providers[i].isActive) continue;
            
            uint256 currentAllocation = totalAssets > 0 ? 
                (providers[i].totalStaked * BASIS_POINTS) / totalAssets : 0;
            uint256 targetAllocation = optimalAllocations[i];
            
            if (_shouldRebalanceProvider(currentAllocation, targetAllocation)) {
                _rebalanceProvider(i, targetAllocation);
                emit ProviderRebalanced(i, targetAllocation);
            }
        }
        
        lastRebalanceTime = block.timestamp;
    }

    /**
     * @dev Tính APY hiện tại của strategy
     */
    function getAPY() external view override returns (uint256) {
        if (totalAssets == 0) return 0;
        
        uint256 weightedAPY = 0;
        
        for (uint256 i = 0; i < providerCount; i++) {
            if (!providers[i].isActive || providers[i].totalStaked == 0) continue;
            
            uint256 weight = (providers[i].totalStaked * BASIS_POINTS) / totalAssets;
            uint256 riskAdjustedAPY = _calculateRiskAdjustedAPY(i);
            
            weightedAPY += (riskAdjustedAPY * weight) / BASIS_POINTS;
        }
        
        return weightedAPY;
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
        // Kiểm tra các providers có hoạt động bình thường
        for (uint256 i = 0; i < providerCount; i++) {
            if (providers[i].isActive && providers[i].totalStaked > 0) {
                // Kiểm tra slashing risk
                if (providers[i].slashingRisk > riskTolerance * 2) {
                    return false;
                }
                
                // Kiểm tra exchange rate có bất thường không
                if (!_isExchangeRateHealthy(i)) {
                    return false;
                }
            }
        }
        return true;
    }

    // Internal functions
    function _findOptimalProvider(uint256 amount) internal view returns (uint256) {
        uint256 bestProviderId = 0;
        uint256 bestScore = 0;
        
        for (uint256 i = 0; i < providerCount; i++) {
            if (!providers[i].isActive) continue;
            
            // Tính điểm dựa trên APY và risk
            uint256 riskAdjustedAPY = _calculateRiskAdjustedAPY(i);
            uint256 diversificationBonus = _getDiversificationBonus(i);
            uint256 score = riskAdjustedAPY + diversificationBonus;
            
            if (score > bestScore) {
                bestScore = score;
                bestProviderId = i;
            }
        }
        
        return bestProviderId;
    }

    function _calculateRiskAdjustedAPY(uint256 providerId) internal view returns (uint256) {
        StakingProvider memory provider = providers[providerId];
        
        // Giảm APY dựa trên slashing risk
        uint256 riskPenalty = (provider.slashingRisk * provider.stakingAPY) / (MAX_SLASHING_RISK * 2);
        return provider.stakingAPY > riskPenalty ? provider.stakingAPY - riskPenalty : 0;
    }

    function _getDiversificationBonus(uint256 providerId) internal view returns (uint256) {
        if (totalAssets == 0) return 0;
        
        uint256 currentAllocation = (providers[providerId].totalStaked * BASIS_POINTS) / totalAssets;
        
        // Bonus cho providers có allocation thấp (khuyến khích đa dạng hóa)
        if (currentAllocation < maxSingleProviderAllocation / 2) {
            return 50; // 0.5% bonus
        }
        
        return 0;
    }

    function _stakeWithProvider(uint256 providerId, uint256 amount) internal returns (uint256) {
        StakingProvider storage provider = providers[providerId];
        
        // Implementation depends on provider type
        if (provider.providerType == ProviderType.LIDO) {
            return _stakeWithLido(amount);
        } else if (provider.providerType == ProviderType.ROCKET_POOL) {
            return _stakeWithRocketPool(amount);
        } else if (provider.providerType == ProviderType.COINBASE) {
            return _stakeWithCoinbase(amount);
        }
        
        return 0;
    }

    function _unstakeFromProvider(uint256 providerId, uint256 amount) internal returns (uint256) {
        StakingProvider storage provider = providers[providerId];
        
        // Implementation depends on provider type
        // Note: Some providers may have withdrawal delays
        if (provider.providerType == ProviderType.LIDO) {
            return _unstakeFromLido(amount);
        } else if (provider.providerType == ProviderType.ROCKET_POOL) {
            return _unstakeFromRocketPool(amount);
        } else if (provider.providerType == ProviderType.COINBASE) {
            return _unstakeFromCoinbase(amount);
        }
        
        return 0;
    }

    function _getExchangeRate(uint256 providerId) internal view returns (uint256) {
        StakingProvider memory provider = providers[providerId];
        
        // Get current exchange rate from provider contract
        // This is simplified - real implementation would call provider contracts
        return provider.exchangeRate + 1e15; // Mock 0.1% increase
    }

    function _calculateOptimalAllocations() internal view returns (uint256[] memory) {
        uint256[] memory allocations = new uint256[](providerCount);
        uint256 totalScore = 0;
        
        // Tính điểm cho mỗi provider
        uint256[] memory scores = new uint256[](providerCount);
        for (uint256 i = 0; i < providerCount; i++) {
            if (providers[i].isActive) {
                scores[i] = _calculateRiskAdjustedAPY(i);
                totalScore += scores[i];
            }
        }
        
        // Phân bổ dựa trên điểm và giới hạn
        if (totalScore > 0) {
            for (uint256 i = 0; i < providerCount; i++) {
                if (providers[i].isActive) {
                    uint256 baseAllocation = (scores[i] * BASIS_POINTS) / totalScore;
                    
                    // Áp dụng giới hạn max allocation
                    if (baseAllocation > maxSingleProviderAllocation) {
                        allocations[i] = maxSingleProviderAllocation;
                    } else {
                        allocations[i] = baseAllocation;
                    }
                }
            }
        }
        
        return allocations;
    }

    function _shouldRebalanceProvider(uint256 current, uint256 target) internal pure returns (bool) {
        uint256 deviation = current > target ? current - target : target - current;
        return deviation > 200; // 2% threshold
    }

    function _rebalanceProvider(uint256 providerId, uint256 targetAllocation) internal {
        // Implement provider rebalancing logic
        // This would involve unstaking from over-allocated providers and staking to under-allocated ones
    }

    function _isExchangeRateHealthy(uint256 providerId) internal view returns (bool) {
        // Check if exchange rate is within expected bounds
        // This would involve checking against oracle prices or historical data
        return true; // Simplified
    }

    // Provider-specific staking functions (simplified)
    function _stakeWithLido(uint256 amount) internal returns (uint256) {
        // Interact with Lido stETH contract
        return amount; // 1:1 for simplicity
    }

    function _stakeWithRocketPool(uint256 amount) internal returns (uint256) {
        // Interact with Rocket Pool rETH contract
        return amount * 95 / 100; // Mock exchange rate
    }

    function _stakeWithCoinbase(uint256 amount) internal returns (uint256) {
        // Interact with Coinbase cbETH contract
        return amount * 98 / 100; // Mock exchange rate
    }

    function _unstakeFromLido(uint256 amount) internal returns (uint256) {
        // Unstake from Lido (may involve withdrawal queue)
        return amount;
    }

    function _unstakeFromRocketPool(uint256 amount) internal returns (uint256) {
        // Unstake from Rocket Pool
        return amount;
    }

    function _unstakeFromCoinbase(uint256 amount) internal returns (uint256) {
        // Unstake from Coinbase
        return amount;
    }

    // Admin functions
    function updateProviderAPY(uint256 providerId, uint256 newAPY) external {
        require(providerId < providerCount, "Invalid provider ID");
        providers[providerId].stakingAPY = newAPY;
        providers[providerId].lastUpdateTime = block.timestamp;
    }

    function setRiskTolerance(uint256 _riskTolerance) external {
        require(_riskTolerance <= MAX_SLASHING_RISK, "Risk tolerance too high");
        riskTolerance = _riskTolerance;
    }

    function setMaxSingleProviderAllocation(uint256 _maxAllocation) external {
        require(_maxAllocation <= BASIS_POINTS, "Allocation too high");
        maxSingleProviderAllocation = _maxAllocation;
    }
}
