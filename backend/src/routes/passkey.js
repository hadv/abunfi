const express = require('express');
const { body, param, query } = require('express-validator');
const passkeyController = require('../controllers/passkeyController');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for passkey operations
const passkeyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many passkey requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for registration
const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 registration attempts per hour
  message: {
    error: 'Too many registration attempts from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateDeviceName = [
  body('deviceName')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Device name must be between 1 and 255 characters')
    .trim()
    .escape()
];

const validateCredential = [
  body('credential')
    .notEmpty()
    .withMessage('Credential is required')
    .isObject()
    .withMessage('Credential must be an object'),
  body('credential.id')
    .notEmpty()
    .withMessage('Credential ID is required'),
  body('credential.response')
    .notEmpty()
    .withMessage('Credential response is required')
    .isObject()
    .withMessage('Credential response must be an object')
];

const validatePasskeyId = [
  param('passkeyId')
    .isUUID()
    .withMessage('Invalid passkey ID format')
];

/**
 * @route POST /api/passkey/register/begin
 * @desc Generate registration options for a new passkey
 * @access Private
 */
router.post('/register/begin',
  authenticate,
  passkeyRateLimit,
  registrationRateLimit,
  validateDeviceName,
  validateRequest,
  passkeyController.generateRegistrationOptions
);

/**
 * @route POST /api/passkey/register/complete
 * @desc Verify registration response and store the new passkey
 * @access Private
 */
router.post('/register/complete',
  authenticate,
  passkeyRateLimit,
  registrationRateLimit,
  [
    ...validateCredential,
    ...validateDeviceName
  ],
  validateRequest,
  passkeyController.verifyRegistration
);

/**
 * @route POST /api/passkey/authenticate/begin
 * @desc Generate authentication options for passkey login
 * @access Private
 */
router.post('/authenticate/begin',
  authenticate,
  passkeyRateLimit,
  validateRequest,
  passkeyController.generateAuthenticationOptions
);

/**
 * @route POST /api/passkey/authenticate/complete
 * @desc Verify authentication response
 * @access Private
 */
router.post('/authenticate/complete',
  authenticate,
  passkeyRateLimit,
  validateCredential,
  validateRequest,
  passkeyController.verifyAuthentication
);

/**
 * @route GET /api/passkey/list
 * @desc Get user's passkeys
 * @access Private
 */
router.get('/list',
  authenticate,
  passkeyController.getUserPasskeys
);

/**
 * @route DELETE /api/passkey/:passkeyId
 * @desc Delete a passkey
 * @access Private
 */
router.delete('/:passkeyId',
  authenticate,
  passkeyRateLimit,
  validatePasskeyId,
  validateRequest,
  passkeyController.deletePasskey
);

/**
 * @route GET /api/passkey/security/status
 * @desc Get user's security status and achievements
 * @access Private
 */
router.get('/security/status',
  authenticate,
  async (req, res) => {
    try {
      const { userId } = req.user;
      const databaseService = require('../services/DatabaseService');

      // Get security preferences
      const securityQuery = `
        SELECT 
          usp.*,
          u.two_factor_enabled,
          u.two_factor_method,
          u.two_factor_setup_at,
          (SELECT COUNT(*) FROM user_passkeys WHERE user_id = $1 AND is_active = true) as passkey_count
        FROM user_security_preferences usp
        RIGHT JOIN users u ON u.id = usp.user_id
        WHERE u.id = $1
      `;
      
      const securityResult = await databaseService.executeQuery(securityQuery, [userId]);
      const security = securityResult.rows[0] || {};

      // Get active achievements
      const achievementsQuery = `
        SELECT * FROM security_achievements 
        WHERE user_id = $1 AND is_active = true 
        ORDER BY created_at DESC
      `;
      
      const achievementsResult = await databaseService.executeQuery(achievementsQuery, [userId]);

      // Get recent security events
      const eventsQuery = `
        SELECT event_type, event_status, created_at, metadata
        FROM security_events 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 10
      `;
      
      const eventsResult = await databaseService.executeQuery(eventsQuery, [userId]);

      res.json({
        success: true,
        data: {
          security: {
            twoFactorEnabled: security.two_factor_enabled || false,
            twoFactorMethod: security.two_factor_method || 'none',
            passkeyCount: parseInt(security.passkey_count) || 0,
            securityLevel: security.security_level || 'basic',
            trustScore: security.trust_score || 50,
            securityScore: security.security_score || 0,
            enhancedLimitsEnabled: security.enhanced_limits_enabled || false,
            securityBonusEarned: security.security_bonus_earned || 0
          },
          achievements: achievementsResult.rows,
          recentEvents: eventsResult.rows
        }
      });

    } catch (error) {
      console.error('Get security status error:', error);
      res.status(500).json({ error: 'Failed to retrieve security status' });
    }
  }
);

/**
 * @route POST /api/passkey/security/claim-achievement
 * @desc Claim a security achievement reward
 * @access Private
 */
