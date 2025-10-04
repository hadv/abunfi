import { ethers } from 'ethers';
import toast from 'react-hot-toast';

/**
 * zkVM Service for RISC Zero social verification
 * Handles social account verification using zero-knowledge proofs
 */
class ZkVMService {
  constructor() {
    // Use backend API for zkVM verification
    this.verificationServiceUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    this.supportedPlatforms = {
      TWITTER: { id: 0, name: 'Twitter', icon: '🐦', minAge: 30, minFollowers: 10 },
      DISCORD: { id: 1, name: 'Discord', icon: '💬', minAge: 14, minFollowers: 0 },
      GITHUB: { id: 2, name: 'GitHub', icon: '🐙', minAge: 90, minFollowers: 5 },
      TELEGRAM: { id: 3, name: 'Telegram', icon: '✈️', minAge: 30, minFollowers: 0 },
      LINKEDIN: { id: 4, name: 'LinkedIn', icon: '💼', minAge: 60, minFollowers: 10 }
    };
  }

  /**
   * Get supported social platforms
   */
  getSupportedPlatforms() {
    return this.supportedPlatforms;
  }

  /**
   * Get platform info by ID
   */
  getPlatformById(platformId) {
    return Object.values(this.supportedPlatforms).find(p => p.id === platformId);
  }

  /**
   * Get platform info by name
   */
  getPlatformByName(platformName) {
    return this.supportedPlatforms[platformName.toUpperCase()];
  }

  /**
   * Request social account verification
   * @param {string} platform - Platform name (TWITTER, DISCORD, etc.)
   * @param {string} oauthToken - OAuth token for the platform
   * @param {string} walletAddress - Wallet address to link
   * @param {Object} contracts - Contract instances
   * @returns {Promise<string>} Request ID
   */
  async requestVerification(platform, oauthToken, walletAddress, contracts) {
    try {
      if (!contracts.riscZeroSocialVerifier) {
        throw new Error('RISC Zero Social Verifier contract not available');
      }

      const platformInfo = this.getPlatformByName(platform);
      if (!platformInfo) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      // Request verification from the smart contract
      const tx = await contracts.riscZeroSocialVerifier.requestVerification(
        platformInfo.id,
        oauthToken,
        walletAddress
      );

      const receipt = await tx.wait();
      
      // Extract request ID from events
      const event = receipt.events?.find(e => e.event === 'VerificationRequested');
      const requestId = event?.args?.requestId;

      if (!requestId) {
        throw new Error('Failed to get verification request ID');
      }

      // Start the RISC Zero verification process
      this.startZkVerification(platform, oauthToken, walletAddress, requestId);

      return requestId;
    } catch (error) {
      console.error('Failed to request verification:', error);
      throw error;
    }
  }

  /**
   * Start the RISC Zero verification process
   * @param {string} platform - Platform name
   * @param {string} oauthToken - OAuth token
   * @param {string} walletAddress - Wallet address
   * @param {string} requestId - Verification request ID
   */
  async startZkVerification(platform, oauthToken, walletAddress, requestId) {
    try {
      // Call the backend zkVM API
      const response = await fetch(`${this.verificationServiceUrl}/zkvm/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: platform.toLowerCase(),
          oauth_token: oauthToken,
          wallet_address: walletAddress,
          request_id: requestId
        })
      });

      if (!response.ok) {
        throw new Error(`Verification service error: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Verification failed');
      }

      return result;
    } catch (error) {
      console.error('ZK verification failed:', error);
      // Note: In a real implementation, this would be handled by the backend service
      // For now, we'll just log the error
      throw error;
    }
  }

  /**
   * Check verification status
   * @param {string} requestId - Verification request ID
   * @param {Object} contracts - Contract instances
   * @returns {Promise<Object>} Verification status
   */
  async checkVerificationStatus(requestId, contracts) {
    try {
      // First check backend zkVM service for proof generation status
      const backendResponse = await fetch(`${this.verificationServiceUrl}/zkvm/status/${requestId}`);

      if (backendResponse.ok) {
        const backendStatus = await backendResponse.json();

        // If backend verification is still pending, return pending status
        if (backendStatus.status === 'pending') {
          return {
            isVerified: false,
            isCompleted: false,
            data: null
          };
        }

        // If backend verification failed, return failed status
        if (backendStatus.status === 'failed') {
          return {
            isVerified: false,
            isCompleted: true,
            error: backendStatus.error,
            data: null
          };
        }
      }

      // Check on-chain verification status
      if (!contracts.riscZeroSocialVerifier) {
        throw new Error('RISC Zero Social Verifier contract not available');
      }

      const [isVerified, isCompleted, data] = await contracts.riscZeroSocialVerifier.getVerificationResult(requestId);

      return {
        isVerified,
        isCompleted,
        data: isCompleted ? {
          socialAccountHash: data.socialAccountHash,
          walletAddress: data.walletAddress,
          platform: data.platform,
          accountAge: data.accountAge.toNumber(),
          followerCount: data.followerCount.toNumber(),
          timestamp: data.timestamp.toNumber(),
          socialAccountId: data.socialAccountId
        } : null
      };
    } catch (error) {
      console.error('Failed to check verification status:', error);
      throw error;
    }
  }

