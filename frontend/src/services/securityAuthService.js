import React from 'react';
import { authService } from './authService';
import rateLimitingService from './rateLimitingService';
import toast from 'react-hot-toast';

/**
 * Enhanced Authentication Service with Security Integration
 * Integrates rate limiting and security checks into the authentication flow
 */
class SecurityAuthService {
  constructor() {
    this.securityCheckCache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache for security checks
  }

  /**
   * Enhanced social login with security checks
   */
  async socialLoginWithSecurity(loginData) {
    try {
      // Perform standard social login
      const authResponse = await authService.socialLogin(loginData);
      
      // Perform security checks after successful login
      if (authResponse.user && loginData.walletAddress) {
        await this.performPostLoginSecurityChecks(loginData.walletAddress, authResponse.user);
      }

      return authResponse;
    } catch (error) {
      console.error('Social login with security failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced phone login with security checks
   */
  async phoneLoginWithSecurity(phoneData) {
    try {
      // Perform standard phone login
      const authResponse = await authService.phoneLogin(phoneData);
      
      // Perform security checks after successful login
      if (authResponse.user && phoneData.walletAddress) {
        await this.performPostLoginSecurityChecks(phoneData.walletAddress, authResponse.user);
      }

      return authResponse;
    } catch (error) {
      console.error('Phone login with security failed:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive security checks after login
   */
  async performPostLoginSecurityChecks(walletAddress, user) {
    const cacheKey = `securityCheck_${walletAddress}`;
    const cached = this.securityCheckCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Initialize rate limiting service if not already done
      if (!rateLimitingService.paymasterContract) {
        console.log('Rate limiting service not initialized, skipping security checks');
        return null;
      }

      // Get security status
      const securityStatus = await rateLimitingService.getSecurityStatus(walletAddress);
      
      // Cache the result
      this.securityCheckCache.set(cacheKey, {
        data: securityStatus,
        timestamp: Date.now()
      });

      // Show security notifications
      this.showSecurityNotifications(securityStatus, user);

      return securityStatus;
    } catch (error) {
      console.error('Post-login security checks failed:', error);
      // Don't fail login if security checks fail
      return null;
    }
  }

  /**
   * Show appropriate security notifications after login
   */
  showSecurityNotifications(securityStatus, user) {
    if (!securityStatus) return;

    // Welcome message with security status
    if (securityStatus.isActive) {
      if (securityStatus.isWhitelisted) {
        toast.success(`Welcome back, ${user.name || 'User'}! Your account has premium gasless transaction access.`, {
          duration: 4000,
          icon: '🛡️'
        });
      } else {
        toast.success(`Welcome back, ${user.name || 'User'}! Gasless transactions are available with standard limits.`, {
          duration: 4000,
          icon: '⚡'
        });
      }
    } else {
      toast.warning('Gasless transactions are currently disabled for your account. Contact support if you need assistance.', {
        duration: 6000
      });
    }

    // Show rate limit warnings if approaching limits
    if (securityStatus.warnings && securityStatus.warnings.length > 0) {
      const criticalWarnings = securityStatus.warnings.filter(w => w.severity === 'critical');
      const warningMessages = securityStatus.warnings.filter(w => w.severity === 'warning');

      if (criticalWarnings.length > 0) {
        toast.error('You are very close to your daily gasless transaction limits. Monitor your usage carefully.', {
          duration: 6000
        });
      } else if (warningMessages.length > 0) {
        toast.warning('You have used most of your daily gasless transaction allowance.', {
          duration: 4000
        });
      }
    }

    // Show reset time information
    if (securityStatus.resetInfo && securityStatus.resetInfo.hoursUntilReset <= 2) {
      toast.info(`Your daily limits will reset in ${securityStatus.resetInfo.hoursUntilReset} hour(s).`, {
        duration: 3000
      });
    }
  }

  /**
   * Check if user can perform gasless transactions
   */
  async canPerformGaslessTransaction(walletAddress, estimatedGasCost = null) {
    try {
      if (!rateLimitingService.paymasterContract) {
        return { canProceed: false, reason: 'Security service not available' };
      }

      const securityStatus = await rateLimitingService.getSecurityStatus(walletAddress);
      
      if (!securityStatus.isActive) {
        return { 
          canProceed: false, 
          reason: 'Gasless transactions are disabled for your account',
          securityStatus 
        };
      }

      if (securityStatus.requiresWhitelist && !securityStatus.isWhitelisted) {
        return { 
          canProceed: false, 
          reason: 'Your account requires whitelisting for gasless transactions',
          securityStatus 
        };
      }

      // Check daily transaction limit
      if (securityStatus.dailyLimits.transactions.remaining <= 0) {
        return { 
          canProceed: false, 
          reason: 'Daily transaction limit exceeded',
          securityStatus 
        };
      }

      // Check gas limits if estimated cost is provided
      if (estimatedGasCost) {
        const estimatedCostFloat = parseFloat(estimatedGasCost);
        
        // Check per-transaction limit
        if (estimatedCostFloat > parseFloat(securityStatus.perTxLimit)) {
          return { 
            canProceed: false, 
            reason: `Transaction gas cost exceeds per-transaction limit of ${securityStatus.perTxLimit} ETH`,
            securityStatus 
          };
        }

        // Check remaining daily gas allowance
        if (estimatedCostFloat > parseFloat(securityStatus.dailyLimits.gas.remaining)) {
          return { 
            canProceed: false, 
            reason: 'Insufficient daily gas allowance remaining',
            securityStatus 
          };
        }
      }

      return { canProceed: true, securityStatus };
    } catch (error) {
      console.error('Failed to check gasless transaction eligibility:', error);
      return { 
        canProceed: false, 
        reason: 'Failed to verify transaction eligibility',
        error: error.message 
      };
    }
  }

  /**
   * Get security recommendations for the user
   */
  async getSecurityRecommendations(walletAddress) {
    try {
      const securityStatus = await rateLimitingService.getSecurityStatus(walletAddress);
      const recommendations = [];

      if (!securityStatus) {
        return recommendations;
      }

      // Whitelist recommendation
      if (!securityStatus.isWhitelisted && securityStatus.requiresWhitelist) {
        recommendations.push({
          type: 'whitelist',
          priority: 'high',
          title: 'Get Whitelisted',
          description: 'Contact support to get your account whitelisted for higher gasless transaction limits.',
          action: 'contact_support'
        });
      }

      // Usage optimization recommendations
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

      // Security best practices
      if (securityStatus.riskLevel === 'medium' || securityStatus.riskLevel === 'high') {
        recommendations.push({
          type: 'security_practices',
          priority: 'medium',
          title: 'Review Security Practices',
          description: 'Monitor your account activity and ensure your wallet is secure to maintain good standing.',
          action: 'review_security'
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Failed to get security recommendations:', error);
      return [];
    }
  }

  /**
   * Clear security check cache
   */
  clearSecurityCache(walletAddress = null) {
    if (walletAddress) {
      const keysToDelete = Array.from(this.securityCheckCache.keys())
        .filter(key => key.includes(walletAddress));
      keysToDelete.forEach(key => this.securityCheckCache.delete(key));
    } else {
      this.securityCheckCache.clear();
    }
  }

  /**
   * Get cached security status if available
   */
  getCachedSecurityStatus(walletAddress) {
    const cacheKey = `securityCheck_${walletAddress}`;
    const cached = this.securityCheckCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    return null;
  }
}

// Create singleton instance
const securityAuthService = new SecurityAuthService();

export default securityAuthService;

/**
 * React hook for using the security auth service
 */
export const useSecurityAuth = () => {
  return {
    socialLoginWithSecurity: securityAuthService.socialLoginWithSecurity.bind(securityAuthService),
    phoneLoginWithSecurity: securityAuthService.phoneLoginWithSecurity.bind(securityAuthService),
    canPerformGaslessTransaction: securityAuthService.canPerformGaslessTransaction.bind(securityAuthService),
    getSecurityRecommendations: securityAuthService.getSecurityRecommendations.bind(securityAuthService),
    clearSecurityCache: securityAuthService.clearSecurityCache.bind(securityAuthService),
    getCachedSecurityStatus: securityAuthService.getCachedSecurityStatus.bind(securityAuthService)
  };
};
