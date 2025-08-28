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

module.exports = router;
