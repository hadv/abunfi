import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import api from './api';

class PasskeyService {
  constructor() {
    this.isSupported = this.checkSupport();
  }

  /**
   * Check if WebAuthn is supported in the current browser
   */
  checkSupport() {
    return !!(navigator.credentials && navigator.credentials.create && navigator.credentials.get);
  }

  /**
   * Get browser support details
   */
  getSupportDetails() {
    const support = {
      webauthn: this.isSupported,
      platform: false,
      crossPlatform: false,
      userVerification: false
    };

    if (this.isSupported) {
      // Check for platform authenticator support (Face ID, Touch ID, Windows Hello)
      support.platform = !!(window.PublicKeyCredential &&
        window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable);

      // Check for cross-platform authenticator support (USB keys, etc.)
      support.crossPlatform = !!(window.PublicKeyCredential &&
        window.PublicKeyCredential.isConditionalMediationAvailable);

      // User verification is generally supported if WebAuthn is supported
      support.userVerification = true;
    }

    return support;
  }

  /**
   * Register a new passkey
   */
  async registerPasskey(deviceName = 'My Device') {
    try {
      if (!this.isSupported) {
        throw new Error('WebAuthn is not supported in this browser');
      }

      // Step 1: Get registration options from server
      const optionsResponse = await api.post('/passkey/register/begin', { deviceName });
      
      if (!optionsResponse.data.success) {
        throw new Error(optionsResponse.data.error || 'Failed to get registration options');
      }

      const { options } = optionsResponse.data;

      // Step 2: Start WebAuthn registration
      let credential;
      try {
        credential = await startRegistration(options);
      } catch (error) {
        if (error.name === 'InvalidStateError') {
          throw new Error('This device is already registered. Please try a different device or remove the existing passkey first.');
        } else if (error.name === 'NotAllowedError') {
          throw new Error('Passkey registration was cancelled or not allowed.');
        } else if (error.name === 'AbortError') {
          throw new Error('Passkey registration was aborted.');
        } else {
          throw new Error(`Registration failed: ${error.message}`);
        }
      }

      // Step 3: Send credential to server for verification
      const verificationResponse = await api.post('/passkey/register/complete', {
        credential,
        deviceName
      });

      if (!verificationResponse.data.success) {
        throw new Error(verificationResponse.data.error || 'Failed to verify registration');
      }

      return {
        success: true,
        passkeyId: verificationResponse.data.passkeyId,
        isFirstPasskey: verificationResponse.data.isFirstPasskey,
        securityLevel: verificationResponse.data.securityLevel,
        message: verificationResponse.data.message
      };

    } catch (error) {
      console.error('Passkey registration error:', error);
      throw error;
    }
  }

  /**
   * Authenticate with passkey
   */
  async authenticateWithPasskey() {
    try {
      if (!this.isSupported) {
        throw new Error('WebAuthn is not supported in this browser');
      }

      // Step 1: Get authentication options from server
      const optionsResponse = await api.post('/passkey/authenticate/begin');
      
      if (!optionsResponse.data.success) {
        throw new Error(optionsResponse.data.error || 'Failed to get authentication options');
      }

      const { options } = optionsResponse.data;

      // Step 2: Start WebAuthn authentication
      let credential;
      try {
        credential = await startAuthentication(options);
      } catch (error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Passkey authentication was cancelled or not allowed.');
        } else if (error.name === 'AbortError') {
          throw new Error('Passkey authentication was aborted.');
        } else if (error.name === 'InvalidStateError') {
          throw new Error('No passkey found for this account.');
        } else {
          throw new Error(`Authentication failed: ${error.message}`);
        }
      }

      // Step 3: Send credential to server for verification
      const verificationResponse = await api.post('/passkey/authenticate/complete', {
        credential
      });

      if (!verificationResponse.data.success) {
        throw new Error(verificationResponse.data.error || 'Failed to verify authentication');
      }

      return {
        success: true,
        verified: verificationResponse.data.verified,
        message: verificationResponse.data.message
      };

    } catch (error) {
      console.error('Passkey authentication error:', error);
      throw error;
    }
  }

  /**
   * Get user's passkeys
   */
  async getUserPasskeys() {
    try {
      const response = await api.get('/passkey/list');
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get passkeys');
      }

      return response.data.passkeys;
    } catch (error) {
      console.error('Get passkeys error:', error);
      throw error;
    }
  }

  /**
   * Delete a passkey
   */
  async deletePasskey(passkeyId) {
    try {
      const response = await api.delete(`/passkey/${passkeyId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete passkey');
      }

      return response.data;
    } catch (error) {
      console.error('Delete passkey error:', error);
      throw error;
    }
  }

  /**
   * Get security status and achievements
   */
  async getSecurityStatus() {
    try {
      const response = await api.get('/passkey/security/status');
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get security status');
      }

      return response.data.data;
    } catch (error) {
      console.error('Get security status error:', error);
      throw error;
    }
  }

  /**
   * Claim a security achievement
   */
  async claimAchievement(achievementId) {
    try {
      const response = await api.post('/passkey/security/claim-achievement', {
        achievementId
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to claim achievement');
      }

      return response.data;
    } catch (error) {
      console.error('Claim achievement error:', error);
      throw error;
    }
  }

  /**
   * Get security recommendations
   */
  async getSecurityRecommendations() {
    try {
      const response = await api.get('/passkey/security/recommendations');
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get recommendations');
      }

      return response.data.data;
    } catch (error) {
      console.error('Get security recommendations error:', error);
      throw error;
    }
  }

  /**
   * Complete 2FA after social login
   */
  async complete2FA(temporaryToken) {
    try {
      const response = await api.post('/auth/complete-2fa', {
        temporaryToken
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to complete 2FA');
      }

      return response.data;
    } catch (error) {
      console.error('Complete 2FA error:', error);
      throw error;
    }
  }

  /**
   * Get user-friendly error messages
   */
  getErrorMessage(error) {
    const errorMessages = {
      'NotSupportedError': 'Passkeys are not supported on this device or browser.',
      'NotAllowedError': 'Passkey operation was cancelled. Please try again.',
      'InvalidStateError': 'This passkey is already registered or not found.',
      'AbortError': 'Passkey operation was aborted.',
      'ConstraintError': 'Passkey operation failed due to device constraints.',
      'UnknownError': 'An unknown error occurred. Please try again.'
    };

    return errorMessages[error.name] || error.message || 'An unexpected error occurred.';
  }
}

const passkeyService = new PasskeyService();
export default passkeyService;
