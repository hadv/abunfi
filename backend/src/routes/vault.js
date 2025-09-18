const express = require('express');
const { body, query } = require('express-validator');
const vaultController = require('../controllers/vaultController');
const { validateRequest } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get vault statistics
router.get('/stats', vaultController.getVaultStats);

// Get user portfolio
router.get('/portfolio', authenticate, vaultController.getUserPortfolio);

// Get deposit estimation
router.post('/estimate-deposit',
  authenticate,
  [
    body('amount').isFloat({ min: 4 }).withMessage('Minimum deposit is $4 USDC')
  ],
  validateRequest,
  vaultController.estimateDeposit
);

// Get withdraw estimation
router.post('/estimate-withdraw',
  authenticate,
  [
    body('shares').isFloat({ min: 0 }).withMessage('Shares must be positive')
  ],
  validateRequest,
  vaultController.estimateWithdraw
);

// Prepare deposit transaction
router.post('/prepare-deposit',
  authenticate,
  [
    body('amount').isFloat({ min: 4 }).withMessage('Minimum deposit is $4 USDC')
  ],
  validateRequest,
  vaultController.prepareDeposit
);

// Prepare withdraw transaction
router.post('/prepare-withdraw',
  authenticate,
  [
    body('shares').isFloat({ min: 0 }).withMessage('Shares must be positive')
  ],
  validateRequest,
  vaultController.prepareWithdraw
);

// Get current APY
router.get('/apy', vaultController.getCurrentAPY);

// Get yield history
router.get('/yield-history',
  authenticate,
  [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
  ],
  validateRequest,
  vaultController.getYieldHistory
);

// ============ BATCHING SYSTEM ROUTES ============

// Get batching configuration
router.get('/batching/config', vaultController.getBatchingConfig);

// Get pending allocations by risk level
router.get('/batching/pending', vaultController.getPendingAllocations);

// Check if batch allocation should be triggered
router.get('/batching/check', vaultController.checkBatchAllocation);

// Trigger batch allocation manually
router.post('/batching/trigger', authenticate, vaultController.triggerBatchAllocation);

// Get batch allocation history
router.get('/batching/history',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  validateRequest,
  vaultController.getBatchHistory
);

// Get estimated gas savings from batching
router.post('/batching/gas-estimate',
  [
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive')
  ],
  validateRequest,
  vaultController.getGasSavingsEstimate
);

module.exports = router;
