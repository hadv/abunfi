const { ethers } = require('ethers');
const logger = require('../utils/logger');
const memoryCache = require('../utils/memoryCache');

/**
 * Security Controller
 * Handles rate limiting, DOS/Sybil attack prevention, and security monitoring
 */
class SecurityController {
  constructor() {
    this.cache = memoryCache;
    this.cacheTimeout = 30000; // 30 seconds
  }

  /**
   * Get security status for a wallet address
   */
  async getSecurityStatus(req, res) {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
        return res.status(400).json({
          error: 'Invalid wallet address'
        });
      }

      // Check cache first
      const cacheKey = `security_status_${walletAddress}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true
        });
      }

      // Mock security status (in real implementation, this would query the blockchain)
      const securityStatus = await this.generateMockSecurityStatus(walletAddress);
      
      // Cache the result
      this.cache.set(cacheKey, securityStatus, this.cacheTimeout);

      res.json({
        success: true,
        data: securityStatus,
        cached: false
      });

    } catch (error) {
      logger.error('Error getting security status:', error);
      res.status(500).json({
        error: 'Failed to retrieve security status',
        message: error.message
      });
    }
  }

  /**
   * Check if a transaction can be sponsored (rate limiting check)
   */
  async checkTransactionEligibility(req, res) {
    try {
      const { walletAddress } = req.params;
      const { estimatedGasCost, transactionType } = req.body;

      if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
        return res.status(400).json({
          error: 'Invalid wallet address'
        });
      }

      // Get current security status
      const securityStatus = await this.generateMockSecurityStatus(walletAddress);
      
      // Check eligibility
      const eligibility = this.checkEligibility(securityStatus, estimatedGasCost);

      res.json({
        success: true,
        data: {
          canProceed: eligibility.canProceed,
          reason: eligibility.reason,
          securityStatus,
          estimatedGasCost,
          transactionType
        }
      });

    } catch (error) {
      logger.error('Error checking transaction eligibility:', error);
      res.status(500).json({
        error: 'Failed to check transaction eligibility',
        message: error.message
      });
    }
  }

  /**
   * Get security recommendations for a user
   */
  async getSecurityRecommendations(req, res) {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
        return res.status(400).json({
          error: 'Invalid wallet address'
        });
      }

      const securityStatus = await this.generateMockSecurityStatus(walletAddress);
      const recommendations = this.generateRecommendations(securityStatus);

      res.json({
        success: true,
        data: {
          recommendations,
          securityStatus
        }
      });

    } catch (error) {
      logger.error('Error getting security recommendations:', error);
      res.status(500).json({
        error: 'Failed to get security recommendations',
        message: error.message
      });
    }
  }

  /**
   * Record a security event
   */
  async recordSecurityEvent(req, res) {
    try {
      const { walletAddress, eventType, severity, message, metadata } = req.body;

      if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
        return res.status(400).json({
          error: 'Invalid wallet address'
        });
      }

      const securityEvent = {
        walletAddress,
        eventType,
        severity,
        message,
        metadata,
        timestamp: new Date().toISOString(),
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Store event (in real implementation, this would go to a database)
      const eventsKey = `security_events_${walletAddress}`;
      const existingEvents = this.cache.get(eventsKey) || [];
      existingEvents.push(securityEvent);
      
      // Keep only last 100 events
      if (existingEvents.length > 100) {
        existingEvents.splice(0, existingEvents.length - 100);
      }
      
      this.cache.set(eventsKey, existingEvents, 24 * 60 * 60 * 1000); // 24 hours

      logger.info('Security event recorded:', securityEvent);

      res.json({
        success: true,
        data: securityEvent
      });

    } catch (error) {
      logger.error('Error recording security event:', error);
      res.status(500).json({
        error: 'Failed to record security event',
        message: error.message
      });
    }
  }

  /**
   * Get security events for a wallet
   */
  async getSecurityEvents(req, res) {
    try {
      const { walletAddress } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
        return res.status(400).json({
          error: 'Invalid wallet address'
        });
      }

      const eventsKey = `security_events_${walletAddress}`;
      const allEvents = this.cache.get(eventsKey) || [];
      
      // Apply pagination
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      const events = allEvents.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          events,
          total: allEvents.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      logger.error('Error getting security events:', error);
      res.status(500).json({
        error: 'Failed to get security events',
        message: error.message
      });
    }
  }

  /**
   * Generate mock security status (replace with real blockchain queries)
   */
  async generateMockSecurityStatus(walletAddress) {
    // Simulate different security states based on wallet address
    const addressHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(walletAddress));
    const hashInt = parseInt(addressHash.slice(2, 10), 16);
    
    const isWhitelisted = hashInt % 10 < 3; // 30% chance of being whitelisted
    const gasUsedPercentage = (hashInt % 100) * 0.8; // 0-80% usage
    const txUsedPercentage = (hashInt % 100) * 0.6; // 0-60% usage
    
    const dailyGasLimit = isWhitelisted ? '0.2' : '0.1'; // ETH
    const dailyTxLimit = isWhitelisted ? 100 : 50;
    const perTxLimit = isWhitelisted ? '0.02' : '0.01'; // ETH
    
    const gasUsed = (parseFloat(dailyGasLimit) * gasUsedPercentage / 100).toFixed(6);
    const txUsed = Math.floor(dailyTxLimit * txUsedPercentage / 100);
    
    const gasRemaining = (parseFloat(dailyGasLimit) - parseFloat(gasUsed)).toFixed(6);
    const txRemaining = dailyTxLimit - txUsed;
    
    // Determine risk level
    let riskLevel = 'low';
    if (gasUsedPercentage > 80 || txUsedPercentage > 80) {
      riskLevel = 'high';
    } else if (gasUsedPercentage > 60 || txUsedPercentage > 60) {
      riskLevel = 'medium';
    }
    
    // Generate warnings
    const warnings = [];
    if (gasUsedPercentage > 80) {
      warnings.push({
        type: 'gas_limit',
        severity: gasUsedPercentage > 95 ? 'critical' : 'warning',
        message: `You've used ${gasUsedPercentage.toFixed(1)}% of your daily gas limit`,
        remaining: gasRemaining
      });
    }
    
    if (txUsedPercentage > 80) {
      warnings.push({
        type: 'tx_limit',
        severity: txUsedPercentage > 95 ? 'critical' : 'warning',
        message: `You've used ${txUsedPercentage.toFixed(1)}% of your daily transaction limit`,
        remaining: txRemaining
      });
    }

    const now = new Date();
    const lastReset = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextReset = new Date(lastReset.getTime() + 24 * 60 * 60 * 1000);
    const hoursUntilReset = Math.ceil((nextReset - now) / (1000 * 60 * 60));

    return {
      isActive: true,
      isWhitelisted,
      requiresWhitelist: false,
      dailyLimits: {
        gas: {
          used: gasUsed,
          limit: dailyGasLimit,
          remaining: gasRemaining,
          percentage: gasUsedPercentage
        },
        transactions: {
          used: txUsed,
          limit: dailyTxLimit,
          remaining: txRemaining,
          percentage: txUsedPercentage
        }
      },
      perTxLimit,
      resetInfo: {
        lastReset: lastReset.toISOString(),
        nextReset: nextReset.toISOString(),
        hoursUntilReset
      },
      warnings,
      riskLevel
    };
  }

  /**
   * Check transaction eligibility based on security status
   */
  checkEligibility(securityStatus, estimatedGasCost) {
    if (!securityStatus.isActive) {
      return {
        canProceed: false,
        reason: 'Gasless transactions are disabled for your account'
      };
    }

    if (securityStatus.requiresWhitelist && !securityStatus.isWhitelisted) {
      return {
        canProceed: false,
        reason: 'Your account requires whitelisting for gasless transactions'
      };
    }

    if (securityStatus.dailyLimits.transactions.remaining <= 0) {
      return {
        canProceed: false,
        reason: 'Daily transaction limit exceeded'
      };
    }

    if (estimatedGasCost) {
      const estimatedCostFloat = parseFloat(estimatedGasCost);
      
      if (estimatedCostFloat > parseFloat(securityStatus.perTxLimit)) {
        return {
          canProceed: false,
          reason: `Transaction gas cost exceeds per-transaction limit of ${securityStatus.perTxLimit} ETH`
        };
      }

      if (estimatedCostFloat > parseFloat(securityStatus.dailyLimits.gas.remaining)) {
        return {
          canProceed: false,
          reason: 'Insufficient daily gas allowance remaining'
        };
      }
    }

    return { canProceed: true };
  }

  /**
   * Generate security recommendations
   */
  generateRecommendations(securityStatus) {
    const recommendations = [];

    if (!securityStatus.isWhitelisted && securityStatus.requiresWhitelist) {
      recommendations.push({
        type: 'whitelist',
        priority: 'high',
        title: 'Get Whitelisted',
        description: 'Contact support to get your account whitelisted for higher gasless transaction limits.',
        action: 'contact_support'
      });
    }

    const gasUsagePercentage = securityStatus.dailyLimits.gas.percentage;
    const txUsagePercentage = securityStatus.dailyLimits.transactions.percentage;

    if (gasUsagePercentage > 70) {
      recommendations.push({
        type: 'gas_optimization',
        priority: gasUsagePercentage > 90 ? 'high' : 'medium',
        title: 'Optimize Gas Usage',
        description: 'Consider batching transactions or using them during off-peak hours to conserve your daily gas allowance.',
        action: 'optimize_usage'
      });
    }

    if (txUsagePercentage > 70) {
      recommendations.push({
        type: 'transaction_optimization',
        priority: txUsagePercentage > 90 ? 'high' : 'medium',
        title: 'Optimize Transaction Count',
        description: 'Try to batch multiple operations into single transactions to stay within your daily limit.',
        action: 'batch_transactions'
      });
    }

    return recommendations;
  }
}

const securityController = new SecurityController();

// Export bound methods to preserve 'this' context
module.exports = {
  getSecurityStatus: securityController.getSecurityStatus.bind(securityController),
  checkTransactionEligibility: securityController.checkTransactionEligibility.bind(securityController),
  getSecurityRecommendations: securityController.getSecurityRecommendations.bind(securityController),
  recordSecurityEvent: securityController.recordSecurityEvent.bind(securityController),
  getSecurityEvents: securityController.getSecurityEvents.bind(securityController)
};
