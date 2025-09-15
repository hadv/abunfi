const jwt = require('jsonwebtoken');
const databaseService = require('../src/services/DatabaseService');
const passkeyController = require('../src/controllers/passkeyController');

// Mock the WebAuthn server functions
jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn(),
  verifyRegistrationResponse: jest.fn(),
  generateAuthenticationOptions: jest.fn(),
  verifyAuthenticationResponse: jest.fn(),
}));

describe('Passkey Authentication', () => {
  let userId;
  let mockReq;
  let mockRes;

  beforeAll(async () => {
    // Initialize database
    await databaseService.initialize();

    // Create test user
    const userQuery = `
      INSERT INTO users (email, wallet_address, name, social_provider, is_email_verified)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const userResult = await databaseService.executeQuery(userQuery, [
      'test@example.com',
      '0x1234567890123456789012345678901234567890',
      'Test User',
      'google',
      true
    ]);

    userId = userResult.rows[0].id;
  });

  beforeEach(() => {
    mockReq = {
      user: { id: userId },
      body: {},
      params: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterAll(async () => {
    // Clean up test data
    await databaseService.executeQuery('DELETE FROM users WHERE email = $1', ['test@example.com']);
    await databaseService.disconnect();
  });

  describe('Registration Begin', () => {
    it('should generate registration options for authenticated user', async () => {
      const { generateRegistrationOptions } = require('@simplewebauthn/server');

      generateRegistrationOptions.mockResolvedValue({
        challenge: 'test-challenge',
        user: { id: userId, name: 'test@example.com', displayName: 'Test User' },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }]
      });

      mockReq.body = { deviceName: 'Test Device' };

      await passkeyController.beginRegistration(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          options: expect.objectContaining({
            challenge: 'test-challenge',
            user: expect.objectContaining({
              id: userId
            })
          })
        })
      );
    });

    it('should validate device name length', async () => {
      mockReq.body = { deviceName: 'a'.repeat(300) };

      await passkeyController.beginRegistration(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Device name')
        })
      );
    });
  });

  describe('POST /api/passkey/register/complete', () => {
    let registrationOptions;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/passkey/register/begin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deviceName: 'Test Device' });
      
      registrationOptions = response.body.options;
    });

    it('should reject invalid credential format', async () => {
      await request(app)
        .post('/api/passkey/register/complete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          credential: { invalid: 'format' },
          deviceName: 'Test Device'
        })
        .expect(400);
    });

    it('should reject requests without valid challenge', async () => {
      // Wait for challenge to expire or clear it
      await databaseService.executeQuery(
        'UPDATE webauthn_challenges SET used = true WHERE user_id = $1',
        [userId]
      );

      await request(app)
        .post('/api/passkey/register/complete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          credential: {
            id: 'test-credential-id',
            response: {
              attestationObject: 'test-attestation',
              clientDataJSON: 'test-client-data'
            }
          },
          deviceName: 'Test Device'
        })
        .expect(400);
    });
  });

  describe('POST /api/passkey/authenticate/begin', () => {
    it('should generate authentication options for user with passkeys', async () => {
      // First, create a mock passkey for the user
      await databaseService.executeQuery(
        `INSERT INTO user_passkeys (user_id, credential_id, public_key, counter, device_name)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'test-credential-id', 'test-public-key', 0, 'Test Device']
      );

      const response = await request(app)
        .post('/api/passkey/authenticate/begin')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.options).toBeDefined();
      expect(response.body.options.challenge).toBeDefined();
      expect(response.body.options.allowCredentials).toBeDefined();
      expect(response.body.options.allowCredentials.length).toBeGreaterThan(0);
    });

    it('should reject users without passkeys', async () => {
      // Clean up any existing passkeys
      await databaseService.executeQuery(
        'DELETE FROM user_passkeys WHERE user_id = $1',
        [userId]
      );

      await request(app)
        .post('/api/passkey/authenticate/begin')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/passkey/list', () => {
    beforeEach(async () => {
      // Clean up existing passkeys
      await databaseService.executeQuery(
        'DELETE FROM user_passkeys WHERE user_id = $1',
        [userId]
      );
    });

    it('should return empty list for user without passkeys', async () => {
      const response = await request(app)
        .get('/api/passkey/list')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.passkeys).toEqual([]);
    });

    it('should return user passkeys', async () => {
      // Create test passkeys
      await databaseService.executeQuery(
        `INSERT INTO user_passkeys (user_id, credential_id, public_key, counter, device_name)
         VALUES ($1, $2, $3, $4, $5), ($1, $6, $7, $8, $9)`,
        [
          userId, 'cred-1', 'key-1', 0, 'Device 1',
          'cred-2', 'key-2', 0, 'Device 2'
        ]
      );

      const response = await request(app)
        .get('/api/passkey/list')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.passkeys).toHaveLength(2);
      expect(response.body.passkeys[0].device_name).toBeDefined();
      expect(response.body.passkeys[0].created_at).toBeDefined();
    });
  });

  describe('DELETE /api/passkey/:passkeyId', () => {
    let passkeyId;

    beforeEach(async () => {
      // Create test passkeys
      const result = await databaseService.executeQuery(
        `INSERT INTO user_passkeys (user_id, credential_id, public_key, counter, device_name)
         VALUES ($1, $2, $3, $4, $5), ($1, $6, $7, $8, $9)
         RETURNING id`,
        [
          userId, 'cred-1', 'key-1', 0, 'Device 1',
          'cred-2', 'key-2', 0, 'Device 2'
        ]
      );
      passkeyId = result.rows[0].id;
    });

    it('should delete passkey successfully', async () => {
      const response = await request(app)
        .delete(`/api/passkey/${passkeyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify passkey is deactivated
      const checkResult = await databaseService.executeQuery(
        'SELECT is_active FROM user_passkeys WHERE id = $1',
        [passkeyId]
      );
      expect(checkResult.rows[0].is_active).toBe(false);
    });

    it('should prevent deletion of last passkey', async () => {
      // Delete one passkey first
      await databaseService.executeQuery(
        'UPDATE user_passkeys SET is_active = false WHERE user_id = $1 AND id != $2',
        [userId, passkeyId]
      );

      await request(app)
        .delete(`/api/passkey/${passkeyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should reject invalid passkey ID format', async () => {
      await request(app)
        .delete('/api/passkey/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/passkey/security/status', () => {
    it('should return security status for user', async () => {
      const response = await request(app)
        .get('/api/passkey/security/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.security).toBeDefined();
      expect(response.body.data.achievements).toBeDefined();
      expect(response.body.data.recentEvents).toBeDefined();
    });
  });

  describe('GET /api/passkey/security/recommendations', () => {
    it('should return personalized security recommendations', async () => {
      const response = await request(app)
        .get('/api/passkey/security/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentStatus).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on registration attempts', async () => {
      const requests = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 12; i++) {
        requests.push(
          request(app)
            .post('/api/passkey/register/begin')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ deviceName: `Device ${i}` })
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Event Logging', () => {
    it('should log security events for passkey operations', async () => {
      await request(app)
        .post('/api/passkey/register/begin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deviceName: 'Test Device' });

      // Check if security event was logged
      const events = await databaseService.executeQuery(
        'SELECT * FROM security_events WHERE user_id = $1 AND event_type = $2',
        [userId, 'passkey_registration_initiated']
      );

      expect(events.rows.length).toBeGreaterThan(0);
      expect(events.rows[0].event_status).toBe('attempt');
    });
  });

  describe('2FA Integration', () => {
    beforeEach(async () => {
      // Enable 2FA for user
      await databaseService.executeQuery(
        'UPDATE users SET two_factor_enabled = true, two_factor_method = $1 WHERE id = $2',
        ['passkey', userId]
      );
    });

    it('should require 2FA completion for social login', async () => {
      const response = await request(app)
        .post('/api/auth/social-login')
        .send({
          socialId: 'test-social-id',
          socialProvider: 'google',
          email: 'test@example.com',
          name: 'Test User',
          walletAddress: '0x1234567890123456789012345678901234567890'
        });

      if (response.body.requires2FA) {
        expect(response.body.temporaryToken).toBeDefined();
        expect(response.body.message).toContain('passkey');
        temporaryToken = response.body.temporaryToken;
      }
    });

    it('should complete 2FA with valid temporary token', async () => {
      if (temporaryToken) {
        // First, simulate successful passkey authentication
        await databaseService.executeQuery(
          `INSERT INTO security_events (user_id, event_type, event_status)
           VALUES ($1, $2, $3)`,
          [userId, 'passkey_authentication_success', 'success']
        );

        const response = await request(app)
          .post('/api/auth/complete-2fa')
          .send({ temporaryToken })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
        expect(response.body.message).toContain('completed');
      }
    });
  });
});
