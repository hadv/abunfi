const express = require('express');
const { body, param } = require('express-validator');
const zkVMController = require('../controllers/zkVMController');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

/**
 * Start verification
 * POST /api/zkvm/verify
 */
router.post('/verify',
  [
    body('platform')
      .notEmpty()
      .withMessage('Platform is required')
      .isIn(['twitter', 'discord', 'github', 'telegram', 'linkedin'])
      .withMessage('Invalid platform'),
    body('oauth_token')
      .notEmpty()
      .withMessage('OAuth token is required'),
    body('wallet_address')
      .notEmpty()
      .withMessage('Wallet address is required')
      .isEthereumAddress()
      .withMessage('Invalid wallet address'),
    body('request_id')
      .optional()
      .isString()
      .withMessage('Request ID must be a string')
  ],
  validateRequest,
  zkVMController.startVerification
);

/**
 * Get verification status
 * GET /api/zkvm/status/:verificationId
 */
router.get('/status/:verificationId',
  [
    param('verificationId')
      .notEmpty()
      .withMessage('Verification ID is required')
  ],
  validateRequest,
  zkVMController.getStatus
);

/**
 * Health check
 * GET /api/zkvm/health
 */
router.get('/health', zkVMController.healthCheck);

module.exports = router;

