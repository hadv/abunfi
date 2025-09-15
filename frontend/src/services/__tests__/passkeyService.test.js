import passkeyService from '../passkeyService';
import api from '../api';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

// Mock dependencies
jest.mock('../api');
jest.mock('@simplewebauthn/browser');

// Mock WebAuthn API
const mockPublicKeyCredential = {
  isUserVerifyingPlatformAuthenticatorAvailable: jest.fn(),
  isConditionalMediationAvailable: jest.fn()
};

Object.defineProperty(window, 'PublicKeyCredential', {
  value: mockPublicKeyCredential,
  writable: true
});

describe('PasskeyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset service state
    passkeyService.isSupported = true;
    
    // Mock successful API responses
    api.post.mockResolvedValue({ data: { success: true } });
    api.get.mockResolvedValue({ data: { success: true } });
    api.delete.mockResolvedValue({ data: { success: true } });
  });

  describe('isSupported', () => {
    it('returns true when WebAuthn is supported', () => {
      expect(passkeyService.isSupported).toBe(true);
    });

    it('returns false when WebAuthn is not supported', () => {
      delete window.PublicKeyCredential;
      
      // Create new instance to test
      const testService = new (require('../passkeyService').default.constructor)();
      expect(testService.isSupported).toBe(false);
    });
  });

  describe('getSupportDetails', () => {
    it('returns support details when WebAuthn is supported', async () => {
      mockPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable.mockResolvedValue(true);
      mockPublicKeyCredential.isConditionalMediationAvailable.mockResolvedValue(true);

      const details = await passkeyService.getSupportDetails();

      expect(details).toEqual({
        platform: true,
        crossPlatform: true,
        userVerification: true
      });
    });

    it('returns false values when WebAuthn is not supported', async () => {
      passkeyService.isSupported = false;

      const details = await passkeyService.getSupportDetails();

      expect(details).toEqual({
        platform: false,
        crossPlatform: false,
        userVerification: false
      });
    });
  });

  describe('register', () => {
    const mockRegistrationOptions = {
      challenge: 'test-challenge',
      user: { id: 'user-123', name: 'test@example.com', displayName: 'Test User' },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }]
    };

    const mockCredential = {
      id: 'credential-id',
      response: {
        attestationObject: 'attestation-object',
        clientDataJSON: 'client-data-json'
      }
    };

    it('successfully registers a passkey', async () => {
      api.post
        .mockResolvedValueOnce({
          data: { success: true, options: mockRegistrationOptions }
        })
        .mockResolvedValueOnce({
          data: { 
            success: true, 
            isFirstPasskey: true,
            achievements: ['first_passkey'],
            securityBonus: 100
          }
        });

      startRegistration.mockResolvedValue(mockCredential);

      const result = await passkeyService.register('Test Device');

      expect(api.post).toHaveBeenCalledWith('/passkey/register/begin', {
        deviceName: 'Test Device'
      });
      expect(startRegistration).toHaveBeenCalledWith(mockRegistrationOptions);
      expect(api.post).toHaveBeenCalledWith('/passkey/register/complete', {
        credential: mockCredential,
        deviceName: 'Test Device'
      });
      expect(result).toEqual({
        success: true,
        isFirstPasskey: true,
        achievements: ['first_passkey'],
        securityBonus: 100
      });
    });

    it('handles registration begin failure', async () => {
      api.post.mockRejectedValue(new Error('Network error'));

      await expect(passkeyService.register('Test Device')).rejects.toThrow('Network error');
    });

    it('handles WebAuthn registration failure', async () => {
      api.post.mockResolvedValue({
        data: { success: true, options: mockRegistrationOptions }
      });

      const webauthnError = new Error('User cancelled');
      webauthnError.name = 'NotAllowedError';
      startRegistration.mockRejectedValue(webauthnError);

      await expect(passkeyService.register('Test Device')).rejects.toThrow('User cancelled');
    });

    it('handles registration complete failure', async () => {
      api.post
        .mockResolvedValueOnce({
          data: { success: true, options: mockRegistrationOptions }
        })
        .mockRejectedValueOnce(new Error('Server error'));

      startRegistration.mockResolvedValue(mockCredential);

      await expect(passkeyService.register('Test Device')).rejects.toThrow('Server error');
    });
  });

  describe('authenticate', () => {
    const mockAuthenticationOptions = {
      challenge: 'test-challenge',
      allowCredentials: [{ id: 'credential-id', type: 'public-key' }]
    };

    const mockAssertion = {
      id: 'credential-id',
      response: {
        authenticatorData: 'authenticator-data',
        clientDataJSON: 'client-data-json',
        signature: 'signature'
      }
    };

    it('successfully authenticates with passkey', async () => {
      api.post
        .mockResolvedValueOnce({
          data: { success: true, options: mockAuthenticationOptions }
        })
        .mockResolvedValueOnce({
          data: { success: true, message: 'Authentication successful' }
        });

      startAuthentication.mockResolvedValue(mockAssertion);

      const result = await passkeyService.authenticate('temp-token');

      expect(api.post).toHaveBeenCalledWith('/passkey/authenticate/begin');
      expect(startAuthentication).toHaveBeenCalledWith(mockAuthenticationOptions);
      expect(api.post).toHaveBeenCalledWith('/passkey/authenticate/complete', {
        credential: mockAssertion,
        temporaryToken: 'temp-token'
      });
      expect(result).toEqual({
        success: true,
        message: 'Authentication successful'
      });
    });

    it('handles authentication begin failure', async () => {
      api.post.mockRejectedValue(new Error('No passkeys found'));

      await expect(passkeyService.authenticate('temp-token')).rejects.toThrow('No passkeys found');
    });

    it('handles WebAuthn authentication failure', async () => {
      api.post.mockResolvedValue({
        data: { success: true, options: mockAuthenticationOptions }
      });

      const webauthnError = new Error('User cancelled');
      webauthnError.name = 'NotAllowedError';
      startAuthentication.mockRejectedValue(webauthnError);

      await expect(passkeyService.authenticate('temp-token')).rejects.toThrow('User cancelled');
    });
  });

  describe('listPasskeys', () => {
    it('returns list of user passkeys', async () => {
      const mockPasskeys = [
        { id: '1', device_name: 'iPhone', created_at: '2023-01-01' },
        { id: '2', device_name: 'MacBook', created_at: '2023-01-02' }
      ];

      api.get.mockResolvedValue({
        data: { success: true, passkeys: mockPasskeys }
      });

      const result = await passkeyService.listPasskeys();

      expect(api.get).toHaveBeenCalledWith('/passkey/list');
      expect(result).toEqual(mockPasskeys);
    });

    it('handles API failure', async () => {
      api.get.mockRejectedValue(new Error('Server error'));

      await expect(passkeyService.listPasskeys()).rejects.toThrow('Server error');
    });
  });

  describe('deletePasskey', () => {
    it('successfully deletes a passkey', async () => {
      api.delete.mockResolvedValue({
        data: { success: true, message: 'Passkey deleted' }
      });

      const result = await passkeyService.deletePasskey('passkey-123');

      expect(api.delete).toHaveBeenCalledWith('/passkey/passkey-123');
      expect(result).toEqual({ success: true, message: 'Passkey deleted' });
    });

    it('handles deletion failure', async () => {
      api.delete.mockRejectedValue(new Error('Cannot delete last passkey'));

      await expect(passkeyService.deletePasskey('passkey-123')).rejects.toThrow('Cannot delete last passkey');
    });
  });

  describe('getSecurityStatus', () => {
    it('returns security status', async () => {
      const mockStatus = {
        security: { level: 'high', score: 95 },
        achievements: ['first_passkey', 'security_champion'],
        recentEvents: []
      };

      api.get.mockResolvedValue({
        data: { success: true, data: mockStatus }
      });

      const result = await passkeyService.getSecurityStatus();

      expect(api.get).toHaveBeenCalledWith('/passkey/security/status');
      expect(result).toEqual(mockStatus);
    });
  });

  describe('getSecurityRecommendations', () => {
    it('returns security recommendations', async () => {
      const mockRecommendations = {
        currentStatus: 'good',
        recommendations: [
          { type: 'add_backup_passkey', priority: 'medium' }
        ]
      };

      api.get.mockResolvedValue({
        data: { success: true, data: mockRecommendations }
      });

      const result = await passkeyService.getSecurityRecommendations();

      expect(api.get).toHaveBeenCalledWith('/passkey/security/recommendations');
      expect(result).toEqual(mockRecommendations);
    });
  });

  describe('complete2FA', () => {
    it('completes 2FA with temporary token', async () => {
      api.post.mockResolvedValue({
        data: { 
          success: true, 
          token: 'full-jwt-token',
          message: '2FA completed successfully'
        }
      });

      const result = await passkeyService.complete2FA('temp-token');

      expect(api.post).toHaveBeenCalledWith('/auth/complete-2fa', {
        temporaryToken: 'temp-token'
      });
      expect(result).toEqual({
        success: true,
        token: 'full-jwt-token',
        message: '2FA completed successfully'
      });
    });
  });

  describe('error handling', () => {
    it('provides user-friendly error messages', () => {
      const testCases = [
        { 
          error: { name: 'NotAllowedError' }, 
          expected: 'Authentication was cancelled. Please try again.' 
        },
        { 
          error: { name: 'SecurityError' }, 
          expected: 'Security error occurred. Please ensure you\'re on a secure connection.' 
        },
        { 
          error: { name: 'NetworkError' }, 
          expected: 'Network error. Please check your connection and try again.' 
        },
        { 
          error: { name: 'UnknownError' }, 
          expected: 'An unexpected error occurred. Please try again.' 
        }
      ];

      testCases.forEach(testCase => {
        const friendlyMessage = passkeyService.getErrorMessage(testCase.error);
        expect(friendlyMessage).toBe(testCase.expected);
      });
    });

    it('handles API error responses', () => {
      const apiError = {
        response: {
          data: { message: 'Custom API error message' }
        }
      };

      const friendlyMessage = passkeyService.getErrorMessage(apiError);
      expect(friendlyMessage).toBe('Custom API error message');
    });
  });
});
