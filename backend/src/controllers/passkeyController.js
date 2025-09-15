const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { v4: uuidv4 } = require('uuid');
const databaseService = require('../services/DatabaseService');
const logger = require('../utils/logger');

class PasskeyController {
  constructor() {
    // WebAuthn configuration
    this.rpName = 'Abunfi';
    this.rpID = process.env.NODE_ENV === 'production' ? 'abunfi.com' : 'localhost';
    this.origin = process.env.NODE_ENV === 'production' 
      ? 'https://abunfi.com' 
      : 'http://localhost:3000';
    this.expectedOrigin = [this.origin];
  }

  /**
   * Generate registration options for a new passkey
   */
  async generateRegistrationOptions(req, res) {
    try {
      const { userId } = req.user;
      const { deviceName } = req.body;

      // Get user information
      const userQuery = `
        SELECT id, email, name FROM users WHERE id = $1 AND is_active = true
      `;
      const userResult = await databaseService.executeQuery(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];

      // Get existing passkeys for this user
      const existingPasskeysQuery = `
        SELECT credential_id FROM user_passkeys 
        WHERE user_id = $1 AND is_active = true
      `;
      const existingPasskeys = await databaseService.executeQuery(existingPasskeysQuery, [userId]);
      
      const excludeCredentials = existingPasskeys.rows.map(row => ({
        id: row.credential_id,
        type: 'public-key',
      }));

      // Generate registration options
      const options = await generateRegistrationOptions({
        rpName: this.rpName,
        rpID: this.rpID,
        userID: userId,
        userName: user.email,
        userDisplayName: user.name,
        attestationType: 'none',
        excludeCredentials,
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
          authenticatorAttachment: 'platform', // Prefer platform authenticators (Face ID, Touch ID, Windows Hello)
        },
        supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
      });

      // Store challenge in database
      const challengeQuery = `
        INSERT INTO webauthn_challenges (
          user_id, challenge, challenge_type, rp_id, user_handle, timeout
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      
      await databaseService.executeQuery(challengeQuery, [
        userId,
        options.challenge,
        'registration',
        this.rpID,
        options.user.id,
        options.timeout || 60000
      ]);

      // Log security event
      await this.logSecurityEvent(userId, 'passkey_registration_initiated', 'attempt', req);

      res.json({
        success: true,
        options,
        deviceName: deviceName || 'New Device'
      });

    } catch (error) {
      logger.error('Generate registration options error:', error);
      res.status(500).json({ error: 'Failed to generate registration options' });
    }
  }

  /**
   * Verify registration response and store the new passkey
   */
  async verifyRegistration(req, res) {
    try {
      const { userId } = req.user;
      const { credential, deviceName } = req.body;

      if (!credential) {
        return res.status(400).json({ error: 'Credential is required' });
      }

      // Get the stored challenge
      const challengeQuery = `
        SELECT challenge, user_handle FROM webauthn_challenges 
        WHERE user_id = $1 AND challenge_type = 'registration' 
        AND used = false AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1
      `;
      
      const challengeResult = await databaseService.executeQuery(challengeQuery, [userId]);
      
      if (challengeResult.rows.length === 0) {
        return res.status(400).json({ error: 'No valid challenge found' });
      }

      const { challenge } = challengeResult.rows[0];

      // Verify the registration response
      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: challenge,
        expectedOrigin: this.expectedOrigin,
        expectedRPID: this.rpID,
        requireUserVerification: true,
      });

      if (!verification.verified || !verification.registrationInfo) {
        await this.logSecurityEvent(userId, 'passkey_registration_failed', 'failure', req);
        return res.status(400).json({ error: 'Registration verification failed' });
      }

      const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      // Store the new passkey
      const passkeyQuery = `
        INSERT INTO user_passkeys (
          user_id, credential_id, public_key, counter, device_name, 
          device_type, backup_eligible, backup_state, 
          authenticator_attachment, transports
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;

      const passkeyResult = await databaseService.executeQuery(passkeyQuery, [
        userId,
        Buffer.from(credentialID).toString('base64url'),
        Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
        deviceName || 'New Device',
        credentialDeviceType,
        credentialBackedUp,
        credentialBackedUp,
        'platform', // Assume platform for now
        JSON.stringify(['internal']) // Default transport
      ]);

      // Mark challenge as used
      await databaseService.executeQuery(
        'UPDATE webauthn_challenges SET used = true WHERE user_id = $1 AND challenge = $2',
        [userId, challenge]
      );

      // Enable 2FA for user if this is their first passkey
      const passkeyCountQuery = `
        SELECT COUNT(*) as count FROM user_passkeys 
        WHERE user_id = $1 AND is_active = true
      `;
      const countResult = await databaseService.executeQuery(passkeyCountQuery, [userId]);
      const passkeyCount = parseInt(countResult.rows[0].count);

      if (passkeyCount === 1) {
        // First passkey - enable 2FA and create security preferences
        await databaseService.executeQuery(
          `UPDATE users SET 
           two_factor_enabled = true, 
           two_factor_method = 'passkey',
           two_factor_setup_at = NOW()
           WHERE id = $1`,
          [userId]
        );

        // Create security preferences record
        await databaseService.executeQuery(
          `INSERT INTO user_security_preferences (user_id, passkey_preferred, security_level)
           VALUES ($1, true, 'enhanced')
           ON CONFLICT (user_id) DO UPDATE SET
           passkey_preferred = true, security_level = 'enhanced', updated_at = NOW()`,
          [userId]
        );

        // Award first passkey achievement
        await this.awardAchievement(
          userId,
          'first_passkey',
          'First Passkey Setup',
          'Congratulations! You have successfully set up your first passkey for enhanced security.',
          0.005, // 0.005 USDC bonus
          'yield_boost',
          30
        );
      }

      // Log successful registration
      await this.logSecurityEvent(userId, 'passkey_registered', 'success', req, {
        deviceName: deviceName || 'New Device',
        credentialId: Buffer.from(credentialID).toString('base64url'),
        passkeyCount
      });

      res.json({
        success: true,
        message: 'Passkey registered successfully',
        passkeyId: passkeyResult.rows[0].id,
        isFirstPasskey: passkeyCount === 1,
        securityLevel: passkeyCount === 1 ? 'enhanced' : 'basic'
      });

    } catch (error) {
      logger.error('Verify registration error:', error);
      await this.logSecurityEvent(req.user?.userId, 'passkey_registration_error', 'failure', req, {
        error: error.message
      });
      res.status(500).json({ error: 'Registration verification failed' });
    }
  }

