import React from 'react';
import { ethers } from 'ethers';
import { usePaymasterContract, useContractAddresses } from '../hooks/useContract';
import toast from 'react-hot-toast';

/**
 * Rate Limiting Service for EIP7702 Paymaster
 * Handles DOS/Sybil attack prevention through rate limiting
 */
class RateLimitingService {
  constructor() {
    this.paymasterContract = null;
    this.addresses = null;
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  /**
   * Initialize the service with contract instances
   */
  async initialize(paymasterContract, addresses) {
    this.paymasterContract = paymasterContract;
    this.addresses = addresses;
  }

  /**
   * Get account state including rate limiting information
   */
  async getAccountState(userAddress) {
    if (!this.paymasterContract || !userAddress) {
      throw new Error('Service not initialized or invalid address');
    }

    const cacheKey = `accountState_${userAddress}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const accountState = await this.paymasterContract.getAccountState(userAddress);
      
      const result = {
        dailyGasUsed: ethers.formatEther(accountState.dailyGasUsed),
        dailyTxCount: accountState.dailyTxCount.toNumber(),
        lastResetTime: new Date(accountState.lastResetTime.toNumber() * 1000),
        isWhitelisted: accountState.isWhitelisted,
        customPolicy: {
          dailyGasLimit: ethers.formatEther(accountState.customPolicy.dailyGasLimit),
          perTxGasLimit: ethers.formatEther(accountState.customPolicy.perTxGasLimit),
          dailyTxLimit: accountState.customPolicy.dailyTxLimit.toNumber(),
          requiresWhitelist: accountState.customPolicy.requiresWhitelist,
          isActive: accountState.customPolicy.isActive
        }
      };

      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Failed to get account state:', error);
      throw new Error('Failed to retrieve account rate limiting information');
    }
  }

  /**
   * Get effective policy for an account (custom or global)
   */
  async getEffectivePolicy(userAddress) {
    if (!this.paymasterContract || !userAddress) {
      throw new Error('Service not initialized or invalid address');
    }

    const cacheKey = `effectivePolicy_${userAddress}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const policy = await this.paymasterContract.getEffectivePolicy(userAddress);
      
      const result = {
        dailyGasLimit: ethers.formatEther(policy.dailyGasLimit),
        perTxGasLimit: ethers.formatEther(policy.perTxGasLimit),
        dailyTxLimit: policy.dailyTxLimit.toNumber(),
        requiresWhitelist: policy.requiresWhitelist,
        isActive: policy.isActive
      };

      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Failed to get effective policy:', error);
      throw new Error('Failed to retrieve rate limiting policy');
    }
  }

