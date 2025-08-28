// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IAbunfiStrategy.sol";

/**
 * @title StrategyManager
 * @dev Advanced strategy management with risk assessment and dynamic allocation
 */
contract StrategyManager is Ownable, ReentrancyGuard {
    
    struct StrategyInfo {
        IAbunfiStrategy strategy;
        uint256 weight;           // Base weight for allocation
        uint256 riskScore;        // Risk score (0-100, lower is safer)
        uint256 maxAllocation;    // Maximum allocation percentage (basis points)
        uint256 minAllocation;    // Minimum allocation percentage (basis points)
        bool isActive;
        uint256 lastAPY;          // Last recorded APY
        uint256 apyHistory;       // Moving average of APY
        uint256 performanceScore; // Performance score based on consistency
    }
    
    mapping(address => StrategyInfo) public strategies;
    address[] public strategyList;
    
    // Configuration
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_RISK_SCORE = 100;
    uint256 public riskTolerance = 50; // Default medium risk tolerance
    uint256 public performanceWindow = 30 days; // Performance evaluation window
    uint256 public rebalanceThreshold = 500; // 5% threshold for rebalancing
    
    // APY tracking
    mapping(address => uint256[]) public apyHistory;
    mapping(address => uint256) public lastUpdateTime;
    
    // Events
    event StrategyAdded(address indexed strategy, uint256 weight, uint256 riskScore);
    event StrategyUpdated(address indexed strategy, uint256 newWeight, uint256 newRiskScore);
    event StrategyRemoved(address indexed strategy);
    event AllocationCalculated(address indexed strategy, uint256 allocation);
    event RiskToleranceUpdated(uint256 oldTolerance, uint256 newTolerance);
    event PerformanceUpdated(address indexed strategy, uint256 newScore);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Add a new strategy with risk assessment
     */
    function addStrategy(
        address _strategy,
        uint256 _weight,
        uint256 _riskScore,
        uint256 _maxAllocation,
        uint256 _minAllocation
    ) external onlyOwner {
        require(_strategy != address(0), "Invalid strategy address");
        require(!strategies[_strategy].isActive, "Strategy already exists");
        require(_riskScore <= MAX_RISK_SCORE, "Risk score too high");
        require(_maxAllocation <= BASIS_POINTS, "Max allocation too high");
        require(_minAllocation <= _maxAllocation, "Min allocation > max allocation");
        require(_weight > 0, "Weight must be positive");
        
        strategies[_strategy] = StrategyInfo({
            strategy: IAbunfiStrategy(_strategy),
            weight: _weight,
            riskScore: _riskScore,
            maxAllocation: _maxAllocation,
            minAllocation: _minAllocation,
            isActive: true,
            lastAPY: 0,
            apyHistory: 0,
            performanceScore: 50 // Start with neutral score
        });
        
        strategyList.push(_strategy);
        lastUpdateTime[_strategy] = block.timestamp;
        
        emit StrategyAdded(_strategy, _weight, _riskScore);
    }
    
    /**
     * @dev Update strategy parameters
     */
    function updateStrategy(
        address _strategy,
        uint256 _weight,
        uint256 _riskScore,
        uint256 _maxAllocation,
        uint256 _minAllocation
    ) external onlyOwner {
        require(strategies[_strategy].isActive, "Strategy not active");
        require(_riskScore <= MAX_RISK_SCORE, "Risk score too high");
        require(_maxAllocation <= BASIS_POINTS, "Max allocation too high");
        require(_minAllocation <= _maxAllocation, "Min allocation > max allocation");
        require(_weight > 0, "Weight must be positive");
        
        StrategyInfo storage info = strategies[_strategy];
        info.weight = _weight;
        info.riskScore = _riskScore;
        info.maxAllocation = _maxAllocation;
        info.minAllocation = _minAllocation;
        
        emit StrategyUpdated(_strategy, _weight, _riskScore);
    }
    
    /**
     * @dev Remove a strategy
     */
    function removeStrategy(address _strategy) external onlyOwner {
        require(strategies[_strategy].isActive, "Strategy not active");
        
        strategies[_strategy].isActive = false;
        
        // Remove from strategy list
        for (uint256 i = 0; i < strategyList.length; i++) {
            if (strategyList[i] == _strategy) {
                strategyList[i] = strategyList[strategyList.length - 1];
                strategyList.pop();
                break;
            }
        }
        
        emit StrategyRemoved(_strategy);
    }
    
    /**
     * @dev Update APY data for performance tracking
     */
    function updateAPYData() external {
        for (uint256 i = 0; i < strategyList.length; i++) {
            address strategyAddr = strategyList[i];
            if (strategies[strategyAddr].isActive) {
                uint256 currentAPY = strategies[strategyAddr].strategy.getAPY();
                
                // Update APY history
                apyHistory[strategyAddr].push(currentAPY);
                
                // Keep only last 30 data points
                if (apyHistory[strategyAddr].length > 30) {
                    // Shift array left
                    for (uint256 j = 0; j < apyHistory[strategyAddr].length - 1; j++) {
                        apyHistory[strategyAddr][j] = apyHistory[strategyAddr][j + 1];
                    }
                    apyHistory[strategyAddr].pop();
                }
                
                // Update moving average
                strategies[strategyAddr].apyHistory = _calculateMovingAverage(strategyAddr);
                strategies[strategyAddr].lastAPY = currentAPY;
                strategies[strategyAddr].performanceScore = _calculatePerformanceScore(strategyAddr);
                lastUpdateTime[strategyAddr] = block.timestamp;
                
                emit PerformanceUpdated(strategyAddr, strategies[strategyAddr].performanceScore);
            }
        }
    }
    
    /**
     * @dev Calculate optimal allocation for each strategy
     */
    function calculateOptimalAllocations(uint256 totalAmount) 
        external 
        view 
        returns (address[] memory, uint256[] memory) 
    {
        uint256 activeStrategies = 0;
        for (uint256 i = 0; i < strategyList.length; i++) {
            if (strategies[strategyList[i]].isActive) {
                activeStrategies++;
            }
        }
        
        address[] memory strategyAddresses = new address[](activeStrategies);
        uint256[] memory allocations = new uint256[](activeStrategies);
        
        if (activeStrategies == 0) {
            return (strategyAddresses, allocations);
        }
        
        // Calculate risk-adjusted scores
        uint256[] memory scores = new uint256[](activeStrategies);
        uint256 totalScore = 0;
        uint256 index = 0;
        
        for (uint256 i = 0; i < strategyList.length; i++) {
            address strategyAddr = strategyList[i];
            if (strategies[strategyAddr].isActive) {
                strategyAddresses[index] = strategyAddr;
                scores[index] = _calculateRiskAdjustedScore(strategyAddr);
                totalScore += scores[index];
                index++;
            }
        }
        
        // Calculate allocations based on scores
        if (totalScore > 0) {
            for (uint256 i = 0; i < activeStrategies; i++) {
                uint256 baseAllocation = (totalAmount * scores[i]) / totalScore;
                
                // Apply min/max constraints
                address strategyAddr = strategyAddresses[i];
                uint256 minAmount = (totalAmount * strategies[strategyAddr].minAllocation) / BASIS_POINTS;
                uint256 maxAmount = (totalAmount * strategies[strategyAddr].maxAllocation) / BASIS_POINTS;
                
                if (baseAllocation < minAmount) {
                    allocations[i] = minAmount;
                } else if (baseAllocation > maxAmount) {
                    allocations[i] = maxAmount;
                } else {
                    allocations[i] = baseAllocation;
                }
                
                emit AllocationCalculated(strategyAddr, allocations[i]);
            }
        }
        
        return (strategyAddresses, allocations);
    }
    
    /**
     * @dev Check if rebalancing is needed
     */
    function shouldRebalance(address[] memory currentStrategies, uint256[] memory currentAllocations) 
        external 
        view 
        returns (bool) 
    {
        if (currentStrategies.length == 0) return false;
        
        uint256 totalCurrent = 0;
        for (uint256 i = 0; i < currentAllocations.length; i++) {
            totalCurrent += currentAllocations[i];
        }
        
        if (totalCurrent == 0) return false;
        
        (address[] memory optimalStrategies, uint256[] memory optimalAllocations) = 
            this.calculateOptimalAllocations(totalCurrent);
        
        // Check if deviation exceeds threshold
        for (uint256 i = 0; i < currentStrategies.length; i++) {
            address strategy = currentStrategies[i];
            uint256 currentAlloc = currentAllocations[i];
            uint256 optimalAlloc = 0;
            
            // Find optimal allocation for this strategy
            for (uint256 j = 0; j < optimalStrategies.length; j++) {
                if (optimalStrategies[j] == strategy) {
                    optimalAlloc = optimalAllocations[j];
                    break;
                }
            }
            
            // Calculate deviation percentage
            uint256 deviation = currentAlloc > optimalAlloc ? 
                currentAlloc - optimalAlloc : optimalAlloc - currentAlloc;
            uint256 deviationBps = (deviation * BASIS_POINTS) / totalCurrent;
            
            if (deviationBps > rebalanceThreshold) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Calculate risk-adjusted score for a strategy
     */
    function _calculateRiskAdjustedScore(address _strategy) internal view returns (uint256) {
        StrategyInfo memory info = strategies[_strategy];
        
        // Base score from weight and performance
        uint256 baseScore = info.weight * info.performanceScore;
        
        // Risk adjustment based on risk tolerance
        uint256 riskAdjustment = 100;
        if (info.riskScore > riskTolerance) {
            // Penalize high-risk strategies if risk tolerance is low
            uint256 riskPenalty = ((info.riskScore - riskTolerance) * 50) / MAX_RISK_SCORE;
            riskAdjustment = riskAdjustment > riskPenalty ? riskAdjustment - riskPenalty : 0;
        } else if (info.riskScore < riskTolerance) {
            // Bonus for low-risk strategies if risk tolerance is high
            uint256 riskBonus = ((riskTolerance - info.riskScore) * 20) / MAX_RISK_SCORE;
            riskAdjustment += riskBonus;
        }
        
        // APY factor
        uint256 apyFactor = info.lastAPY > 0 ? info.lastAPY : 100; // Default to 1% if no APY data
        
        return (baseScore * riskAdjustment * apyFactor) / (100 * 100);
    }
    
    /**
     * @dev Calculate moving average of APY
     */
    function _calculateMovingAverage(address _strategy) internal view returns (uint256) {
        uint256[] memory history = apyHistory[_strategy];
        if (history.length == 0) return 0;
        
        uint256 sum = 0;
        for (uint256 i = 0; i < history.length; i++) {
            sum += history[i];
        }
        
        return sum / history.length;
    }
    
    /**
     * @dev Calculate performance score based on APY consistency
     */
    function _calculatePerformanceScore(address _strategy) internal view returns (uint256) {
        uint256[] memory history = apyHistory[_strategy];
        if (history.length < 2) return 50; // Default neutral score
        
        // Calculate variance to measure consistency
        uint256 mean = _calculateMovingAverage(_strategy);
        uint256 variance = 0;
        
        for (uint256 i = 0; i < history.length; i++) {
            uint256 diff = history[i] > mean ? history[i] - mean : mean - history[i];
            variance += diff * diff;
        }
        variance = variance / history.length;
        
        // Convert variance to score (lower variance = higher score)
        // This is a simplified scoring mechanism
        uint256 score = variance < 100 ? 100 - variance : 0;
        return score > 100 ? 100 : score;
    }
    
    // Admin functions
    function setRiskTolerance(uint256 _riskTolerance) external onlyOwner {
        require(_riskTolerance <= MAX_RISK_SCORE, "Risk tolerance too high");
        uint256 oldTolerance = riskTolerance;
        riskTolerance = _riskTolerance;
        emit RiskToleranceUpdated(oldTolerance, _riskTolerance);
    }
    
    function setRebalanceThreshold(uint256 _threshold) external onlyOwner {
        require(_threshold <= 2000, "Threshold too high"); // Max 20%
        rebalanceThreshold = _threshold;
    }
    
    // View functions
    function getActiveStrategiesCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < strategyList.length; i++) {
            if (strategies[strategyList[i]].isActive) {
                count++;
            }
        }
        return count;
    }
    
    function getStrategyAPYHistory(address _strategy) external view returns (uint256[] memory) {
        return apyHistory[_strategy];
    }
}
