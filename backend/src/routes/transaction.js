const express = require('express');
const { query } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const { validateRequest } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user transactions
router.get('/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isIn(['deposit', 'withdraw', 'yield_harvest', 'referral_bonus']).withMessage('Invalid transaction type'),
    query('status').optional().isIn(['pending', 'confirmed', 'failed', 'cancelled']).withMessage('Invalid status')
  ],
  validateRequest,
  transactionController.getUserTransactions
);

// Get transaction by ID
router.get('/:id',
  authenticate,
  transactionController.getTransactionById
);

// Get user transaction stats
router.get('/stats/summary',
  authenticate,
  transactionController.getUserTransactionStats
);

module.exports = router;