router.post('/security/claim-achievement',
  authenticate,
  [
    body('achievementId')
      .isUUID()
      .withMessage('Invalid achievement ID format')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { userId } = req.user;
      const { achievementId } = req.body;
      const databaseService = require('../services/DatabaseService');

      // Verify achievement belongs to user and is claimable
      const achievementQuery = `
        SELECT * FROM security_achievements 
        WHERE id = $1 AND user_id = $2 AND is_active = true AND claimed = false
        AND (bonus_expires_at IS NULL OR bonus_expires_at > NOW())
      `;
      
      const achievementResult = await databaseService.executeQuery(achievementQuery, [achievementId, userId]);
      
      if (achievementResult.rows.length === 0) {
        return res.status(404).json({ error: 'Achievement not found or already claimed' });
      }

      const achievement = achievementResult.rows[0];

      // Mark achievement as claimed
      await databaseService.executeQuery(
        'UPDATE security_achievements SET claimed = true, claimed_at = NOW() WHERE id = $1',
        [achievementId]
      );

      // Apply the bonus (this would integrate with your existing bonus system)
      if (achievement.bonus_amount > 0) {
        // Add bonus to user's security preferences
        await databaseService.executeQuery(
          `UPDATE user_security_preferences 
           SET security_bonus_earned = security_bonus_earned + $1,
               last_security_bonus_at = NOW()
           WHERE user_id = $2`,
          [achievement.bonus_amount, userId]
        );
      }

      // Log the claim event
      await passkeyController.logSecurityEvent(userId, 'achievement_claimed', 'success', req, {
        achievementId,
        achievementType: achievement.achievement_type,
        bonusAmount: achievement.bonus_amount
      });

      res.json({
        success: true,
        message: 'Achievement claimed successfully',
        achievement: {
          name: achievement.achievement_name,
          description: achievement.achievement_description,
          bonusAmount: achievement.bonus_amount,
          bonusType: achievement.bonus_type
        }
      });

    } catch (error) {
      console.error('Claim achievement error:', error);
      res.status(500).json({ error: 'Failed to claim achievement' });
    }
  }
);

/**
 * @route GET /api/passkey/security/recommendations
 * @desc Get personalized security recommendations
 * @access Private
 */
router.get('/security/recommendations',
  authenticate,
  async (req, res) => {
    try {
      const { userId } = req.user;
      const databaseService = require('../services/DatabaseService');

      // Get user's current security status
      const statusQuery = `
        SELECT 
          u.two_factor_enabled,
          u.two_factor_method,
          u.is_email_verified,
          u.kyc_status,
          (SELECT COUNT(*) FROM user_passkeys WHERE user_id = $1 AND is_active = true) as passkey_count,
          usp.security_level,
          usp.trust_score
        FROM users u
        LEFT JOIN user_security_preferences usp ON u.id = usp.user_id
        WHERE u.id = $1
      `;
      
      const statusResult = await databaseService.executeQuery(statusQuery, [userId]);
      const status = statusResult.rows[0];

      const recommendations = [];

      // Generate personalized recommendations
      if (!status.two_factor_enabled) {
        recommendations.push({
          type: 'critical',
          title: 'Enable Two-Factor Authentication',
          description: 'Secure your account with passkey authentication for enhanced protection.',
          action: 'setup_2fa',
          reward: 'Unlock enhanced transaction limits and security bonuses',
          priority: 1
        });
      }

      if (status.passkey_count === 0) {
        recommendations.push({
          type: 'high',
          title: 'Add Your First Passkey',
          description: 'Set up a passkey for secure, passwordless authentication.',
          action: 'add_passkey',
          reward: '0.005 USDC bonus + 30-day yield boost',
          priority: 2
        });
      }

      if (status.passkey_count === 1) {
        recommendations.push({
          type: 'medium',
          title: 'Add Backup Passkey',
          description: 'Add a second passkey to ensure you never lose access to your account.',
          action: 'add_backup_passkey',
          reward: 'Increased trust score + backup security',
          priority: 3
        });
      }

      if (!status.is_email_verified) {
        recommendations.push({
          type: 'medium',
          title: 'Verify Your Email',
          description: 'Verify your email address for account recovery and notifications.',
          action: 'verify_email',
          reward: '+10 trust score points',
          priority: 4
        });
      }

      if (status.kyc_status !== 'verified') {
        recommendations.push({
          type: 'low',
          title: 'Complete KYC Verification',
          description: 'Complete identity verification for higher limits and premium features.',
          action: 'complete_kyc',
          reward: '+20 trust score + premium features',
          priority: 5
        });
      }

      res.json({
        success: true,
        data: {
          currentStatus: {
            securityLevel: status.security_level || 'basic',
            trustScore: status.trust_score || 50,
            twoFactorEnabled: status.two_factor_enabled,
            passkeyCount: parseInt(status.passkey_count) || 0
          },
          recommendations: recommendations.sort((a, b) => a.priority - b.priority)
        }
      });

    } catch (error) {
      console.error('Get security recommendations error:', error);
      res.status(500).json({ error: 'Failed to retrieve security recommendations' });
    }
  }
);

module.exports = router;