  /**
   * Get remaining daily allowance for gas and transactions
   */
  async getRemainingAllowance(userAddress) {
    if (!this.paymasterContract || !userAddress) {
      throw new Error('Service not initialized or invalid address');
    }

    const cacheKey = `remainingAllowance_${userAddress}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const allowance = await this.paymasterContract.getRemainingDailyAllowance(userAddress);
      
      const result = {
        gasAllowance: ethers.formatEther(allowance.gasAllowance),
        txAllowance: allowance.txAllowance.toNumber(),
        gasAllowanceWei: allowance.gasAllowance,
        txAllowanceRaw: allowance.txAllowance
      };

      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Failed to get remaining allowance:', error);
      throw new Error('Failed to retrieve remaining allowance');
    }
  }

  /**
   * Validate if a user operation can be sponsored
   */
  async validateUserOperation(userOp, context) {
    if (!this.paymasterContract) {
      throw new Error('Service not initialized');
    }

    try {
      const validation = await this.paymasterContract.validateUserOperation(userOp, context);
      return {
        canSponsor: validation.success,
        gasPrice: ethers.formatUnits(validation.gasPrice, 'gwei')
      };
    } catch (error) {
      console.error('Failed to validate user operation:', error);
      throw new Error('Failed to validate transaction for sponsorship');
    }
  }

  /**
   * Check if user is approaching rate limits
   */
  async checkRateLimitWarnings(userAddress) {
    try {
      const [accountState, policy, allowance] = await Promise.all([
        this.getAccountState(userAddress),
        this.getEffectivePolicy(userAddress),
        this.getRemainingAllowance(userAddress)
      ]);

      const warnings = [];

      // Check gas limit warnings
      const gasUsedPercentage = (parseFloat(accountState.dailyGasUsed) / parseFloat(policy.dailyGasLimit)) * 100;
      if (gasUsedPercentage > 80) {
        warnings.push({
          type: 'gas_limit',
          severity: gasUsedPercentage > 95 ? 'critical' : 'warning',
          message: `You've used ${gasUsedPercentage.toFixed(1)}% of your daily gas limit`,
          remaining: allowance.gasAllowance
        });
      }

      // Check transaction limit warnings
      const txUsedPercentage = (accountState.dailyTxCount / policy.dailyTxLimit) * 100;
      if (txUsedPercentage > 80) {
        warnings.push({
          type: 'tx_limit',
          severity: txUsedPercentage > 95 ? 'critical' : 'warning',
          message: `You've used ${txUsedPercentage.toFixed(1)}% of your daily transaction limit`,
          remaining: allowance.txAllowance
        });
      }

      // Check if account needs whitelisting
      if (policy.requiresWhitelist && !accountState.isWhitelisted) {
        warnings.push({
          type: 'whitelist',
          severity: 'info',
          message: 'Your account requires whitelisting for gasless transactions',
          action: 'contact_support'
        });
      }

      return warnings;
    } catch (error) {
      console.error('Failed to check rate limit warnings:', error);
      return [];
    }
  }

  /**
   * Get security status for the user
   */
  async getSecurityStatus(userAddress) {
    try {
      const [accountState, policy, allowance, warnings] = await Promise.all([
        this.getAccountState(userAddress),
        this.getEffectivePolicy(userAddress),
        this.getRemainingAllowance(userAddress),
        this.checkRateLimitWarnings(userAddress)
      ]);

      const now = new Date();
      const resetTime = new Date(accountState.lastResetTime.getTime() + 24 * 60 * 60 * 1000);
      const hoursUntilReset = Math.max(0, Math.ceil((resetTime - now) / (1000 * 60 * 60)));

      return {
        isActive: policy.isActive,
        isWhitelisted: accountState.isWhitelisted,
        requiresWhitelist: policy.requiresWhitelist,
        dailyLimits: {
          gas: {
            used: accountState.dailyGasUsed,
            limit: policy.dailyGasLimit,
            remaining: allowance.gasAllowance,
            percentage: (parseFloat(accountState.dailyGasUsed) / parseFloat(policy.dailyGasLimit)) * 100
          },
          transactions: {
            used: accountState.dailyTxCount,
            limit: policy.dailyTxLimit,
            remaining: allowance.txAllowance,
            percentage: (accountState.dailyTxCount / policy.dailyTxLimit) * 100
          }
        },
        perTxLimit: policy.perTxGasLimit,
        resetInfo: {
          lastReset: accountState.lastResetTime,
          nextReset: resetTime,
          hoursUntilReset
        },
        warnings,
        riskLevel: this.calculateRiskLevel(warnings)
      };
    } catch (error) {
      console.error('Failed to get security status:', error);
      throw new Error('Failed to retrieve security status');
    }
  }

  /**
   * Calculate risk level based on warnings
   */
  calculateRiskLevel(warnings) {
    if (warnings.some(w => w.severity === 'critical')) {
      return 'high';
    }
    if (warnings.some(w => w.severity === 'warning')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Clear cache for a specific user or all cache
   */
  clearCache(userAddress = null) {
    if (userAddress) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(userAddress));
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  /**
   * Show appropriate toast notifications for rate limit warnings
   */
  showRateLimitNotifications(warnings) {
    warnings.forEach(warning => {
      switch (warning.severity) {
        case 'critical':
          toast.error(warning.message, { duration: 6000 });
          break;
        case 'warning':
          toast.warning(warning.message, { duration: 4000 });
          break;
        case 'info':
          toast.info(warning.message, { duration: 3000 });
          break;
        default:
          toast(warning.message);
      }
    });
  }
}

// Create singleton instance
const rateLimitingService = new RateLimitingService();

export default rateLimitingService;

/**
 * React hook for using the rate limiting service
 */
export const useRateLimitingService = () => {
  const addresses = useContractAddresses();
  const paymasterContract = usePaymasterContract(addresses.paymaster);

  React.useEffect(() => {
    if (paymasterContract.contract && addresses) {
      rateLimitingService.initialize(paymasterContract.contract, addresses);
    }
  }, [paymasterContract.contract, addresses]);

  return {
    service: rateLimitingService,
    isReady: paymasterContract.isReady
  };
};