  /**
   * Generate authentication options for passkey login
   */
  async generateAuthenticationOptions(req, res) {
    try {
      const { userId } = req.user;

      // Get user's active passkeys
      const passkeysQuery = `
        SELECT credential_id FROM user_passkeys 
        WHERE user_id = $1 AND is_active = true
      `;
      const passkeysResult = await databaseService.executeQuery(passkeysQuery, [userId]);

      if (passkeysResult.rows.length === 0) {
        return res.status(400).json({ error: 'No passkeys found for user' });
      }

      const allowCredentials = passkeysResult.rows.map(row => ({
        id: row.credential_id,
        type: 'public-key',
        transports: ['internal', 'usb', 'nfc', 'ble'],
      }));

      // Generate authentication options
      const options = await generateAuthenticationOptions({
        rpID: this.rpID,
        allowCredentials,
        userVerification: 'preferred',
        timeout: 60000,
      });

      // Store challenge
      const challengeQuery = `
        INSERT INTO webauthn_challenges (
          user_id, challenge, challenge_type, rp_id, timeout
        ) VALUES ($1, $2, $3, $4, $5)
      `;
      
      await databaseService.executeQuery(challengeQuery, [
        userId,
        options.challenge,
        'authentication',
        this.rpID,
        60000
      ]);

      // Log authentication attempt
      await this.logSecurityEvent(userId, 'passkey_authentication_initiated', 'attempt', req);

      res.json({
        success: true,
        options
      });

    } catch (error) {
      logger.error('Generate authentication options error:', error);
      res.status(500).json({ error: 'Failed to generate authentication options' });
    }
  }