  /**
   * Get user's verification status
   * @param {string} walletAddress - Wallet address
   * @param {Object} contracts - Contract instances
   * @returns {Promise<Object>} User verification status
   */
  async getUserVerificationStatus(walletAddress, contracts) {
    try {
      if (!contracts.socialAccountRegistry) {
        throw new Error('Social Account Registry contract not available');
      }

      const [hasVerification, verificationLevel] = await contracts.socialAccountRegistry.getVerificationStatus(walletAddress);
      
      let linkedAccounts = [];
      if (hasVerification) {
        const [platforms, accountHashes] = await contracts.socialAccountRegistry.getUserSocialAccounts(walletAddress);
        
        linkedAccounts = platforms.map((platformId, index) => ({
          platform: this.getPlatformById(platformId),
          accountHash: accountHashes[index],
          platformId
        }));
      }

      return {
        hasVerification,
        verificationLevel: verificationLevel.toNumber(),
        linkedAccounts
      };
    } catch (error) {
      console.error('Failed to get user verification status:', error);
      throw error;
    }
  }

  /**
   * Link social account after successful verification
   * @param {Object} proof - Verification proof data
   * @param {Object} contracts - Contract instances
   * @returns {Promise<Object>} Transaction result
   */
  async linkSocialAccount(proof, contracts) {
    try {
      if (!contracts.socialAccountRegistry) {
        throw new Error('Social Account Registry contract not available');
      }

      const tx = await contracts.socialAccountRegistry.linkSocialAccount(proof);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.transactionHash,
        receipt
      };
    } catch (error) {
      console.error('Failed to link social account:', error);
      throw error;
    }
  }

  /**
   * Get platform configuration
   * @param {string} platform - Platform name
   * @param {Object} contracts - Contract instances
   * @returns {Promise<Object>} Platform configuration
   */
  async getPlatformConfig(platform, contracts) {
    try {
      if (!contracts.socialAccountRegistry) {
        throw new Error('Social Account Registry contract not available');
      }

      const platformInfo = this.getPlatformByName(platform);
      if (!platformInfo) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      const config = await contracts.socialAccountRegistry.getPlatformConfig(platformInfo.id);

      return {
        isEnabled: config.isEnabled,
        minimumAccountAge: config.minimumAccountAge.toNumber(),
        minimumFollowers: config.minimumFollowers.toNumber(),
        verificationCooldown: config.verificationCooldown.toNumber()
      };
    } catch (error) {
      console.error('Failed to get platform config:', error);
      throw error;
    }
  }

  /**
   * Validate OAuth token format
   * @param {string} platform - Platform name
   * @param {string} token - OAuth token
   * @returns {boolean} Is valid
   */
  validateOAuthToken(platform, token) {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Basic validation - in a real app, this would be more sophisticated
    switch (platform.toUpperCase()) {
      case 'TWITTER':
        return token.length > 20 && token.includes('-');
      case 'DISCORD':
        return token.length > 50;
      case 'GITHUB':
        return token.startsWith('ghp_') || token.startsWith('gho_');
      case 'TELEGRAM':
        return token.length > 30;
      case 'LINKEDIN':
        return token.length > 40;
      default:
        return token.length > 10;
    }
  }

  /**
   * Get OAuth instructions for a platform
   * @param {string} platform - Platform name
   * @returns {Object} OAuth instructions
   */
  getOAuthInstructions(platform) {
    const instructions = {
      TWITTER: {
        title: 'Twitter OAuth Token',
        steps: [
          'Go to Twitter Developer Portal',
          'Create a new app or use existing one',
          'Generate Bearer Token or OAuth 2.0 token',
          'Copy the token and paste it here'
        ],
        url: 'https://developer.twitter.com/en/portal/dashboard'
      },
      DISCORD: {
        title: 'Discord OAuth Token',
        steps: [
          'Go to Discord Developer Portal',
          'Create a new application',
          'Go to OAuth2 section',
          'Generate token with appropriate scopes',
          'Copy the token and paste it here'
        ],
        url: 'https://discord.com/developers/applications'
      },
      GITHUB: {
        title: 'GitHub Personal Access Token',
        steps: [
          'Go to GitHub Settings',
          'Navigate to Developer settings > Personal access tokens',
          'Generate new token with read permissions',
          'Copy the token and paste it here'
        ],
        url: 'https://github.com/settings/tokens'
      },
      TELEGRAM: {
        title: 'Telegram Bot Token',
        steps: [
          'Message @BotFather on Telegram',
          'Create a new bot or use existing one',
          'Get the bot token',
          'Copy the token and paste it here'
        ],
        url: 'https://t.me/botfather'
      },
      LINKEDIN: {
        title: 'LinkedIn OAuth Token',
        steps: [
          'Go to LinkedIn Developer Portal',
          'Create a new app',
          'Configure OAuth 2.0 settings',
          'Generate access token',
          'Copy the token and paste it here'
        ],
        url: 'https://www.linkedin.com/developers/'
      }
    };

    return instructions[platform.toUpperCase()] || {
      title: 'OAuth Token',
      steps: ['Obtain OAuth token from the platform', 'Copy and paste it here'],
      url: '#'
    };
  }
}

// Create singleton instance
const zkVMService = new ZkVMService();

export default zkVMService;
