const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const { authenticate } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Wallet address validation
const validateWalletAddress = [
  param('walletAddress')
    .isEthereumAddress()
    .withMessage('Invalid Ethereum wallet address'),
  handleValidationErrors
];

// Transaction eligibility validation
const validateTransactionEligibility = [
  param('walletAddress')
    .isEthereumAddress()
    .withMessage('Invalid Ethereum wallet address'),
  body('estimatedGasCost')
    .optional()
    .isDecimal({ decimal_digits: '0,18' })
    .withMessage('Invalid gas cost format'),
  body('transactionType')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Transaction type must be a string between 1-50 characters'),
  handleValidationErrors
];

// Security event validation
const validateSecurityEvent = [
  body('walletAddress')
    .isEthereumAddress()
    .withMessage('Invalid Ethereum wallet address'),
  body('eventType')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Event type must be a string between 1-50 characters'),
  body('severity')
    .isIn(['info', 'warning', 'error', 'critical'])
    .withMessage('Severity must be one of: info, warning, error, critical'),
  body('message')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be a string between 1-500 characters'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
  handleValidationErrors
];

// Security events query validation
const validateSecurityEventsQuery = [
  param('walletAddress')
    .isEthereumAddress()
    .withMessage('Invalid Ethereum wallet address'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1-100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  handleValidationErrors
];

/**
 * @route GET /api/security/status/:walletAddress
 * @desc Get security status for a wallet address
 * @access Private
 */
router.get('/status/:walletAddress',
  authenticate,
  validateWalletAddress,
  securityController.getSecurityStatus
);

/**
 * @route POST /api/security/check-eligibility/:walletAddress
 * @desc Check if a transaction can be sponsored (rate limiting check)
 * @access Private
 */
router.post('/check-eligibility/:walletAddress',
  authenticate,
  validateTransactionEligibility,
  securityController.checkTransactionEligibility
);

/**
 * @route GET /api/security/recommendations/:walletAddress
 * @desc Get security recommendations for a user
 * @access Private
 */
router.get('/recommendations/:walletAddress',
  authenticate,
  validateWalletAddress,
  securityController.getSecurityRecommendations
);

/**
 * @route POST /api/security/events
 * @desc Record a security event
 * @access Private
 */
router.post('/events',
  authenticate,
  validateSecurityEvent,
  securityController.recordSecurityEvent
);

/**
 * @route GET /api/security/events/:walletAddress
 * @desc Get security events for a wallet
 * @access Private
 */
router.get('/events/:walletAddress',
  authenticate,
  validateSecurityEventsQuery,
  securityController.getSecurityEvents
);

/**
 * @route GET /api/security/health
 * @desc Health check for security service
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Security service is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * @route GET /api/security/config
 * @desc Get security configuration (rate limits, etc.)
 * @access Private
 */
router.get('/config', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      rateLimits: {
        standard: {
          dailyGasLimit: '0.1', // ETH
          dailyTxLimit: 50,
          perTxGasLimit: '0.01' // ETH
        },
        whitelisted: {
          dailyGasLimit: '0.2', // ETH
          dailyTxLimit: 100,
          perTxGasLimit: '0.02' // ETH
        }
      },
      resetPeriod: '24h',
      monitoringInterval: '60s',
      features: {
        dosProtection: true,
        sybilProtection: true,
        realTimeMonitoring: true,
        whitelistSupport: true
      }
    }
  });
});

module.exports = router;