  /**
   * Verify authentication response
   */
  async verifyAuthentication(req, res) {
    try {
      const { userId } = req.user;
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({ error: 'Credential is required' });
      }

      // Get the stored challenge
      const challengeQuery = `
        SELECT challenge FROM webauthn_challenges 
        WHERE user_id = $1 AND challenge_type = 'authentication' 
        AND used = false AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1
      `;
      
      const challengeResult = await databaseService.executeQuery(challengeQuery, [userId]);
      
      if (challengeResult.rows.length === 0) {
        return res.status(400).json({ error: 'No valid challenge found' });
      }

      const { challenge } = challengeResult.rows[0];

      // Get the passkey data
      const passkeyQuery = `
        SELECT id, public_key, counter FROM user_passkeys 
        WHERE user_id = $1 AND credential_id = $2 AND is_active = true
      `;
      
      const credentialID = credential.id;
      const passkeyResult = await databaseService.executeQuery(passkeyQuery, [userId, credentialID]);
      
      if (passkeyResult.rows.length === 0) {
        await this.logSecurityEvent(userId, 'passkey_authentication_failed', 'failure', req, {
          reason: 'Passkey not found'
        });
        return res.status(400).json({ error: 'Passkey not found' });
      }

      const passkey = passkeyResult.rows[0];

      // Verify the authentication response
      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: challenge,
        expectedOrigin: this.expectedOrigin,
        expectedRPID: this.rpID,
        authenticator: {
          credentialID: Buffer.from(credentialID, 'base64url'),
          credentialPublicKey: Buffer.from(passkey.public_key, 'base64url'),
          counter: passkey.counter,
        },
        requireUserVerification: true,
      });

      if (!verification.verified) {
        await this.logSecurityEvent(userId, 'passkey_authentication_failed', 'failure', req);
        return res.status(400).json({ error: 'Authentication verification failed' });
      }

      // Update passkey counter and usage
      await databaseService.executeQuery(
        `UPDATE user_passkeys SET 
         counter = $1, last_used_at = NOW(), usage_count = usage_count + 1 
         WHERE id = $2`,
        [verification.authenticationInfo.newCounter, passkey.id]
      );

      // Mark challenge as used
      await databaseService.executeQuery(
        'UPDATE webauthn_challenges SET used = true WHERE user_id = $1 AND challenge = $2',
        [userId, challenge]
      );

      // Log successful authentication
      await this.logSecurityEvent(userId, 'passkey_authentication_success', 'success', req, {
        passkeyId: passkey.id
      });

      res.json({
        success: true,
        message: 'Authentication successful',
        verified: true
      });

    } catch (error) {
      logger.error('Verify authentication error:', error);
      await this.logSecurityEvent(req.user?.userId, 'passkey_authentication_error', 'failure', req, {
        error: error.message
      });
      res.status(500).json({ error: 'Authentication verification failed' });
    }
  }

  /**
   * Get user's passkeys
   */
  async getUserPasskeys(req, res) {
    try {
      const { userId } = req.user;

      const passkeysQuery = `
        SELECT 
          id, device_name, device_type, authenticator_attachment,
          backup_eligible, backup_state, last_used_at, usage_count,
          created_at, is_active
        FROM user_passkeys 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `;
      
      const result = await databaseService.executeQuery(passkeysQuery, [userId]);

      res.json({
        success: true,
        passkeys: result.rows
      });

    } catch (error) {
      logger.error('Get user passkeys error:', error);
      res.status(500).json({ error: 'Failed to retrieve passkeys' });
    }
  }

  /**
   * Delete a passkey
   */
  async deletePasskey(req, res) {
    try {
      const { userId } = req.user;
      const { passkeyId } = req.params;

      // Check if this is the user's last passkey
      const countQuery = `
        SELECT COUNT(*) as count FROM user_passkeys 
        WHERE user_id = $1 AND is_active = true
      `;
      const countResult = await databaseService.executeQuery(countQuery, [userId]);
      const activeCount = parseInt(countResult.rows[0].count);

      if (activeCount <= 1) {
        return res.status(400).json({ 
          error: 'Cannot delete the last passkey. Add another passkey first.' 
        });
      }

      // Deactivate the passkey
      const deleteQuery = `
        UPDATE user_passkeys 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND is_active = true
        RETURNING device_name
      `;
      
      const result = await databaseService.executeQuery(deleteQuery, [passkeyId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Passkey not found' });
      }

      // Log the deletion
      await this.logSecurityEvent(userId, 'passkey_deleted', 'success', req, {
        passkeyId,
        deviceName: result.rows[0].device_name
      });

      res.json({
        success: true,
        message: 'Passkey deleted successfully'
      });

    } catch (error) {
      logger.error('Delete passkey error:', error);
      res.status(500).json({ error: 'Failed to delete passkey' });
    }
  }

  /**
   * Log security events
   */
  async logSecurityEvent(userId, eventType, eventStatus, req, metadata = {}) {
    try {
      const eventQuery = `
        INSERT INTO security_events (
          user_id, event_type, event_status, ip_address, user_agent, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      await databaseService.executeQuery(eventQuery, [
        userId,
        eventType,
        eventStatus,
        req.ip || req.connection?.remoteAddress,
        req.get('User-Agent'),
        JSON.stringify(metadata)
      ]);
    } catch (error) {
      logger.error('Log security event error:', error);
    }
  }

  /**
   * Award security achievement
   */
  async awardAchievement(userId, achievementType, name, description, bonusAmount, bonusType, durationDays) {
    try {
      const achievementQuery = `
        SELECT award_security_achievement($1, $2, $3, $4, $5, $6, $7) as achievement_id
      `;
      
      const result = await databaseService.executeQuery(achievementQuery, [
        userId, achievementType, name, description, bonusAmount, bonusType, durationDays
      ]);

      if (result.rows[0].achievement_id) {
        logger.info(`Achievement awarded: ${achievementType} to user ${userId}`);
        return result.rows[0].achievement_id;
      }
    } catch (error) {
      logger.error('Award achievement error:', error);
    }
  }
}

module.exports = new PasskeyController();
